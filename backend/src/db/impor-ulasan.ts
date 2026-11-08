import type { Sql } from "../lib/db";
import { cocokKunci, kunciProduk, tebakVarian, type VarianKatalog } from "../lib/cocok-produk";
import type { SumberImpor, UlasanImporBersih } from "../lib/ulasan";

export type TebakanVarian = { slug: string; dari: "alias" | "mirip" } | null;

export type CiriUlasan = {
  nama_asli: string;
  nama_samaran: string;
  rating: number;
  body: string | null;
  reviewed_at: string | null;
  variant_id?: number | null;
};

export type BarisImpor = UlasanImporBersih & {
  variant_slug: string;
  reviewed_precision: "day" | "month";
  produk_marketplace: string | null;
};

export type HasilSimpanMassal =
  | { ok: true; masuk: number; kembar: number }
  | { ok: false; alasan: "unknown_variant"; slug: string[] };

export async function katalogVarian(sql: Sql): Promise<VarianKatalog[]> {
  const baris = await sql<VarianKatalog[]>`
    select v.slug, v.label, p.name as produk
    from product_variants v
    join products p on p.id = v.product_id
    order by p.is_active desc, v.is_active desc, p.sort_order, v.sort_order, v.id
  `;

  return [...baris];
}

export async function tebakVarianUntuk(
  sql: Sql,
  source: SumberImpor,
  namaMarketplace: (string | null)[],
): Promise<TebakanVarian[]> {
  const alias = await sql<{ product_key: string; slug: string }[]>`
    select a.product_key, v.slug
    from review_product_aliases a
    join product_variants v on v.id = a.variant_id
    where a.source = ${source}
    order by a.updated_at desc
  `;
  const katalog = await katalogVarian(sql);

  return namaMarketplace.map((nama) => {
    if (!nama) return null;

    const kunci = kunciProduk(nama);
    const ingat = alias.find((a) => a.product_key === kunci) ?? alias.find((a) => cocokKunci(kunci, a.product_key));
    if (ingat) return { slug: ingat.slug, dari: "alias" };

    const slug = tebakVarian(nama, katalog);
    return slug ? { slug, dari: "mirip" } : null;
  });
}

export async function cariUlasanKembar(sql: Sql, source: SumberImpor, daftar: CiriUlasan[]): Promise<boolean[]> {
  if (daftar.length === 0) return [];

  const isi = daftar.map((d, i) => ({ i, ...d, variant_id: d.variant_id ?? null }));
  const kembar = await sql<{ i: number }[]>`
    select x.i
    from jsonb_to_recordset(${sql.json(isi)}) as x(
      i int, nama_asli text, nama_samaran text, rating int, body text, reviewed_at timestamptz, variant_id bigint
    )
    where exists (
      select 1
      from reviews r
      where r.source = ${source}
        and r.rating = x.rating
        and coalesce(r.body, '') = coalesce(x.body, '')
        and (x.variant_id is null or r.variant_id = x.variant_id)
        and (r.author_name_raw = x.nama_asli or r.author_name = x.nama_samaran)
        and (
          (
            r.reviewed_precision = 'day'
            and x.reviewed_at is not null
            and (r.reviewed_at at time zone 'Asia/Jakarta')::date = (x.reviewed_at at time zone 'Asia/Jakarta')::date
          )
          or (r.reviewed_precision <> 'day' and x.body is not null)
        )
    )
  `;
  const ada = new Set(kembar.map((k) => k.i));

  return daftar.map((_, i) => ada.has(i));
}

function hariWib(iso: string): string {
  return new Date(Date.parse(iso) + 7 * 3600e3).toISOString().slice(0, 10);
}

export async function simpanUlasanMassal(
  sql: Sql,
  source: SumberImpor,
  daftar: BarisImpor[],
): Promise<HasilSimpanMassal> {
  return sql.begin(async (tx) => {
    const slugs = [...new Set(daftar.map((d) => d.variant_slug))];
    const varian = await tx<{ id: number; slug: string }[]>`
      select id::int as id, slug
      from product_variants
      where slug in (select jsonb_array_elements_text(${tx.json(slugs)}))
    `;
    const idVarian = new Map(varian.map((v) => [v.slug, v.id]));
    const hilang = slugs.filter((s) => !idVarian.has(s));

    if (hilang.length > 0) return { ok: false, alasan: "unknown_variant", slug: hilang } as const;

    const dilihat = new Set<string>();
    const unik = daftar.filter((d) => {
      const kunci = [
        d.variant_slug,
        d.author_name_raw ?? d.author_name,
        d.rating,
        d.body ?? "",
        hariWib(d.reviewed_at),
      ].join("|");
      if (dilihat.has(kunci)) return false;
      dilihat.add(kunci);
      return true;
    });

    const kembar = await cariUlasanKembar(
      tx as unknown as Sql,
      source,
      unik.map((d) => ({
        nama_asli: d.author_name_raw ?? d.author_name,
        nama_samaran: d.author_name,
        rating: d.rating,
        body: d.body,
        reviewed_at: d.reviewed_at,
        variant_id: idVarian.get(d.variant_slug),
      })),
    );
    const baru = unik.filter((_, i) => !kembar[i]);

    if (baru.length > 0) {
      const isi = baru.map((d) => ({
        variant_id: idVarian.get(d.variant_slug),
        rating: d.rating,
        author_name: d.author_name,
        author_name_raw: d.author_name_raw,
        body: d.body,
        reviewed_at: d.reviewed_at,
        reviewed_precision: d.reviewed_precision,
        source_product: d.source_product,
      }));

      await tx`
        insert into reviews
          (variant_id, source, rating, author_name, author_name_raw, body, reviewed_at, reviewed_precision, source_product)
        select x.variant_id, ${source}, x.rating, x.author_name, x.author_name_raw, x.body, x.reviewed_at,
          x.reviewed_precision, x.source_product
        from jsonb_to_recordset(${tx.json(isi)}) as x(
          variant_id bigint, rating int, author_name text, author_name_raw text, body text,
          reviewed_at timestamptz, reviewed_precision text, source_product text
        )
      `;
    }

    const alias = new Map<string, number>();
    for (const d of daftar) {
      if (!d.produk_marketplace) continue;
      const kunci = kunciProduk(d.produk_marketplace);
      const id = idVarian.get(d.variant_slug);
      if (kunci && id) alias.set(kunci, id);
    }

    if (alias.size > 0) {
      const isiAlias = [...alias].map(([product_key, variant_id]) => ({ product_key, variant_id }));
      await tx`
        insert into review_product_aliases (source, product_key, variant_id)
        select ${source}, x.product_key, x.variant_id
        from jsonb_to_recordset(${tx.json(isiAlias)}) as x(product_key text, variant_id bigint)
        on conflict (source, product_key)
        do update set variant_id = excluded.variant_id, updated_at = now()
      `;
    }

    return { ok: true, masuk: baru.length, kembar: daftar.length - baru.length } as const;
  });
}
