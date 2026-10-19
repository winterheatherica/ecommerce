import { kendalaBentrok, kendalaCek, type Kueri, type Sql } from "../lib/db";
import type { PerubahanVarianBersih, VarianBersih } from "../lib/variants";
import type { StatusPromo } from "./produk";

export type BarisVarianAdmin = {
  id: number;
  slug: string;
  sku: string;
  label: string;
  price: number;
  weight_g: number;
  stock: number;
  sort_order: number;
  is_active: boolean;
  promo_price: number | null;
  promo_starts_at: string | null;
  promo_ends_at: string | null;
  promo_show_period: boolean;
  promo_active: boolean;
  promo_status: StatusPromo;
  package_weight_g: number | null;
  package_length_cm: number | null;
  package_width_cm: number | null;
  package_height_cm: number | null;
  shopee_url: string | null;
  shopee_rating: number | null;
  shopee_rating_count: number | null;
  shopee_rating_at: string | null;
};

const kolomPaket = (sql: Kueri) => sql`
  package_weight_g,
  package_length_cm,
  package_width_cm,
  package_height_cm
`;

const kolomShopee = (sql: Kueri) => sql`
  shopee_url,
  shopee_rating::float8 as shopee_rating,
  shopee_rating_count,
  shopee_rating_at
`;

const kolomPromo = (sql: Kueri) => sql`
  promo_price,
  promo_starts_at,
  promo_ends_at,
  promo_show_period,
  promo_aktif(promo_price, promo_starts_at, promo_ends_at) as promo_active,
  status_promo(promo_price, promo_starts_at, promo_ends_at) as promo_status
`;

const kolom = (sql: Kueri) => sql`
  v.id::int as id,
  v.slug,
  v.sku,
  v.label,
  v.price,
  v.weight_g,
  v.stock,
  v.sort_order,
  v.is_active,
  ${kolomPromo(sql)},
  ${kolomPaket(sql)},
  ${kolomShopee(sql)}
`;

type AlasanBentrok = "slug_taken" | "sku_taken";

function alasanBentrok(e: unknown): AlasanBentrok | null {
  const kendala = kendalaBentrok(e);

  if (kendala === "product_variants_sku_key") return "sku_taken";
  if (kendala === "product_variants_slug_key") return "slug_taken";
  return null;
}

export async function satuVarian(
  sql: Sql,
  slug: string,
): Promise<BarisVarianAdmin | undefined> {
  const [varian] = await sql<BarisVarianAdmin[]>`
    select ${kolom(sql)}
    from product_variants v
    where v.slug = ${slug}
    limit 1
  `;

  return varian;
}

export type HasilUbahVarian =
  | { ok: true; varian: BarisVarianAdmin }
  | {
      ok: false;
      alasan:
        | "not_found"
        | "sku_taken"
        | "promo_not_cheaper"
        | "promo_period_reversed"
        | "package_dimensions_incomplete"
        | "shopee_url_invalid"
        | "shopee_rating_inconsistent";
    };

export async function perbaruiVarian(
  sql: Sql,
  slug: string,
  b: PerubahanVarianBersih,
): Promise<HasilUbahVarian> {
  const ratingBerubah = b.shopee_rating !== undefined || b.shopee_rating_count !== undefined;

  try {
    const varian =
      Object.keys(b).length === 0
        ? await satuVarian(sql, slug)
        : (
            await sql<BarisVarianAdmin[]>`
              update product_variants v
              set ${sql(b as Record<string, never>)},
                  updated_at = now()
                  ${ratingBerubah ? sql`, shopee_rating_at = now()` : sql``}
              where v.slug = ${slug}
              returning ${kolom(sql)}
            `
          )[0];

    if (!varian) return { ok: false, alasan: "not_found" };

    return { ok: true, varian };
  } catch (e) {
    if (alasanBentrok(e) === "sku_taken") return { ok: false, alasan: "sku_taken" };

    const cek = kendalaCek(e);
    if (cek === "product_variants_promo_lebih_murah") {
      return { ok: false, alasan: "promo_not_cheaper" };
    }
    if (cek === "product_variants_promo_urutan_waktu") {
      return { ok: false, alasan: "promo_period_reversed" };
    }
    if (cek === "product_variants_dimensi_lengkap") {
      return { ok: false, alasan: "package_dimensions_incomplete" };
    }
    if (cek === "product_variants_shopee_url") {
      return { ok: false, alasan: "shopee_url_invalid" };
    }
    if (cek === "product_variants_shopee_rating") {
      return { ok: false, alasan: "shopee_rating_inconsistent" };
    }

    throw e;
  }
}

export type HasilVarian =
  | { ok: true; varian: BarisVarianAdmin }
  | { ok: false; alasan: AlasanBentrok | "not_found" };

export async function tambahVarian(
  sql: Sql,
  produkSlug: string,
  b: VarianBersih,
): Promise<HasilVarian> {
  try {
    const [varian] = await sql<BarisVarianAdmin[]>`
      insert into product_variants (
        product_id, slug, sku, label, price, weight_g, stock, sort_order
      )
      select
        p.id,
        ${b.slug},
        coalesce(${b.sku}::text, sku_varian_berikutnya()),
        ${b.label},
        ${b.price},
        ${b.weight_g},
        ${b.stock},
        coalesce(
          ${b.sort_order}::int,
          (
            select coalesce(max(w.sort_order), 0) + 1
            from product_variants w
            where w.product_id = p.id
          )
        )
      from products p
      where p.slug = ${produkSlug}
      returning
        id::int as id,
        slug,
        sku,
        label,
        price,
        weight_g,
        stock,
        sort_order,
        is_active,
        ${kolomPromo(sql)},
        ${kolomPaket(sql)},
        ${kolomShopee(sql)}
    `;

    if (!varian) return { ok: false, alasan: "not_found" };

    return { ok: true, varian };
  } catch (e) {
    const alasan = alasanBentrok(e);
    if (alasan) return { ok: false, alasan };
    throw e;
  }
}
