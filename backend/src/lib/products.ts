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

export type ProdukBersih = {
  slug: string;
  name: string;
  description: string;
  price: number;
  weight_g: number;
  stock: number;
  category: string;
  is_featured: boolean;
  sold_per_month: number;
  sort_order: number | null;
  is_active: boolean;
};

export type PerubahanBersih = Partial<Omit<ProdukBersih, "slug" | "sort_order">> & {
  sort_order?: number;
};

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

export function periksaProdukBaru(
  data: ProdukBaru,
): { ok: true; bersih: ProdukBersih } | ({ ok: false } & Gagal) {
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

  const galatKategori = periksaKategori(data.category);
  if (galatKategori) return { ok: false, ...galatKategori };

  return {
    ok: true,
    bersih: {
      slug,
      name: data.name.trim(),
      description: data.description?.trim() ?? "",
      price: data.price,
      weight_g: data.weight_g,
      stock: data.stock ?? 0,
      category: data.category,
      is_featured: data.is_featured ?? false,
      sold_per_month: data.sold_per_month ?? 0,
      sort_order: data.sort_order ?? null,
      is_active: data.is_active ?? true,
    },
  };
}

export function periksaPerubahan(
  p: PerubahanProduk,
): { ok: true; bersih: PerubahanBersih } | ({ ok: false } & Gagal) {
  if (p.category !== undefined) {
    const galat = periksaKategori(p.category);
    if (galat) return { ok: false, ...galat };
  }

  const bersih: PerubahanBersih = {};

  if (p.name !== undefined) bersih.name = p.name.trim();
  if (p.description !== undefined) bersih.description = p.description.trim();
  if (p.price !== undefined) bersih.price = p.price;
  if (p.weight_g !== undefined) bersih.weight_g = p.weight_g;
  if (p.stock !== undefined) bersih.stock = p.stock;
  if (p.category !== undefined) bersih.category = p.category;
  if (p.is_featured !== undefined) bersih.is_featured = p.is_featured;
  if (p.sold_per_month !== undefined) bersih.sold_per_month = p.sold_per_month;
  if (p.sort_order !== undefined) bersih.sort_order = p.sort_order;
  if (p.is_active !== undefined) bersih.is_active = p.is_active;

  return { ok: true, bersih };
}
