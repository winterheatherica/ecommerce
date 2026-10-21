import type { Gagal } from "./products";

export type SumberImpor = "shopee" | "tokopedia";

export type UlasanImporBaru = {
  source?: SumberImpor;
  rating: number;
  author_name: string;
  body?: string | null;
  follow_up?: string | null;
  reviewed_at: string;
  source_product?: string | null;
  source_url?: string | null;
};

export type UlasanImporBersih = {
  source: SumberImpor;
  rating: number;
  author_name: string;
  body: string | null;
  follow_up: string | null;
  reviewed_at: string;
  source_product: string | null;
  source_url: string | null;
};

const MAKS_TEKS = 3000;
const MAKS_PRODUK_ASAL = 200;
const POLA_URL_TOKOPEDIA = /^https:\/\/www\.tokopedia\.com\/\S+$/;

export const PENGULAS_TANPA_NAMA = "Pembeli";
export const JENDELA_UBAH_JAM = 3;

export type UlasanPembeliBaru = { rating: number; body?: string | null };
export type UlasanPembeliBersih = { rating: number; body: string | null };

function galat(error: string, message: string): Gagal {
  return { status: 422, badan: { error, message, field: "review" } };
}

export function samarkanPengulas(nama: string): string {
  const s = nama.trim();
  if (!s) return PENGULAS_TANPA_NAMA;
  if (s.includes("*")) return s;
  if (s.length <= 2) return `${s[0]}*`;
  return `${s[0]}*****${s.at(-1)}`;
}

function teksBersih(nilai: string | null | undefined): string | null {
  const s = nilai?.trim();
  return s ? s : null;
}

export function periksaUlasanPembeli(
  d: UlasanPembeliBaru,
): { ok: true; bersih: UlasanPembeliBersih } | ({ ok: false } & Gagal) {
  if (!Number.isInteger(d.rating) || d.rating < 1 || d.rating > 5) {
    return { ok: false, ...galat("invalid_rating", "Pilih bintang 1 sampai 5") };
  }

  const body = teksBersih(d.body);
  if ((body?.length ?? 0) > MAKS_TEKS) {
    return { ok: false, ...galat("review_too_long", "Ulasan maksimal 3.000 karakter") };
  }

  return { ok: true, bersih: { rating: d.rating, body } };
}

export function periksaUlasanImpor(
  d: UlasanImporBaru,
  sekarang: Date = new Date(),
): { ok: true; bersih: UlasanImporBersih } | ({ ok: false } & Gagal) {
  const source = d.source ?? "shopee";

  if (source !== "shopee" && source !== "tokopedia") {
    return { ok: false, ...galat("invalid_source", "Sumber ulasan harus Shopee atau Tokopedia") };
  }

  const produkAsal = source === "tokopedia" ? teksBersih(d.source_product) : null;
  const urlAsal = source === "tokopedia" ? teksBersih(d.source_url) : null;

  if ((produkAsal?.length ?? 0) > MAKS_PRODUK_ASAL) {
    return { ok: false, ...galat("source_product_too_long", "Nama produk di Tokopedia maksimal 200 karakter") };
  }
  if (urlAsal && (urlAsal.length > 400 || !POLA_URL_TOKOPEDIA.test(urlAsal))) {
    return { ok: false, ...galat("invalid_source_url", "Link harus diawali https://www.tokopedia.com/") };
  }

  if (!Number.isInteger(d.rating) || d.rating < 1 || d.rating > 5) {
    return { ok: false, ...galat("invalid_rating", "Bintang harus 1 sampai 5") };
  }

  const nama = d.author_name.trim();
  if (!nama || nama.length > 60) {
    return { ok: false, ...galat("invalid_author", "Nama pengulas wajib diisi, maksimal 60 karakter") };
  }

  const body = teksBersih(d.body);
  const followUp = teksBersih(d.follow_up);
  if (!body && !followUp) {
    return { ok: false, ...galat("empty_review", "Isi ulasannya belum ada") };
  }
  if ((body?.length ?? 0) > MAKS_TEKS || (followUp?.length ?? 0) > MAKS_TEKS) {
    return { ok: false, ...galat("review_too_long", "Ulasan maksimal 3.000 karakter") };
  }

  const waktu = Date.parse(d.reviewed_at);
  if (Number.isNaN(waktu)) {
    return { ok: false, ...galat("invalid_review_date", "Tanggal ulasan tidak terbaca") };
  }
  if (waktu > sekarang.getTime() + 24 * 3600 * 1000) {
    return { ok: false, ...galat("future_review_date", "Tanggal ulasan tidak boleh di masa depan") };
  }

  return {
    ok: true,
    bersih: {
      source,
      rating: d.rating,
      author_name: samarkanPengulas(nama),
      body,
      follow_up: followUp,
      reviewed_at: new Date(waktu).toISOString(),
      source_product: produkAsal,
      source_url: urlAsal,
    },
  };
}
