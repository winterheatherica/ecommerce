import type { Gagal } from "./products";

export type UlasanShopeeBaru = {
  rating: number;
  author_name: string;
  body?: string | null;
  follow_up?: string | null;
  reviewed_at: string;
};

export type UlasanShopeeBersih = {
  rating: number;
  author_name: string;
  body: string | null;
  follow_up: string | null;
  reviewed_at: string;
};

const MAKS_TEKS = 3000;

function galat(error: string, message: string): Gagal {
  return { status: 422, badan: { error, message, field: "review" } };
}

export function samarkanPengulas(nama: string): string {
  const s = nama.trim();
  if (s.includes("*")) return s;
  if (s.length <= 2) return `${s[0]}*`;
  return `${s[0]}*****${s.at(-1)}`;
}

function teksBersih(nilai: string | null | undefined): string | null {
  const s = nilai?.trim();
  return s ? s : null;
}

export function periksaUlasanShopee(
  d: UlasanShopeeBaru,
  sekarang: Date = new Date(),
): { ok: true; bersih: UlasanShopeeBersih } | ({ ok: false } & Gagal) {
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
      rating: d.rating,
      author_name: samarkanPengulas(nama),
      body,
      follow_up: followUp,
      reviewed_at: new Date(waktu).toISOString(),
    },
  };
}
