import { bentrokUnik, type Kueri, type Sql } from "../lib/db";
import type { PerubahanVarianBersih, VarianBersih } from "../lib/variants";

export type BarisVarianAdmin = {
  id: number;
  slug: string;
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
  v.label,
  v.price,
  v.weight_g,
  v.stock,
  v.sort_order,
  v.is_active
`;

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

export async function perbaruiVarian(
  sql: Sql,
  slug: string,
  b: PerubahanVarianBersih,
): Promise<BarisVarianAdmin | undefined> {
  if (Object.keys(b).length === 0) {
    return satuVarian(sql, slug);
  }

  const [varian] = await sql<BarisVarianAdmin[]>`
    update product_variants v
    set ${sql(b as Record<string, never>)}, updated_at = now()
    where v.slug = ${slug}
    returning ${kolom(sql)}
  `;

  return varian;
}

export type HasilVarian =
  | { ok: true; varian: BarisVarianAdmin }
  | { ok: false; alasan: "slug_taken" | "not_found" };

export async function tambahVarian(
  sql: Sql,
  produkSlug: string,
  b: VarianBersih,
): Promise<HasilVarian> {
  try {
    const [varian] = await sql<BarisVarianAdmin[]>`
      insert into product_variants (
        product_id, slug, label, price, weight_g, stock, sort_order
      )
      select
        p.id,
        ${b.slug},
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
    if (bentrokUnik(e)) return { ok: false, alasan: "slug_taken" };
    throw e;
  }
}
