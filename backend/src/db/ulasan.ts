import type { Kueri, Sql } from "../lib/db";
import type { UlasanImporBersih } from "../lib/ulasan";

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
};

export const ULASAN_PER_HALAMAN = 30;

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

const urutanTampil = (sql: Kueri) => sql`
  (r.reviewed_precision = 'over_year'), r.reviewed_at desc, r.id desc
`;

const daftarDanRingkasan = (sql: Kueri, admin: boolean) => sql`
  coalesce((
    select jsonb_agg(x.o order by x.lama, x.reviewed_at desc, x.id desc)
    from (
      select
        ${objekUlasan(sql)}
          || case when ${admin}::boolean then jsonb_build_object('is_hidden', r.is_hidden) else '{}'::jsonb end
          as o,
        (r.reviewed_precision = 'over_year') as lama,
        r.reviewed_at,
        r.id
      from reviews r
      join product_variants v on v.id = r.variant_id
      where v.product_id = products.id
        and (${admin}::boolean or (v.is_active and not r.is_hidden))
      order by ${urutanTampil(sql)}
      limit ${ULASAN_PER_HALAMAN}
    ) x
  ), '[]'::jsonb) as reviews,
  (
    select jsonb_build_object(
      'total', count(*),
      'shopee', count(*) filter (where r.source = 'shopee'),
      'tokopedia', count(*) filter (where r.source = 'tokopedia'),
      'web', count(*) filter (where r.source = 'web')
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
  opsi: { offset: number; limit: number; admin: boolean },
): Promise<BarisUlasanAdmin[]> {
  return sql<BarisUlasanAdmin[]>`
    select ${kolom(sql)}
    from reviews r
    join product_variants v on v.id = r.variant_id
    join products p on p.id = v.product_id
    where p.slug = ${produkSlug}
      and (${opsi.admin}::boolean or (p.is_active and v.is_active and not r.is_hidden))
    order by ${urutanTampil(sql)}
    offset ${opsi.offset}
    limit ${opsi.limit}
  `;
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
