import { products, type Product } from "../data/products";

export const KATEGORI = [
  "kucing",
  "tikus",
  "kecoa",
  "cicak",
  "nyamuk",
  "perawatan-kulit",
] as const;

export type Kategori = (typeof KATEGORI)[number];

const POLA_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type Gagal = {
  status: number;
  badan: { error: string; message: string; field?: string };
};

export type HasilProduk = ({ ok: true; produk: Product } | ({ ok: false } & Gagal));

export type ProdukBaru = {
  slug: string;
  name: string;
  description?: string;
  price: number;
  weight_g: number;
  stock?: number;
  category: string;
  is_featured?: boolean;
  sold_per_month?: number;
  sort_order?: number;
  is_active?: boolean;
};

export type PerubahanProduk = Partial<Omit<ProdukBaru, "slug">>;

function periksaKategori(kategori: string): Gagal | null {
  if (!(KATEGORI as readonly string[]).includes(kategori)) {
    return {
      status: 422,
      badan: {
        error: "invalid_category",
        message: `Kategori harus salah satu dari: ${KATEGORI.join(", ")}`,
        field: "category",
      },
    };
  }
  return null;
}

export function buatProduk(data: ProdukBaru): HasilProduk {
  const slug = data.slug.trim().toLowerCase();

  if (!POLA_SLUG.test(slug)) {
    return {
      ok: false,
      status: 422,
      badan: {
        error: "invalid_slug",
        message: "Slug hanya boleh huruf kecil, angka, dan tanda hubung",
        field: "slug",
      },
    };
  }

  if (products.some((p) => p.slug === slug)) {
    return {
      ok: false,
      status: 409,
      badan: {
        error: "slug_taken",
        message: `Slug "${slug}" sudah dipakai produk lain`,
        field: "slug",
      },
    };
  }

  const galatKategori = periksaKategori(data.category);
  if (galatKategori) return { ok: false, ...galatKategori };

  const produk: Product = {
    id: Math.max(0, ...products.map((p) => p.id)) + 1,
    slug,
    name: data.name.trim(),
    description: data.description?.trim() ?? "",
    price: data.price,
    weight_g: data.weight_g,
    stock: data.stock ?? 0,
    category: data.category,
    is_featured: data.is_featured ?? false,
    sold_per_month: data.sold_per_month ?? 0,
    sort_order:
      data.sort_order ?? Math.max(0, ...products.map((p) => p.sort_order)) + 1,
    is_active: data.is_active ?? true,
  };

  products.push(produk);
  return { ok: true, produk };
}

export function ubahProduk(
  slug: string,
  perubahan: PerubahanProduk,
): HasilProduk {
  const produk = products.find((p) => p.slug === slug);

  if (!produk) {
    return {
      ok: false,
      status: 404,
      badan: { error: "not_found", message: "Produk tidak ditemukan" },
    };
  }

  if (perubahan.category !== undefined) {
    const galat = periksaKategori(perubahan.category);
    if (galat) return { ok: false, ...galat };
    produk.category = perubahan.category;
  }

  if (perubahan.name !== undefined) produk.name = perubahan.name.trim();
  if (perubahan.description !== undefined)
    produk.description = perubahan.description.trim();
  if (perubahan.price !== undefined) produk.price = perubahan.price;
  if (perubahan.weight_g !== undefined) produk.weight_g = perubahan.weight_g;
  if (perubahan.stock !== undefined) produk.stock = perubahan.stock;
  if (perubahan.is_featured !== undefined)
    produk.is_featured = perubahan.is_featured;
  if (perubahan.sold_per_month !== undefined)
    produk.sold_per_month = perubahan.sold_per_month;
  if (perubahan.sort_order !== undefined)
    produk.sort_order = perubahan.sort_order;
  if (perubahan.is_active !== undefined) produk.is_active = perubahan.is_active;

  return { ok: true, produk };
}
