import { POLA_ID_BANNER, urlFoto } from "./cloudinary";
import type { Gagal } from "./products";

export type BannerBaru = {
  cloudinary_id?: string | null;
  static_path?: string | null;
  version?: number | null;
  width?: number | null;
  height?: number | null;
  alt: string;
  link?: string | null;
};

export type BannerBersih = {
  cloudinary_id: string | null;
  static_path: string | null;
  version: number | null;
  width: number | null;
  height: number | null;
  alt: string;
  link: string | null;
};

export type BarisBanner = BannerBersih & { id: number };

export type BannerPublik = {
  id: number;
  url: string;
  width: number | null;
  height: number | null;
  alt: string;
  link: string | null;
};

export const BANNER_MAKS = 8;
export const POLA_BANNER_BAWAAN = /^\/banner-promo\/[a-z0-9-]{1,60}\.(?:webp|png|jpg)$/;
export const POLA_LINK_BANNER = /^(?:\/(?:[^/\s]\S*)?|https:\/\/\S+)$/;

function gagal(message: string): { ok: false } & Gagal {
  return { ok: false, status: 422, badan: { error: "invalid_banner", message, field: "banners" } };
}

function isiAtauNull(nilai: string | null | undefined): string | null {
  const isi = nilai?.trim() ?? "";
  return isi === "" ? null : isi;
}

export function periksaBanner(
  daftar: BannerBaru[],
): { ok: true; bersih: BannerBersih[] } | ({ ok: false } & Gagal) {
  if (daftar.length > BANNER_MAKS) return gagal(`Maksimal ${BANNER_MAKS} banner promo`);

  const bersih: BannerBersih[] = [];
  for (const [i, b] of daftar.entries()) {
    const posisi = `Banner ${i + 1}`;
    const cloudinary_id = isiAtauNull(b.cloudinary_id);
    const static_path = isiAtauNull(b.static_path);

    if ((cloudinary_id === null) === (static_path === null)) return gagal(`${posisi}: gambar tidak valid`);
    if (cloudinary_id !== null && !POLA_ID_BANNER.test(cloudinary_id)) return gagal(`${posisi}: gambar tidak valid`);
    if (static_path !== null && !POLA_BANNER_BAWAAN.test(static_path)) return gagal(`${posisi}: gambar tidak valid`);

    const sumber = cloudinary_id ?? static_path;
    if (bersih.some((x) => (x.cloudinary_id ?? x.static_path) === sumber)) {
      return gagal(`${posisi}: gambar yang sama dipasang dua kali`);
    }

    const width = b.width ?? null;
    const height = b.height ?? null;
    if ((width === null) !== (height === null)) return gagal(`${posisi}: ukuran gambar tidak valid`);

    const alt = b.alt.replace(/\s+/g, " ").trim();
    if (alt.length < 3 || alt.length > 160) return gagal(`${posisi}: keterangan gambar 3 sampai 160 huruf`);

    const link = isiAtauNull(b.link);
    if (link !== null && (link.length > 300 || !POLA_LINK_BANNER.test(link))) {
      return gagal(`${posisi}: link harus diawali / untuk halaman toko, atau https:// untuk situs lain`);
    }

    bersih.push({
      cloudinary_id,
      static_path,
      version: cloudinary_id === null ? null : (b.version ?? null),
      width,
      height,
      alt,
      link,
    });
  }

  return { ok: true, bersih };
}

export function urlBanner(awan: string, b: Pick<BannerBersih, "cloudinary_id" | "static_path" | "version">): string {
  if (b.static_path) return b.static_path;
  return urlFoto(awan, { cloudinary_id: b.cloudinary_id ?? "", version: b.version });
}

export function bannerAdmin(awan: string, daftar: BarisBanner[]): (BarisBanner & { url: string })[] {
  return daftar.map((b) => ({ ...b, url: urlBanner(awan, b) }));
}

export function bannerPublik(awan: string, daftar: BarisBanner[]): BannerPublik[] {
  return daftar.map((b) => ({
    id: b.id,
    url: urlBanner(awan, b),
    width: b.width,
    height: b.height,
    alt: b.alt,
    link: b.link,
  }));
}
