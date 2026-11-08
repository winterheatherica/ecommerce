import { bentrokUnik, kendalaAsing, type Kueri, type Sql } from "../lib/db";
import type { PerubahanBersih, ProdukBersih } from "../lib/products";
import { LABEL_TUNGGAL } from "../lib/variants";
import {
  ulasanAdmin,
  ulasanPublik,
  type BarisUlasan,
  type BarisUlasanAdmin,
  type RingkasanUlasan,
} from "./ulasan";
import { fotoProduk, type BarisFoto } from "./foto";

export type KolomRating = {
  shopee_url: string | null;
  shopee_rating: number | null;
  shopee_rating_count: number | null;
  tokopedia_url: string | null;
  tokopedia_rating: number | null;
  tokopedia_rating_count: number | null;
};

export type KolomRatingAdmin = KolomRating & {
  shopee_rating_at: string | null;
  shopee_new_reviews: number;
  tokopedia_rating_at: string | null;
  tokopedia_new_reviews: number;
};

export type BarisVarian = KolomRating & {
  slug: string;
  label: string;
  price: number;
  regular_price: number | null;
  promo_visible_until: string | null;
  weight_g: number;
  package_weight_g: number | null;
  stock: number;
};

export type RingkasanRating = {
  shopee_rating: number | null;
  shopee_rating_count: number;
  tokopedia_rating: number | null;
  tokopedia_rating_count: number;
  rating: number | null;
  rating_count: number;
};

export type BarisVarianLengkap = Omit<BarisVarian, "regular_price" | "promo_visible_until"> &
  KolomRatingAdmin & {
  sku: string;
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
};

export type StatusPromo = "none" | "active" | "scheduled" | "ended";

export type BarisProduk = RingkasanRating & {
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
  brand: string | null;
  variants: BarisVarian[];
  images: BarisFoto[];
};

export type BarisProdukDetail = BarisProduk & {
  usage_instructions: string | null;
  reviews: BarisUlasan[];
  reviews_summary: RingkasanUlasan;
};

export type BarisProdukAdmin = Omit<BarisProduk, "variants"> & {
  variants: BarisVarianLengkap[];
  usage_instructions: string | null;
  order_count?: number;
  review_count?: number;
  reviews?: BarisUlasanAdmin[];
  reviews_summary?: RingkasanUlasan;
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
  is_active,
  brand
`;

const ratingTampil = (sql: Kueri) => sql`
  cross join lateral (
    select
      count(*) filter (where r.source = 'shopee' and r.reviewed_at > v.shopee_rating_at)::int as shopee,
      count(*) filter (where r.source = 'tokopedia' and r.reviewed_at > v.tokopedia_rating_at)::int as tokopedia,
      coalesce(sum(r.rating) filter (where r.source = 'shopee' and r.reviewed_at > v.shopee_rating_at), 0) as bintang_shopee,
      coalesce(sum(r.rating) filter (where r.source = 'tokopedia' and r.reviewed_at > v.tokopedia_rating_at), 0) as bintang_tokopedia
    from reviews r
    where r.variant_id = v.id
      and r.reviewed_at > least(v.shopee_rating_at, v.tokopedia_rating_at)
      and not r.is_hidden
      and r.reviewed_precision <> 'over_year'
  ) baru
  cross join lateral (
    select
      coalesce(v.shopee_rating_count, 0) + baru.shopee as jumlah_shopee,
      coalesce(v.shopee_rating * v.shopee_rating_count, 0) + baru.bintang_shopee as bintang_shopee,
      coalesce(v.tokopedia_rating_count, 0) + baru.tokopedia as jumlah_tokopedia,
      coalesce(v.tokopedia_rating * v.tokopedia_rating_count, 0) + baru.bintang_tokopedia as bintang_tokopedia
  ) tampil
`;

const ringkasanRating = (sql: Kueri) => sql`
  (
    select (sum(tampil.bintang_shopee) / nullif(sum(tampil.jumlah_shopee), 0))::float8
    from product_variants v ${ratingTampil(sql)}
    where v.product_id = products.id and v.is_active
  ) as shopee_rating,
  (
    select coalesce(sum(tampil.jumlah_shopee), 0)::int
    from product_variants v ${ratingTampil(sql)}
    where v.product_id = products.id and v.is_active
  ) as shopee_rating_count,
  (
    select (sum(tampil.bintang_tokopedia) / nullif(sum(tampil.jumlah_tokopedia), 0))::float8
    from product_variants v ${ratingTampil(sql)}
    where v.product_id = products.id and v.is_active
  ) as tokopedia_rating,
  (
    select coalesce(sum(tampil.jumlah_tokopedia), 0)::int
    from product_variants v ${ratingTampil(sql)}
    where v.product_id = products.id and v.is_active
  ) as tokopedia_rating_count,
  (
    select (
      sum(tampil.bintang_shopee + tampil.bintang_tokopedia)
        / nullif(sum(tampil.jumlah_shopee + tampil.jumlah_tokopedia), 0)
    )::float8
    from product_variants v ${ratingTampil(sql)}
    where v.product_id = products.id and v.is_active
  ) as rating,
  (
    select coalesce(sum(tampil.jumlah_shopee + tampil.jumlah_tokopedia), 0)::int
    from product_variants v ${ratingTampil(sql)}
    where v.product_id = products.id and v.is_active
  ) as rating_count
`;

const ratingVarian = (sql: Kueri) => sql`
  'shopee_url', v.shopee_url,
  'shopee_rating', (tampil.bintang_shopee / nullif(tampil.jumlah_shopee, 0))::float8,
  'shopee_rating_count', case
    when v.shopee_rating_count is null and baru.shopee = 0 then null
    else tampil.jumlah_shopee
  end,
  'tokopedia_url', v.tokopedia_url,
  'tokopedia_rating', (tampil.bintang_tokopedia / nullif(tampil.jumlah_tokopedia, 0))::float8,
  'tokopedia_rating_count', case
    when v.tokopedia_rating_count is null and baru.tokopedia = 0 then null
    else tampil.jumlah_tokopedia
  end
`;

const ratingVarianAdmin = (sql: Kueri) => sql`
  'shopee_url', v.shopee_url,
  'shopee_rating', v.shopee_rating,
  'shopee_rating_count', v.shopee_rating_count,
  'shopee_rating_at', v.shopee_rating_at,
  'shopee_new_reviews', baru.shopee,
  'tokopedia_url', v.tokopedia_url,
  'tokopedia_rating', v.tokopedia_rating,
  'tokopedia_rating_count', v.tokopedia_rating_count,
  'tokopedia_rating_at', v.tokopedia_rating_at,
  'tokopedia_new_reviews', baru.tokopedia
`;

const kolom = (sql: Kueri) => sql`
  ${dasar(sql)},
  ${ringkasanRating(sql)},
  ${fotoProduk(sql, true)},
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
        'package_weight_g', v.package_weight_g,
        'stock', v.stock,
        ${ratingVarian(sql)}
      ) order by v.sort_order, v.price
    )
    from product_variants v ${ratingTampil(sql)}
    where v.product_id = products.id and v.is_active
  ), '[]'::jsonb) as variants
`;

const kolomAdmin = (sql: Kueri) => sql`
  ${dasar(sql)},
  ${ringkasanRating(sql)},
  ${fotoProduk(sql, false)},
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
        'package_weight_g', v.package_weight_g,
        'package_length_cm', v.package_length_cm,
        'package_width_cm', v.package_width_cm,
        'package_height_cm', v.package_height_cm,
        ${ratingVarianAdmin(sql)},
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
    from product_variants v ${ratingTampil(sql)}
    where v.product_id = products.id
  ), '[]'::jsonb) as variants
`;

const jumlahTerkait = (sql: Kueri) => sql`
  (
    select count(distinct oi.order_id)::int
    from order_items oi
    where oi.product_id = products.id
  ) as order_count,
  (
    select count(*)::int
    from reviews r
    join product_variants v on v.id = r.variant_id
    where v.product_id = products.id
  ) as review_count
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
    select ${kolom(sql)}, usage_instructions, ${ulasanPublik(sql)}
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
    select ${kolomAdmin(sql)}, ${ulasanAdmin(sql)}, ${jumlahTerkait(sql)}
    from products
    where slug = ${slug}
    limit 1
  `;

  return produk;
}

export type HasilSimpan =
  | { ok: true; produk: BarisProdukAdmin }
  | { ok: false; alasan: "slug_taken" | "invalid_category" };

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
          usage_instructions, brand
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
          ${b.usage_instructions},
          ${b.brand}
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

      await tx`
        insert into product_images ${tx(
          b.images.map((f, i) => ({
            product_id: induk.id,
            cloudinary_id: f.cloudinary_id,
            version: f.version,
            width: f.width,
            height: f.height,
            sort_order: i,
          })) as unknown as Record<string, never>[],
        )}
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
    if (kendalaAsing(e) === "products_category_fkey") return { ok: false, alasan: "invalid_category" };
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

export type HasilHapusProduk =
  | { ok: true; ukuran: number; foto: number; ulasan: number }
  | { ok: false; alasan: "not_found" }
  | { ok: false; alasan: "active" }
  | { ok: false; alasan: "ordered"; pesanan: number | null };

export async function hapusProdukPermanen(sql: Sql, slug: string): Promise<HasilHapusProduk> {
  try {
    return await sql.begin(async (tx) => {
      const [produk] = await tx<{ id: number; is_active: boolean }[]>`
        select id::int as id, is_active from products where slug = ${slug} for update
      `;
      if (!produk) return { ok: false, alasan: "not_found" } as const;
      if (produk.is_active) return { ok: false, alasan: "active" } as const;

      const [isi] = await tx<{ pesanan: number; ukuran: number; foto: number; ulasan: number }[]>`
        select
          (select count(distinct order_id)::int from order_items where product_id = ${produk.id}) as pesanan,
          (select count(*)::int from product_variants where product_id = ${produk.id}) as ukuran,
          (select count(*)::int from product_images where product_id = ${produk.id}) as foto,
          (
            select count(*)::int
            from reviews r
            join product_variants v on v.id = r.variant_id
            where v.product_id = ${produk.id}
          ) as ulasan
      `;
      if (isi.pesanan > 0) return { ok: false, alasan: "ordered", pesanan: isi.pesanan } as const;

      await tx`delete from products where id = ${produk.id}`;
      return { ok: true, ukuran: isi.ukuran, foto: isi.foto, ulasan: isi.ulasan } as const;
    });
  } catch (e) {
    const kendala = kendalaAsing(e);
    if (kendala === "order_items_product_id_fkey" || kendala === "order_items_variant_id_fkey") {
      return { ok: false, alasan: "ordered", pesanan: null };
    }
    throw e;
  }
}
