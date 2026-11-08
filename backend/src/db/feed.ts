import type { Sql } from "../lib/db";
import type { BarisFeed } from "../lib/feed-google";

export async function barisFeed(sql: Sql): Promise<BarisFeed[]> {
  return sql<BarisFeed[]>`
    select
      p.slug as product_slug,
      p.name,
      p.description,
      p.brand,
      nullif(concat_ws(' > ', g.label, c.label), '') as product_type,
      v.slug as variant_slug,
      v.label,
      (count(*) over (partition by p.id))::int as jumlah_ukuran,
      v.price,
      v.promo_price,
      v.promo_starts_at,
      v.promo_ends_at,
      status_promo(v.promo_price, v.promo_starts_at, v.promo_ends_at) as promo_status,
      v.stock,
      coalesce(v.package_weight_g, v.weight_g) as weight_g,
      coalesce((
        select jsonb_agg(
          jsonb_build_object('cloudinary_id', f.cloudinary_id, 'version', f.version)
          order by (f.variant_id is null), f.sort_order, f.id
        )
        from product_images f
        where f.product_id = p.id and (f.variant_id is null or f.variant_id = v.id)
      ), '[]'::jsonb) as images
    from products p
    join product_variants v on v.product_id = p.id and v.is_active
    left join categories c on c.slug = p.category
    left join category_groups g on g.slug = c.group_slug
    where p.is_active
    order by p.sort_order, p.id, v.sort_order, v.price
  `;
}
