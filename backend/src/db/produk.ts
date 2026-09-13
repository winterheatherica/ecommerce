import type { Sql } from "../lib/db";
import type { PerubahanBersih, ProdukBersih } from "../lib/products";

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

const kolom = (sql: Sql) => sql`
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
`;

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
      ${kolom(sql)},
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
    select ${kolom(sql)}
    from products
    where slug = ${slug} and is_active
    limit 1
  `;

  return produk;
}

export async function daftarProdukAdmin(sql: Sql) {
  const baris = await sql<BarisProduk[]>`
    select ${kolom(sql)}
    from products
    order by sort_order
  `;

  return { data: [...baris], total: baris.length };
}

export async function satuProdukAdmin(
  sql: Sql,
  slug: string,
): Promise<BarisProduk | undefined> {
  const [produk] = await sql<BarisProduk[]>`
    select ${kolom(sql)}
    from products
    where slug = ${slug}
    limit 1
  `;

  return produk;
}

export type HasilSimpan =
  | { ok: true; produk: BarisProduk }
  | { ok: false; alasan: "slug_taken" };

function slugBentrok(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    (e as { code: unknown }).code === "23505"
  );
}

export async function simpanProdukBaru(
  sql: Sql,
  b: ProdukBersih,
): Promise<HasilSimpan> {
  try {
    const [produk] = await sql<BarisProduk[]>`
      insert into products (
        slug, name, description, price, weight_g, stock,
        category, is_featured, sold_per_month, sort_order, is_active
      )
      values (
        ${b.slug},
        ${b.name},
        ${b.description},
        ${b.price},
        ${b.weight_g},
        ${b.stock},
        ${b.category},
        ${b.is_featured},
        ${b.sold_per_month},
        coalesce(
          ${b.sort_order}::int,
          (select coalesce(max(sort_order), 0) + 1 from products)
        ),
        ${b.is_active}
      )
      returning ${kolom(sql)}
    `;

    return { ok: true, produk };
  } catch (e) {
    if (slugBentrok(e)) return { ok: false, alasan: "slug_taken" };
    throw e;
  }
}

export async function perbaruiProduk(
  sql: Sql,
  slug: string,
  b: PerubahanBersih,
): Promise<BarisProduk | undefined> {
  if (Object.keys(b).length === 0) {
    return satuProdukAdmin(sql, slug);
  }

  const [produk] = await sql<BarisProduk[]>`
    update products
    set ${sql(b as Record<string, never>)}
    where slug = ${slug}
    returning ${kolom(sql)}
  `;

  return produk;
}
