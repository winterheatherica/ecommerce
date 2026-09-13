import type { Sql } from "../lib/db";

export type BarisProduk = {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  price: number;
  weight_g: number;
  stock: number;
  category: string;
  sold_per_month: number;
  is_featured: boolean;
  sort_order: number;
  is_active: boolean;
};

export type FilterProduk = {
  category?: string;
  featured?: boolean;
  search?: string;
  limit: number;
  offset: number;
};

function bersihkan(f: FilterProduk) {
  return {
    kategori: f.category?.trim() || null,
    unggulan: f.featured ?? null,
    cari: f.search?.trim() || null,
  };
}

export async function daftarProduk(sql: Sql, f: FilterProduk) {
  const { kategori, unggulan, cari } = bersihkan(f);

  const baris = await sql<(BarisProduk & { total: number })[]>`
    select
      id::int as id,
      slug,
      name,
      description,
      price,
      weight_g,
      stock,
      category,
      sold_per_month,
      is_featured,
      sort_order,
      is_active,
      (count(*) over ())::int as total
    from products
    where is_active
      and (${kategori}::text is null or category = ${kategori}::text)
      and (${unggulan}::boolean is null or is_featured = ${unggulan}::boolean)
      and (${cari}::text is null or name ilike '%' || ${cari}::text || '%')
    order by sort_order
    limit ${f.limit}
    offset ${f.offset}
  `;

  if (baris.length === 0) {
    return { data: [], total: await hitungProduk(sql, f) };
  }

  return {
    data: baris.map(({ total: _abaikan, ...sisa }) => sisa),
    total: baris[0].total,
  };
}

async function hitungProduk(sql: Sql, f: FilterProduk): Promise<number> {
  const { kategori, unggulan, cari } = bersihkan(f);

  const [hasil] = await sql<{ total: number }[]>`
    select count(*)::int as total
    from products
    where is_active
      and (${kategori}::text is null or category = ${kategori}::text)
      and (${unggulan}::boolean is null or is_featured = ${unggulan}::boolean)
      and (${cari}::text is null or name ilike '%' || ${cari}::text || '%')
  `;

  return hasil?.total ?? 0;
}

export async function satuProduk(
  sql: Sql,
  slug: string,
): Promise<BarisProduk | undefined> {
  const [produk] = await sql<BarisProduk[]>`
    select
      id::int as id,
      slug,
      name,
      description,
      price,
      weight_g,
      stock,
      category,
      sold_per_month,
      is_featured,
      sort_order,
      is_active
    from products
    where slug = ${slug} and is_active
    limit 1
  `;

  return produk;
}
