export const KATEGORI = [
  "kucing",
  "tikus",
  "kecoa",
  "cicak",
  "nyamuk",
  "ular",
  "lalat",
  "semut",
  "musang",
  "laba-laba",
  "rayap",
  "siput",
  "kutu-kasur",
  "perilaku-anjing",
  "perawatan-hewan",
  "perawatan-kulit",
  "pembersih-rumah",
  "aroma-rumah",
  "paket",
] as const;

export type Kategori = (typeof KATEGORI)[number];

const POLA_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const TURUNAN_VARIAN = ["price", "weight_g", "stock"] as const;

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
  usage_instructions?: string | null;
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
  usage_instructions: string | null;
};

export type PerubahanBersih = Partial<
  Omit<ProdukBersih, "slug" | "sort_order" | "price" | "weight_g" | "stock">
> & {
  sort_order?: number;
};

export function rapikanCaraPakai(teks: string | null): string | null {
  if (teks === null) return null;

  const baris = teks
    .split(/\r\n|\r|\n/)
    .map((b) => b.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  return baris.length > 0 ? baris.join("\n") : null;
}

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

function periksaTurunan(p: PerubahanProduk): Gagal | null {
  const dikirim = TURUNAN_VARIAN.filter((k) => p[k] !== undefined);

  if (dikirim.length === 0) return null;

  return {
    status: 422,
    badan: {
      error: "derived_field",
      message:
        "Harga, berat, dan stok dihitung dari varian. Ubah lewat endpoint varian, bukan produk",
      field: dikirim[0],
    },
  };
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
      usage_instructions: rapikanCaraPakai(data.usage_instructions ?? null),
    },
  };
}

export function periksaPerubahan(
  p: PerubahanProduk,
): { ok: true; bersih: PerubahanBersih } | ({ ok: false } & Gagal) {
  const galatTurunan = periksaTurunan(p);
  if (galatTurunan) return { ok: false, ...galatTurunan };

  if (p.category !== undefined) {
    const galat = periksaKategori(p.category);
    if (galat) return { ok: false, ...galat };
  }

  const bersih: PerubahanBersih = {};

  if (p.name !== undefined) bersih.name = p.name.trim();
  if (p.description !== undefined) bersih.description = p.description.trim();
  if (p.category !== undefined) bersih.category = p.category;
  if (p.is_featured !== undefined) bersih.is_featured = p.is_featured;
  if (p.sold_per_month !== undefined) bersih.sold_per_month = p.sold_per_month;
  if (p.sort_order !== undefined) bersih.sort_order = p.sort_order;
  if (p.is_active !== undefined) bersih.is_active = p.is_active;
  if (p.usage_instructions !== undefined) {
    bersih.usage_instructions = rapikanCaraPakai(p.usage_instructions);
  }

  return { ok: true, bersih };
}
