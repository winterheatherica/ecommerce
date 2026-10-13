import type { Gagal } from "./products";

const POLA_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const LABEL_TUNGGAL = "Standar";

export type VarianBaru = {
  slug: string;
  label: string;
  price: number;
  weight_g: number;
  stock?: number;
  sort_order?: number;
};

export type VarianBersih = {
  slug: string;
  label: string;
  price: number;
  weight_g: number;
  stock: number;
  sort_order: number | null;
};

export type PerubahanVarian = {
  label?: string;
  price?: number;
  weight_g?: number;
  stock?: number;
  sort_order?: number;
  is_active?: boolean;
};

export type PerubahanVarianBersih = PerubahanVarian;

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

  return {
    ok: true,
    bersih: {
      slug,
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

  return { ok: true, bersih };
}
