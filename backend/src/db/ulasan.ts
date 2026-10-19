import type { Kueri, Sql } from "../lib/db";
import type { UlasanShopeeBersih } from "../lib/ulasan";

export type BarisUlasan = {
  id: number;
  source: "shopee" | "web";
  rating: number;
  author_name: string;
  body: string | null;
  follow_up: string | null;
  follow_up_at: string | null;
  reviewed_at: string;
  variant_slug: string;
  variant_label: string;
};

export type BarisUlasanAdmin = BarisUlasan & { is_hidden: boolean };

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
    'variant_slug', v.slug,
    'variant_label', v.label
  )
`;

export const ulasanPublik = (sql: Kueri) => sql`
  coalesce((
    select jsonb_agg(${objekUlasan(sql)} order by r.reviewed_at desc, r.id desc)
    from reviews r
    join product_variants v on v.id = r.variant_id
    where v.product_id = products.id and v.is_active and not r.is_hidden
  ), '[]'::jsonb) as reviews
`;

export const ulasanAdmin = (sql: Kueri) => sql`
  coalesce((
    select jsonb_agg(
      ${objekUlasan(sql)} || jsonb_build_object('is_hidden', r.is_hidden)
      order by r.reviewed_at desc, r.id desc
    )
    from reviews r
    join product_variants v on v.id = r.variant_id
    where v.product_id = products.id
  ), '[]'::jsonb) as reviews
`;

const kolom = (sql: Kueri) => sql`
  r.id::int as id,
  r.source,
  r.rating::int as rating,
  r.author_name,
  r.body,
  r.follow_up,
  r.follow_up_at,
  r.reviewed_at,
  r.is_hidden,
  v.slug as variant_slug,
  v.label as variant_label
`;

export async function tambahUlasanShopee(
  sql: Sql,
  variantSlug: string,
  b: UlasanShopeeBersih,
): Promise<BarisUlasanAdmin | undefined> {
  const [ulasan] = await sql<BarisUlasanAdmin[]>`
    with baru as (
      insert into reviews (variant_id, source, rating, author_name, body, follow_up, reviewed_at)
      select id, 'shopee', ${b.rating}, ${b.author_name}, ${b.body}, ${b.follow_up}, ${b.reviewed_at}
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
