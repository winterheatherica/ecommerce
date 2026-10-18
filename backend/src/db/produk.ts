import { bentrokUnik, type Kueri, type Sql } from "../lib/db";
import type { PerubahanBersih, ProdukBersih } from "../lib/products";
import { LABEL_TUNGGAL } from "../lib/variants";

export type BarisVarian = {
  slug: string;
  label: string;
  price: number;
  regular_price: number | null;
  promo_visible_until: string | null;
  weight_g: number;
  stock: number;
};

export type BarisVarianLengkap = Omit<BarisVarian, "regular_price" | "promo_visible_until"> & {
  sku: string;
  sort_order: number;
  is_active: boolean;
  promo_price: number | null;
  promo_starts_at: string | null;
  promo_ends_at: string | null;
  promo_show_period: boolean;
  promo_active: boolean;
  promo_status: StatusPromo;
};

export type StatusPromo = "none" | "active" | "scheduled" | "ended";

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
  variants: BarisVarian[];
};

export type BarisProdukDetail = BarisProduk & {
  usage_instructions: string | null;
};

export type BarisProdukAdmin = Omit<BarisProduk, "variants"> & {
  variants: BarisVarianLengkap[];
  usage_instructions: string | null;
};

export type FilterProduk = {
  category?: string;
  featured?: boolean;
  search?: string;
  limit: number;
  offset: number;
};

const dasar = (sql: Kueri) => sql`
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

const kolom = (sql: Kueri) => sql`
  ${dasar(sql)},
  coalesce((
    select jsonb_agg(
      jsonb_build_object(
        'slug', v.slug,
        'label', v.label,
        'price', harga_berlaku(v.price, v.promo_price, v.promo_starts_at, v.promo_ends_at),
        'regular_price', case
          when promo_aktif(v.promo_price, v.promo_starts_at, v.promo_ends_at) then v.price
        end,
        'promo_visible_until', case
          when promo_aktif(v.promo_price, v.promo_starts_at, v.promo_ends_at)
            and v.promo_show_period
          then v.promo_ends_at
        end,
        'weight_g', v.weight_g,
        'stock', v.stock
      ) order by v.sort_order, v.price
    )
    from product_variants v
    where v.product_id = products.id and v.is_active
  ), '[]'::jsonb) as variants
`;

const kolomAdmin = (sql: Kueri) => sql`
  ${dasar(sql)},
  usage_instructions,
  coalesce((
    select jsonb_agg(
      jsonb_build_object(
        'slug', v.slug,
        'label', v.label,
        'price', v.price,
        'weight_g', v.weight_g,
        'stock', v.stock,
        'sku', v.sku,
        'sort_order', v.sort_order,
        'is_active', v.is_active,
        'promo_price', v.promo_price,
        'promo_starts_at', v.promo_starts_at,
        'promo_ends_at', v.promo_ends_at,
        'promo_show_period', v.promo_show_period,
        'promo_active', promo_aktif(v.promo_price, v.promo_starts_at, v.promo_ends_at),
        'promo_status', status_promo(v.promo_price, v.promo_starts_at, v.promo_ends_at)
      ) order by v.sort_order, v.price
    )
    from product_variants v
    where v.product_id = products.id
  ), '[]'::jsonb) as variants
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
): Promise<BarisProdukDetail | undefined> {
  const [produk] = await sql<BarisProdukDetail[]>`
    select ${kolom(sql)}, usage_instructions
    from products
    where slug = ${slug} and is_active
    limit 1
  `;

  return produk;
}

export async function daftarProdukAdmin(sql: Sql, limit = 100, offset = 0) {
  const baris = await sql<(BarisProdukAdmin & { total: number })[]>`
    select
      ${kolomAdmin(sql)},
      (count(*) over ())::int as total
    from products
    order by sort_order
    limit ${limit}
    offset ${offset}
  `;

  if (baris.length === 0) {
    const [hasil] = await sql<{ total: number }[]>`
      select count(*)::int as total from products
    `;
    return { data: [], total: hasil?.total ?? 0 };
  }

  return {
    data: baris.map(({ total: _abaikan, ...sisa }) => sisa),
    total: baris[0].total,
  };
}

export async function satuProdukAdmin(
  sql: Sql,
  slug: string,
): Promise<BarisProdukAdmin | undefined> {
  const [produk] = await sql<BarisProdukAdmin[]>`
    select ${kolomAdmin(sql)}
    from products
    where slug = ${slug}
    limit 1
  `;

  return produk;
}

export type HasilSimpan =
  | { ok: true; produk: BarisProdukAdmin }
  | { ok: false; alasan: "slug_taken" };

export async function simpanProdukBaru(
  sql: Sql,
  b: ProdukBersih,
): Promise<HasilSimpan> {
  try {
    const produk = await sql.begin(async (tx) => {
      const [induk] = await tx<{ id: number }[]>`
        insert into products (
          slug, name, description, price, weight_g, stock,
          category, is_featured, sold_per_month, sort_order, is_active,
          usage_instructions
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
          ${b.is_active},
          ${b.usage_instructions}
        )
        returning id::int as id
      `;

      await tx`
        insert into product_variants (
          product_id, slug, label, price, weight_g, stock
        )
        values (
          ${induk.id},
          ${b.slug},
          ${LABEL_TUNGGAL},
          ${b.price},
          ${b.weight_g},
          ${b.stock}
        )
      `;

      const [lengkap] = await tx<BarisProdukAdmin[]>`
        select ${kolomAdmin(tx)}
        from products
        where id = ${induk.id}
      `;

      return [lengkap];
    });

    return { ok: true, produk: produk[0] };
  } catch (e) {
    if (bentrokUnik(e)) return { ok: false, alasan: "slug_taken" };
    throw e;
  }
}

export async function perbaruiProduk(
  sql: Sql,
  slug: string,
  b: PerubahanBersih,
): Promise<BarisProdukAdmin | undefined> {
  if (Object.keys(b).length === 0) {
    return satuProdukAdmin(sql, slug);
  }

  const [produk] = await sql<BarisProdukAdmin[]>`
    update products
    set ${sql(b as Record<string, never>)}
    where slug = ${slug}
    returning ${kolomAdmin(sql)}
  `;

  return produk;
}
