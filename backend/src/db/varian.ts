import { kendalaBentrok, type Kueri, type Sql } from "../lib/db";
import type { PerubahanVarianBersih, VarianBersih } from "../lib/variants";

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
};

const kolom = (sql: Kueri) => sql`
  v.id::int as id,
  v.slug,
  v.sku,
  v.label,
  v.price,
  v.weight_g,
  v.stock,
  v.sort_order,
  v.is_active
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
  | { ok: false; alasan: "not_found" | "sku_taken" };

export async function perbaruiVarian(
  sql: Sql,
  slug: string,
  b: PerubahanVarianBersih,
): Promise<HasilUbahVarian> {
  try {
    const varian =
      Object.keys(b).length === 0
        ? await satuVarian(sql, slug)
        : (
            await sql<BarisVarianAdmin[]>`
              update product_variants v
              set ${sql(b as Record<string, never>)}, updated_at = now()
              where v.slug = ${slug}
              returning ${kolom(sql)}
            `
          )[0];

    if (!varian) return { ok: false, alasan: "not_found" };

    return { ok: true, varian };
  } catch (e) {
    if (alasanBentrok(e) === "sku_taken") return { ok: false, alasan: "sku_taken" };
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
        is_active
    `;

    if (!varian) return { ok: false, alasan: "not_found" };

    return { ok: true, varian };
  } catch (e) {
    const alasan = alasanBentrok(e);
    if (alasan) return { ok: false, alasan };
    throw e;
  }
}
