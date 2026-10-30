import type { Gagal } from "./products";

export type GrupBaru = {
  slug: string;
  label: string;
  title: string;
  summary: string;
};

export type KategoriBaru = {
  slug: string;
  group_slug: string;
  label: string;
  title: string;
  seo_title: string;
  summary: string;
  complaint?: string | null;
};

export type KategoriBersih = Omit<KategoriBaru, "complaint"> & { complaint: string | null };

export type IsiKategori = { groups: GrupBaru[]; categories: KategoriBaru[] };
export type IsiKategoriBersih = { groups: GrupBaru[]; categories: KategoriBersih[] };

export const GRUP_MAKS = 20;
export const KATEGORI_MAKS = 100;

const POLA_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function gagal(error: string, message: string, field: string): { ok: false } & Gagal {
  return { ok: false, status: 422, badan: { error, message, field } };
}

function teks(nilai: string | null | undefined): string {
  return (nilai ?? "").replace(/\s+/g, " ").trim();
}

function panjang(isi: string, min: number, maks: number) {
  return isi.length >= min && isi.length <= maks;
}

export function periksaIsiKategori(
  isi: IsiKategori,
): { ok: true; bersih: IsiKategoriBersih } | ({ ok: false } & Gagal) {
  if (isi.groups.length === 0 || isi.groups.length > GRUP_MAKS) {
    return gagal("invalid_groups", `Grup harus 1 sampai ${GRUP_MAKS}`, "groups");
  }
  if (isi.categories.length === 0 || isi.categories.length > KATEGORI_MAKS) {
    return gagal("invalid_categories", `Kategori harus 1 sampai ${KATEGORI_MAKS}`, "categories");
  }

  const groups: GrupBaru[] = [];
  for (const g of isi.groups) {
    const bersih = {
      slug: teks(g.slug).toLowerCase(),
      label: teks(g.label),
      title: teks(g.title),
      summary: teks(g.summary),
    };
    const nama = bersih.label || bersih.slug || "tanpa nama";

    if (!POLA_SLUG.test(bersih.slug) || bersih.slug.length > 40) {
      return gagal("invalid_slug", `Slug grup "${nama}" hanya boleh huruf kecil, angka, dan tanda hubung`, "groups");
    }
    if (groups.some((x) => x.slug === bersih.slug)) {
      return gagal("duplicate_slug", `Slug grup "${bersih.slug}" dipakai dua kali`, "groups");
    }
    if (!panjang(bersih.label, 2, 40)) return gagal("invalid_group", `Grup "${nama}": nama 2 sampai 40 huruf`, "groups");
    if (!panjang(bersih.title, 2, 80)) return gagal("invalid_group", `Grup "${nama}": judul 2 sampai 80 huruf`, "groups");
    if (!panjang(bersih.summary, 10, 400)) {
      return gagal("invalid_group", `Grup "${nama}": ringkasan 10 sampai 400 huruf`, "groups");
    }

    groups.push(bersih);
  }

  const categories: KategoriBersih[] = [];
  for (const k of isi.categories) {
    const keluhan = teks(k.complaint);
    const bersih = {
      slug: teks(k.slug).toLowerCase(),
      group_slug: teks(k.group_slug).toLowerCase(),
      label: teks(k.label),
      title: teks(k.title),
      seo_title: teks(k.seo_title),
      summary: teks(k.summary),
      complaint: keluhan || null,
    };
    const nama = bersih.label || bersih.slug || "tanpa nama";

    if (!POLA_SLUG.test(bersih.slug) || bersih.slug.length > 40) {
      return gagal("invalid_slug", `Slug kategori "${nama}" hanya boleh huruf kecil, angka, dan tanda hubung`, "categories");
    }
    if (categories.some((x) => x.slug === bersih.slug)) {
      return gagal("duplicate_slug", `Slug kategori "${bersih.slug}" dipakai dua kali`, "categories");
    }
    if (!groups.some((g) => g.slug === bersih.group_slug)) {
      return gagal("invalid_group", `Kategori "${nama}": grupnya tidak ada`, "categories");
    }
    if (!panjang(bersih.label, 2, 40)) return gagal("invalid_category", `Kategori "${nama}": nama 2 sampai 40 huruf`, "categories");
    if (!panjang(bersih.title, 2, 80)) return gagal("invalid_category", `Kategori "${nama}": judul 2 sampai 80 huruf`, "categories");
    if (!panjang(bersih.seo_title, 2, 80)) {
      return gagal("invalid_category", `Kategori "${nama}": judul SEO 2 sampai 80 huruf`, "categories");
    }
    if (!panjang(bersih.summary, 10, 400)) {
      return gagal("invalid_category", `Kategori "${nama}": ringkasan 10 sampai 400 huruf`, "categories");
    }
    if (bersih.complaint && !panjang(bersih.complaint, 3, 60)) {
      return gagal("invalid_category", `Kategori "${nama}": keluhan 3 sampai 60 huruf`, "categories");
    }

    categories.push(bersih);
  }

  return { ok: true, bersih: { groups, categories } };
}
