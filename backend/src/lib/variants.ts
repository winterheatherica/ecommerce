import type { Gagal } from "./products";

const POLA_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const POLA_SKU = /^[A-Za-z0-9][A-Za-z0-9._\/-]{0,39}$/;

export const LABEL_TUNGGAL = "Standar";

export type VarianBaru = {
  slug: string;
  sku?: string;
  label: string;
  price: number;
  weight_g: number;
  stock?: number;
  sort_order?: number;
};

export type VarianBersih = {
  slug: string;
  sku: string | null;
  label: string;
  price: number;
  weight_g: number;
  stock: number;
  sort_order: number | null;
};

export type PerubahanVarian = {
  sku?: string;
  label?: string;
  price?: number;
  weight_g?: number;
  stock?: number;
  sort_order?: number;
  is_active?: boolean;
  promo_price?: number | null;
  promo_starts_at?: string | null;
  promo_ends_at?: string | null;
  promo_show_period?: boolean;
  package_weight_g?: number | null;
  package_length_cm?: number | null;
  package_width_cm?: number | null;
  package_height_cm?: number | null;
};

export type PerubahanVarianBersih = PerubahanVarian;

const KOLOM_PAKET = [
  "package_weight_g",
  "package_length_cm",
  "package_width_cm",
  "package_height_cm",
] as const;

const GALAT_SKU: Gagal = {
  status: 422,
  badan: {
    error: "invalid_sku",
    message:
      "SKU hanya boleh huruf, angka, titik, garis bawah, garis miring, dan tanda hubung, maksimal 40 karakter",
    field: "sku",
  },
};

const GALAT_TANGGAL: Gagal = {
  status: 422,
  badan: {
    error: "invalid_promo_date",
    message: "Tanggal promo tidak terbaca",
    field: "promo",
  },
};

const GALAT_URUTAN: Gagal = {
  status: 422,
  badan: {
    error: "promo_period_reversed",
    message: "Tanggal berakhir promo harus setelah tanggal mulainya",
    field: "promo",
  },
};

function tanggalBersih(nilai: string | null): string | null | undefined {
  if (nilai === null) return null;
  const waktu = Date.parse(nilai);
  return Number.isNaN(waktu) ? undefined : new Date(waktu).toISOString();
}

const GALAT_LABEL: Gagal = {
  status: 422,
  badan: {
    error: "invalid_label",
    message: "Label ukuran tidak boleh kosong, misalnya 50 g atau 80 ml",
    field: "label",
  },
};

export function periksaVarianBaru(
  data: VarianBaru,
): { ok: true; bersih: VarianBersih } | ({ ok: false } & Gagal) {
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

  const label = data.label.trim();
  if (!label) return { ok: false, ...GALAT_LABEL };

  const sku = data.sku?.trim() || null;
  if (sku !== null && !POLA_SKU.test(sku)) return { ok: false, ...GALAT_SKU };

  return {
    ok: true,
    bersih: {
      slug,
      sku,
      label,
      price: data.price,
      weight_g: data.weight_g,
      stock: data.stock ?? 0,
      sort_order: data.sort_order ?? null,
    },
  };
}

export function periksaPerubahanVarian(
  p: PerubahanVarian,
): { ok: true; bersih: PerubahanVarianBersih } | ({ ok: false } & Gagal) {
  const bersih: PerubahanVarianBersih = {};

  if (p.sku !== undefined) {
    const sku = p.sku.trim();
    if (!POLA_SKU.test(sku)) return { ok: false, ...GALAT_SKU };
    bersih.sku = sku;
  }

  if (p.label !== undefined) {
    const label = p.label.trim();
    if (!label) return { ok: false, ...GALAT_LABEL };
    bersih.label = label;
  }

  if (p.price !== undefined) bersih.price = p.price;
  if (p.weight_g !== undefined) bersih.weight_g = p.weight_g;
  if (p.stock !== undefined) bersih.stock = p.stock;
  if (p.sort_order !== undefined) bersih.sort_order = p.sort_order;
  if (p.is_active !== undefined) bersih.is_active = p.is_active;
  if (p.promo_price !== undefined) bersih.promo_price = p.promo_price;
  if (p.promo_show_period !== undefined) bersih.promo_show_period = p.promo_show_period;

  for (const kolom of KOLOM_PAKET) {
    if (p[kolom] !== undefined) bersih[kolom] = p[kolom];
  }

  for (const kolom of ["promo_starts_at", "promo_ends_at"] as const) {
    if (p[kolom] === undefined) continue;
    const tanggal = tanggalBersih(p[kolom]);
    if (tanggal === undefined) return { ok: false, ...GALAT_TANGGAL };
    bersih[kolom] = tanggal;
  }

  if (
    bersih.promo_starts_at &&
    bersih.promo_ends_at &&
    bersih.promo_ends_at <= bersih.promo_starts_at
  ) {
    return { ok: false, ...GALAT_URUTAN };
  }

  return { ok: true, bersih };
}
