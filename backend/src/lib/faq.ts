import type { Gagal } from "./products";

export type KelompokFaqBaru = {
  slug: string;
  title: string;
  items: { question: string; answer: string }[];
};

export const PENANDA_FAQ = ["wa", "hari", "jam", "libur", "kota", "alamat"] as const;
export const KELOMPOK_FAQ_MAKS = 20;
export const PERTANYAAN_MAKS = 50;

const POLA_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function gagal(error: string, message: string): { ok: false } & Gagal {
  return { ok: false, status: 422, badan: { error, message, field: "faq" } };
}

function satuBaris(nilai: string): string {
  return nilai.replace(/\s+/g, " ").trim();
}

function paragraf(nilai: string): string {
  return nilai
    .split(/\r\n|\r|\n/)
    .map((b) => b.replace(/[ \t]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function penandaAsing(teks: string): string | null {
  for (const m of teks.matchAll(/\{([^{}]*)\}/g)) {
    if (!(PENANDA_FAQ as readonly string[]).includes(m[1])) return m[0];
  }
  return null;
}

export function periksaFaq(
  kelompok: KelompokFaqBaru[],
): { ok: true; bersih: KelompokFaqBaru[] } | ({ ok: false } & Gagal) {
  if (kelompok.length === 0 || kelompok.length > KELOMPOK_FAQ_MAKS) {
    return gagal("invalid_faq", `Kelompok FAQ harus 1 sampai ${KELOMPOK_FAQ_MAKS}`);
  }

  const bersih: KelompokFaqBaru[] = [];
  for (const k of kelompok) {
    const slug = satuBaris(k.slug).toLowerCase();
    const title = satuBaris(k.title);
    const nama = title || slug || "tanpa judul";

    if (!POLA_SLUG.test(slug) || slug.length > 60) {
      return gagal("invalid_slug", `Kelompok "${nama}": slug hanya boleh huruf kecil, angka, dan tanda hubung`);
    }
    if (bersih.some((x) => x.slug === slug)) {
      return gagal("duplicate_slug", `Slug kelompok "${slug}" dipakai dua kali`);
    }
    if (title.length < 2 || title.length > 80) {
      return gagal("invalid_faq", `Kelompok "${nama}": judul 2 sampai 80 huruf`);
    }
    if (k.items.length === 0 || k.items.length > PERTANYAAN_MAKS) {
      return gagal("invalid_faq", `Kelompok "${nama}": isi 1 sampai ${PERTANYAAN_MAKS} pertanyaan`);
    }

    const items: KelompokFaqBaru["items"] = [];
    for (const [i, x] of k.items.entries()) {
      const question = satuBaris(x.question);
      const answer = paragraf(x.answer);
      const posisi = `Kelompok "${nama}", pertanyaan ${i + 1}`;

      if (question.length < 5 || question.length > 300) {
        return gagal("invalid_faq", `${posisi}: pertanyaan 5 sampai 300 huruf`);
      }
      if (answer.length < 2 || answer.length > 3000) {
        return gagal("invalid_faq", `${posisi}: jawaban 2 sampai 3000 huruf`);
      }

      const asing = penandaAsing(question) ?? penandaAsing(answer);
      if (asing) return gagal("unknown_placeholder", `${posisi}: penanda ${asing} tidak dikenal`);

      items.push({ question, answer });
    }

    bersih.push({ slug, title, items });
  }

  return { ok: true, bersih };
}
