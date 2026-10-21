import type { Kueri, Sql } from "../lib/db";
import {
  JENDELA_UBAH_JAM,
  samarkanPengulas,
  type UlasanImporBersih,
  type UlasanPembeliBersih,
} from "../lib/ulasan";

export type SumberUlasan = "shopee" | "web" | "tokopedia";
export type PresisiUlasan = "day" | "month" | "over_year";

export type BarisUlasan = {
  id: number;
  source: SumberUlasan;
  rating: number;
  author_name: string;
  body: string | null;
  follow_up: string | null;
  follow_up_at: string | null;
  reviewed_at: string;
  reviewed_precision: PresisiUlasan;
  source_product: string | null;
  source_url: string | null;
  variant_slug: string;
  variant_label: string;
};

export type BarisUlasanAdmin = BarisUlasan & { is_hidden: boolean };

export type RingkasanUlasan = {
  total: number;
  shopee: number;
  tokopedia: number;
  web: number;
  bintang: Record<"1" | "2" | "3" | "4" | "5", number>;
};

export const ULASAN_PER_HALAMAN = 30;

export const URUTAN_ULASAN = ["lengkap", "terbaru", "terlama", "bintang_tinggi", "bintang_rendah"] as const;
export type UrutanUlasan = (typeof URUTAN_ULASAN)[number];

export type SaringanUlasan = {
  urut?: UrutanUlasan;
  bintang?: number;
  sumber?: SumberUlasan;
  ukuran?: string;
};

const objekUlasan = (sql: Kueri) => sql`
  jsonb_build_object(
    'id', r.id,
    'source', r.source,
    'rating', r.rating,
    'author_name', r.author_name,
    'body', r.body,
    'follow_up', r.follow_up,
    'follow_up_at', r.follow_up_at,
    'reviewed_at', r.reviewed_at,
    'reviewed_precision', r.reviewed_precision,
    'source_product', r.source_product,
    'source_url', r.source_url,
    'variant_slug', v.slug,
    'variant_label', v.label
  )
`;

function urutan(sql: Kueri, urut: UrutanUlasan = "lengkap") {
  const terbaru = sql`(r.reviewed_precision = 'over_year'), r.reviewed_at desc, r.id desc`;

  switch (urut) {
    case "terbaru":
      return terbaru;
    case "terlama":
      return sql`(r.reviewed_precision = 'over_year') desc, r.reviewed_at asc, r.id asc`;
    case "bintang_tinggi":
      return sql`r.rating desc, ${terbaru}`;
    case "bintang_rendah":
      return sql`r.rating asc, ${terbaru}`;
    default:
      return sql`char_length(coalesce(r.body, '') || coalesce(r.follow_up, '')) desc, ${terbaru}`;
  }
}

const daftarDanRingkasan = (sql: Kueri, admin: boolean) => sql`
  coalesce((
    select jsonb_agg(x.o order by x.n)
    from (
      select
        ${objekUlasan(sql)}
          || case when ${admin}::boolean then jsonb_build_object('is_hidden', r.is_hidden) else '{}'::jsonb end
          as o,
        row_number() over (order by ${urutan(sql, admin ? "terbaru" : "lengkap")}) as n
      from reviews r
      join product_variants v on v.id = r.variant_id
      where v.product_id = products.id
        and (${admin}::boolean or (v.is_active and not r.is_hidden))
      order by ${urutan(sql, admin ? "terbaru" : "lengkap")}
      limit ${ULASAN_PER_HALAMAN}
    ) x
  ), '[]'::jsonb) as reviews,
  (
    select jsonb_build_object(
      'total', count(*),
      'shopee', count(*) filter (where r.source = 'shopee'),
      'tokopedia', count(*) filter (where r.source = 'tokopedia'),
      'web', count(*) filter (where r.source = 'web'),
      'bintang', jsonb_build_object(
        '1', count(*) filter (where r.rating = 1),
        '2', count(*) filter (where r.rating = 2),
        '3', count(*) filter (where r.rating = 3),
        '4', count(*) filter (where r.rating = 4),
        '5', count(*) filter (where r.rating = 5)
      )
    )
    from reviews r
    join product_variants v on v.id = r.variant_id
    where v.product_id = products.id
      and (${admin}::boolean or (v.is_active and not r.is_hidden))
  ) as reviews_summary
`;

export const ulasanPublik = (sql: Kueri) => daftarDanRingkasan(sql, false);

export const ulasanAdmin = (sql: Kueri) => daftarDanRingkasan(sql, true);

const kolom = (sql: Kueri) => sql`
  r.id::int as id,
  r.source,
  r.rating::int as rating,
  r.author_name,
  r.body,
  r.follow_up,
  r.follow_up_at,
  r.reviewed_at,
  r.reviewed_precision,
  r.source_product,
  r.source_url,
  r.is_hidden,
  v.slug as variant_slug,
  v.label as variant_label
`;

export async function halamanUlasan(
  sql: Sql,
  produkSlug: string,
  opsi: { offset: number; limit: number; admin: boolean } & SaringanUlasan,
): Promise<{ data: BarisUlasanAdmin[]; total: number }> {
  const baris = await sql<(BarisUlasanAdmin & { total_baris: number })[]>`
    select ${kolom(sql)}, (count(*) over ())::int as total_baris
    from reviews r
    join product_variants v on v.id = r.variant_id
    join products p on p.id = v.product_id
    where p.slug = ${produkSlug}
      and (${opsi.admin}::boolean or (p.is_active and v.is_active and not r.is_hidden))
      and (${opsi.bintang ?? null}::int is null or r.rating = ${opsi.bintang ?? null}::int)
      and (${opsi.sumber ?? null}::text is null or r.source = ${opsi.sumber ?? null}::text)
      and (${opsi.ukuran ?? null}::text is null or v.slug = ${opsi.ukuran ?? null}::text)
    order by ${urutan(sql, opsi.urut)}
    offset ${opsi.offset}
    limit ${opsi.limit}
  `;

  return {
    data: baris.map(({ total_baris: _abaikan, ...sisa }) => sisa),
    total: baris[0]?.total_baris ?? 0,
  };
}

export async function tambahUlasanImpor(
  sql: Sql,
  variantSlug: string,
  b: UlasanImporBersih,
): Promise<BarisUlasanAdmin | undefined> {
  const [ulasan] = await sql<BarisUlasanAdmin[]>`
    with baru as (
      insert into reviews
        (variant_id, source, rating, author_name, body, follow_up, reviewed_at, source_product, source_url)
      select id, ${b.source}, ${b.rating}, ${b.author_name}, ${b.body}, ${b.follow_up}, ${b.reviewed_at},
        ${b.source_product}, ${b.source_url}
      from product_variants
      where slug = ${variantSlug}
      returning *
    )
    select ${kolom(sql)}
    from baru r
    join product_variants v on v.id = r.variant_id
  `;

  return ulasan;
}

export async function ubahTampilUlasan(
  sql: Sql,
  id: number,
  sembunyi: boolean,
): Promise<BarisUlasanAdmin | undefined> {
  const [ulasan] = await sql<BarisUlasanAdmin[]>`
    with ubah as (
      update reviews set is_hidden = ${sembunyi}
      where id = ${id}
      returning *
    )
    select ${kolom(sql)}
    from ubah r
    join product_variants v on v.id = r.variant_id
  `;

  return ulasan;
}

export type UlasanSaya = {
  variant_slug: string;
  rating: number;
  body: string | null;
  created_at: string;
  updated_at: string | null;
  editable_until: string;
};

const kolomSaya = (sql: Kueri) => sql`
  v.slug as variant_slug,
  r.rating::int as rating,
  r.body,
  r.created_at,
  r.updated_at,
  r.created_at + make_interval(hours => ${JENDELA_UBAH_JAM}) as editable_until
`;

type BarisSaya = Omit<UlasanSaya, "created_at" | "updated_at" | "editable_until"> & {
  created_at: Date;
  updated_at: Date | null;
  editable_until: Date;
};

function petakanSaya(b: BarisSaya): UlasanSaya {
  return {
    ...b,
    created_at: b.created_at.toISOString(),
    updated_at: b.updated_at ? b.updated_at.toISOString() : null,
    editable_until: b.editable_until.toISOString(),
  };
}

export async function ulasanPesanan(sql: Kueri, orderId: number): Promise<UlasanSaya[]> {
  const baris = await sql<BarisSaya[]>`
    select ${kolomSaya(sql)}
    from reviews r
    join product_variants v on v.id = r.variant_id
    where r.order_id = ${orderId} and r.source = 'web'
    order by r.id
  `;

  return baris.map(petakanSaya);
}

export type PesananUntukUlasan = {
  id: number;
  status: string;
  delivered_at: string | null;
  user_id: number | null;
};

export function pesananBisaDiulas(p: PesananUntukUlasan): boolean {
  return p.status === "DELIVERED" || (p.status === "SHIPPED" && p.delivered_at !== null);
}

export type HasilTulisUlasan =
  | { ok: true; ulasan: UlasanSaya }
  | { ok: false; alasan: "not_eligible" | "not_in_order" | "already_reviewed" };

export async function tulisUlasanPembeli(
  sql: Sql,
  masukan: {
    pesanan: PesananUntukUlasan;
    pengguna: { id: number; name: string };
    variantSlug: string;
    isi: UlasanPembeliBersih;
  },
): Promise<HasilTulisUlasan> {
  const { pesanan, pengguna, variantSlug, isi } = masukan;

  if (pesanan.user_id !== pengguna.id || !pesananBisaDiulas(pesanan)) {
    return { ok: false, alasan: "not_eligible" };
  }

  const [barang] = await sql<{ variant_id: number }[]>`
    select v.id::int as variant_id
    from order_items i
    join product_variants v on v.id = i.variant_id
    where i.order_id = ${pesanan.id} and v.slug = ${variantSlug}
    limit 1
  `;

  if (!barang) return { ok: false, alasan: "not_in_order" };

  const [baru] = await sql<BarisSaya[]>`
    with baru as (
      insert into reviews
        (variant_id, source, rating, author_name, body, reviewed_at, reviewed_precision, order_id, user_id)
      values
        (${barang.variant_id}, 'web', ${isi.rating}, ${samarkanPengulas(pengguna.name)}, ${isi.body},
         now(), 'day', ${pesanan.id}, ${pengguna.id})
      on conflict (order_id, variant_id) where source = 'web' do nothing
      returning *
    )
    select ${kolomSaya(sql)}
    from baru r
    join product_variants v on v.id = r.variant_id
  `;

  if (!baru) return { ok: false, alasan: "already_reviewed" };

  return { ok: true, ulasan: petakanSaya(baru) };
}

export type HasilUbahUlasan =
  | { ok: true; ulasan: UlasanSaya }
  | { ok: false; alasan: "not_found" | "edit_expired" };

export async function ubahUlasanPembeli(
  sql: Sql,
  masukan: { orderId: number; userId: number; variantSlug: string; isi: UlasanPembeliBersih },
): Promise<HasilUbahUlasan> {
  const { orderId, userId, variantSlug, isi } = masukan;

  const [diubah] = await sql<BarisSaya[]>`
    with ubah as (
      update reviews r
      set rating = ${isi.rating}, body = ${isi.body}, updated_at = now()
      from product_variants v
      where v.id = r.variant_id
        and v.slug = ${variantSlug}
        and r.order_id = ${orderId}
        and r.user_id = ${userId}
        and r.source = 'web'
        and r.created_at > now() - make_interval(hours => ${JENDELA_UBAH_JAM})
      returning r.*
    )
    select ${kolomSaya(sql)}
    from ubah r
    join product_variants v on v.id = r.variant_id
  `;

  if (diubah) return { ok: true, ulasan: petakanSaya(diubah) };

  const [ada] = await sql`
    select 1
    from reviews r
    join product_variants v on v.id = r.variant_id
    where v.slug = ${variantSlug} and r.order_id = ${orderId} and r.user_id = ${userId} and r.source = 'web'
  `;

  return { ok: false, alasan: ada ? "edit_expired" : "not_found" };
}
