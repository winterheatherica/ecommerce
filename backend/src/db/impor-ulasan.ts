import type { Sql } from "../lib/db";
import { cocokKunci, kandidatVarian, kunciProduk, tebakVarian, type VarianKatalog } from "../lib/cocok-produk";
import type { SumberImpor, UlasanImporBersih } from "../lib/ulasan";
import { namaUntukCocok, pelajariNamaMarketplace } from "./nama-marketplace";

export type TebakanVarian = { slug: string; dari: "nama" | "mirip" } | null;

export type SaranVarian = { tebakan: TebakanVarian; kandidat: string[] };

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

export async function saranVarianUntuk(
  sql: Sql,
  source: SumberImpor,
  namaMarketplace: (string | null)[],
): Promise<SaranVarian[]> {
  const tercatat = await namaUntukCocok(sql, source);
  const katalog = await katalogVarian(sql);

  return namaMarketplace.map((nama) => {
    if (!nama) return { tebakan: null, kandidat: [] };

    const mirip = kandidatVarian(nama, katalog);
    const kunci = kunciProduk(nama);
    const persis = tercatat.filter((t) => t.name_key === kunci);
    const cocok = persis.length > 0 ? persis : tercatat.filter((t) => cocokKunci(kunci, t.name_key));
    const dariNama = [...new Set(cocok.map((t) => t.slug))];

    if (dariNama.length > 0) {
      const kandidat = [...dariNama, ...mirip.filter((k) => !dariNama.includes(k))].slice(0, 3);
      return {
        tebakan: dariNama.length === 1 ? { slug: dariNama[0], dari: "nama" } : null,
        kandidat,
      };
    }

    const slug = tebakVarian(nama, katalog);
    return { tebakan: slug ? { slug, dari: "mirip" } : null, kandidat: mirip };
  });
}

export async function tebakVarianUntuk(
  sql: Sql,
  source: SumberImpor,
  namaMarketplace: (string | null)[],
): Promise<TebakanVarian[]> {
  return (await saranVarianUntuk(sql, source, namaMarketplace)).map((s) => s.tebakan);
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

    await pelajariNamaMarketplace(
      tx as unknown as Sql,
      source,
      daftar.flatMap((d) => {
        const id = idVarian.get(d.variant_slug);
        return d.produk_marketplace && id ? [{ variant_id: id, nama: d.produk_marketplace }] : [];
      }),
    );

    return { ok: true, masuk: baru.length, kembar: daftar.length - baru.length } as const;
  });
}
