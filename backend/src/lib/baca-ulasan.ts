import { jenisFoto } from "./cloudinary";

export const MODEL_BACA_ULASAN = "@cf/qwen/qwen3.8-27b";
export const UKURAN_SCREENSHOT_MAKS = 8 * 1024 * 1024;
const MAKS_ULASAN = 30;
const MAKS_NAMA = 100;
const MAKS_TEKS = 3000;
const MAKS_PRODUK = 200;

export type PemanggilAi = {
  run(model: string, input: Record<string, unknown>): Promise<unknown>;
};

export type PresisiBaca = "day" | "month";

export type UlasanTerbaca = {
  nama: string;
  bintang: number;
  teks: string | null;
  tanggal: string | null;
  presisi: PresisiBaca;
  produk: string | null;
  utuh: boolean;
};

export type HasilBaca =
  | { ok: true; ulasan: UlasanTerbaca[] }
  | { ok: false; alasan: "kuota" | "tidak_terbaca" | "gagal"; pesan: string };

const SKEMA = {
  type: "object",
  properties: {
    reviews: {
      type: "array",
      items: {
        type: "object",
        properties: {
          author: { type: "string" },
          rating: { type: "integer", minimum: 1, maximum: 5 },
          text: { type: ["string", "null"] },
          date_text: { type: ["string", "null"] },
          date_iso: { type: ["string", "null"] },
          time: { type: ["string", "null"] },
          product: { type: ["string", "null"] },
          complete: { type: "boolean" },
        },
        required: ["author", "rating", "text", "date_text", "date_iso", "time", "product", "complete"],
      },
    },
  },
  required: ["reviews"],
};

function perintah(hariIni: string): string {
  return `You read screenshots of a seller app's product review list (Shopee Seller, TikTok Shop or Tokopedia Seller), written in Indonesian. Today is ${hariIni}.
Extract every review card, top to bottom. For each card:
- author: the buyer name exactly as shown, including masking characters and emoji.
- rating: count the FILLED (colored) stars only; outlined or grey stars are empty.
- text: the buyer's written review exactly as shown, or null if the card has no written text. Never include the product name, dates, variation, button labels (such as "Balas" or "Membantu") or seller replies.
- date_text: the date exactly as shown. date_iso: the same date as YYYY-MM-DD (Indonesian month names Januari to Desember; "05-11-2026" is day-month-year; resolve relative dates such as "2 hari lalu" from today's date). time: HH:MM if shown, otherwise null.
- product: the product name exactly as shown, keeping a trailing "..." if it is cut off.
- complete: false if the card is cut off by the top or bottom edge so that the name, stars, product or date is missing; otherwise true.
Do not invent anything that is not visible.`;
}

const BULAN: Record<string, number> = {
  jan: 1, januari: 1, january: 1,
  feb: 2, februari: 2, pebruari: 2, february: 2,
  mar: 3, maret: 3, march: 3,
  apr: 4, april: 4,
  mei: 5, may: 5,
  jun: 6, juni: 6, june: 6,
  jul: 7, juli: 7, july: 7,
  agu: 8, agt: 8, agus: 8, agustus: 8, aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  okt: 10, oktober: 10, oct: 10, october: 10,
  nov: 11, nopember: 11, november: 11,
  des: 12, desember: 12, dec: 12, december: 12,
};

const SELISIH_WIB_JAM = 7;

export function tanggalWib(waktu: Date): string {
  return new Date(waktu.getTime() + SELISIH_WIB_JAM * 3600e3).toISOString().slice(0, 10);
}

function jamMenit(jam: string | null | undefined): [number, number] {
  const m = jam?.trim().match(/^(\d{1,2})[:.](\d{2})$/);
  if (!m) return [12, 0];

  const j = Number(m[1]);
  const n = Number(m[2]);
  return j <= 23 && n <= 59 ? [j, n] : [12, 0];
}

function susunWaktu(tahun: number, bulan: number, hari: number, jam: string | null | undefined): string | null {
  if (!(tahun >= 2000 && tahun <= 2100 && bulan >= 1 && bulan <= 12 && hari >= 1 && hari <= 31)) return null;

  const [j, n] = jamMenit(jam);
  const waktu = new Date(Date.UTC(tahun, bulan - 1, hari, j - SELISIH_WIB_JAM, n));
  const cek = new Date(waktu.getTime() + SELISIH_WIB_JAM * 3600e3);

  if (cek.getUTCFullYear() !== tahun || cek.getUTCMonth() !== bulan - 1 || cek.getUTCDate() !== hari) return null;
  return waktu.toISOString();
}

const RELATIF = /\b(lalu|kemarin|hari ini|baru saja|ago|yesterday|today)\b/i;
const RELATIF_KASAR = /\b(minggu|bulan|tahun|week|month|year)\b/i;

export function bacaTanggal(
  teks: string | null | undefined,
  iso: string | null | undefined,
  jam: string | null | undefined,
  sekarang: Date,
): { tanggal: string | null; presisi: PresisiBaca } {
  const t = (teks ?? "").trim();
  let tanggal: string | null = null;
  let presisi: PresisiBaca = "day";
  let m: RegExpMatchArray | null;

  if ((m = t.match(/(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})(?:\D+(\d{1,2}[:.]\d{2}))?/))) {
    tanggal = susunWaktu(Number(m[3]), Number(m[2]), Number(m[1]), m[4] ?? jam);
  } else if ((m = t.match(/([A-Za-z]+)\.?\s+(\d{1,2}),?\s+(\d{4})/)) && BULAN[m[1].toLowerCase()]) {
    tanggal = susunWaktu(Number(m[3]), BULAN[m[1].toLowerCase()], Number(m[2]), jam);
  } else if ((m = t.match(/(\d{1,2})\s+([A-Za-z]+)\.?,?\s+(\d{4})/)) && BULAN[m[2].toLowerCase()]) {
    tanggal = susunWaktu(Number(m[3]), BULAN[m[2].toLowerCase()], Number(m[1]), jam);
  }

  if (!tanggal) {
    const d = (iso ?? "").trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (d) tanggal = susunWaktu(Number(d[1]), Number(d[2]), Number(d[3]), jam);
    if (tanggal && RELATIF.test(t) && RELATIF_KASAR.test(t)) presisi = "month";
  }

  if (tanggal && Date.parse(tanggal) > sekarang.getTime() + 86400e3) tanggal = null;

  return { tanggal, presisi };
}

function teksAtauNull(nilai: unknown, maks: number): string | null {
  if (typeof nilai !== "string") return null;
  const s = nilai.trim();
  return s ? s.slice(0, maks) : null;
}

export function rapikanProduk(nama: unknown): string | null {
  const s = teksAtauNull(nama, MAKS_PRODUK + 3);
  if (!s) return null;
  return s.replace(/\s*(\.{3}|…)\s*$/, "").trim().slice(0, MAKS_PRODUK) || null;
}

export function rapikanHasil(mentah: unknown, sekarang: Date): UlasanTerbaca[] | null {
  const daftar = (mentah as { reviews?: unknown })?.reviews;
  if (!Array.isArray(daftar)) return null;

  return daftar.slice(0, MAKS_ULASAN).map((r: Record<string, unknown>) => {
    const nama = (typeof r.author === "string" ? r.author : "").replace(/\s+/g, " ").trim().slice(0, MAKS_NAMA);
    const angka = Math.round(Number(r.rating));
    const bintangSah = Number.isFinite(angka) && angka >= 1 && angka <= 5;
    const waktu = bacaTanggal(
      typeof r.date_text === "string" ? r.date_text : null,
      typeof r.date_iso === "string" ? r.date_iso : null,
      typeof r.time === "string" ? r.time : null,
      sekarang,
    );

    return {
      nama,
      bintang: bintangSah ? angka : 5,
      teks: teksAtauNull(r.text, MAKS_TEKS),
      tanggal: waktu.tanggal,
      presisi: waktu.presisi,
      produk: rapikanProduk(r.product),
      utuh: r.complete !== false && bintangSah && nama !== "" && waktu.tanggal !== null,
    };
  });
}

function isiJawaban(hasil: unknown): unknown {
  const h = hasil as { response?: unknown; choices?: { message?: { content?: unknown } }[] } | null;
  const mentah = h?.choices?.[0]?.message?.content ?? h?.response;

  if (typeof mentah !== "string") return mentah ?? null;

  try {
    return JSON.parse(mentah);
  } catch {
    return null;
  }
}

export function keBase64(bait: Uint8Array): string {
  let biner = "";
  for (let i = 0; i < bait.length; i += 0x8000) {
    biner += String.fromCharCode(...bait.subarray(i, i + 0x8000));
  }
  return btoa(biner);
}

export async function periksaScreenshot(berkas: Blob): Promise<{ ok: true; mime: string } | { ok: false; pesan: string }> {
  if (berkas.size === 0) return { ok: false, pesan: "File screenshot kosong" };
  if (berkas.size > UKURAN_SCREENSHOT_MAKS) return { ok: false, pesan: "Ukuran screenshot maksimal 8 MB" };

  const mime = jenisFoto(new Uint8Array(await berkas.slice(0, 12).arrayBuffer()));
  return mime ? { ok: true, mime } : { ok: false, pesan: "Screenshot harus berformat JPG, PNG, atau WebP" };
}

export async function bacaScreenshotUlasan(
  ai: PemanggilAi,
  gambar: { base64: string; mime: string },
  sekarang: Date = new Date(),
): Promise<HasilBaca> {
  let hasil: unknown;

  try {
    hasil = await ai.run(MODEL_BACA_ULASAN, {
      messages: [
        { role: "system", content: perintah(tanggalWib(sekarang)) },
        {
          role: "user",
          content: [
            { type: "text", text: "Extract the reviews from this screenshot." },
            { type: "image_url", image_url: { url: `data:${gambar.mime};base64,${gambar.base64}`, detail: "high" } },
          ],
        },
      ],
      response_format: { type: "json_schema", json_schema: { name: "ulasan", schema: SKEMA, strict: true } },
      chat_template_kwargs: { enable_thinking: false },
      max_tokens: 4000,
      temperature: 0,
    });
  } catch (e) {
    const pesan = e instanceof Error ? e.message : String(e);
    console.error("[baca-ulasan] model gagal", pesan);
    const kuota = /neuron|allocation|quota|exceeded|4006|3036/i.test(pesan);
    return { ok: false, alasan: kuota ? "kuota" : "gagal", pesan };
  }

  const ulasan = rapikanHasil(isiJawaban(hasil), sekarang);

  if (!ulasan) {
    console.error("[baca-ulasan] jawaban model tidak terbaca", JSON.stringify(hasil).slice(0, 500));
    return { ok: false, alasan: "tidak_terbaca", pesan: "Jawaban model tidak bisa dibaca" };
  }

  return { ok: true, ulasan };
}
