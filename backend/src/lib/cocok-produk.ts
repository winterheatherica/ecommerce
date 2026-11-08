export type VarianKatalog = { slug: string; label: string; produk: string };

const SATUAN: [RegExp, string][] = [
  [/(\d+)\s*(?:gram|grams|gr|g)\b/g, "$1g"],
  [/(\d+)\s*(?:ml|mili)\b/g, "$1ml"],
  [/(\d+)\s*(?:kg|kilo)\b/g, "$1kg"],
  [/(\d+)\s*(?:liter|litre|lt)\b/g, "$1l"],
];

const ABAIKAN = new Set(["dan", "untuk", "di", "dengan", "isi", "the", "and", "with", "pcs", "ori", "original"]);
const UKURAN = /^\d+(?:g|ml|kg|l)$/;

const JENIS: Record<string, string> = {
  kucing: "kucing", cat: "kucing",
  tikus: "tikus", mouse: "tikus", rat: "tikus",
  kecoa: "kecoa", cockroach: "kecoa", roach: "kecoa",
  cicak: "cicak", lizard: "cicak", gecko: "cicak",
  nyamuk: "nyamuk", mosquito: "nyamuk",
  semut: "semut", ant: "semut",
  lalat: "lalat", fly: "lalat",
  ular: "ular", snake: "ular",
  rayap: "rayap", termite: "rayap",
  anjing: "anjing", dog: "anjing",
  musang: "musang",
};
const NAMA_JENIS = new Set(Object.values(JENIS));
const KUNCI_MAKS = 200;
const PREFIKS_MIN = 15;

export function rataTeks(teks: string): string {
  let s = teks
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s*(\.{3}|…)\s*$/, "");

  for (const [pola, ganti] of SATUAN) s = s.replace(pola, ganti);

  return s.replace(/[^a-z0-9]+/g, " ").trim();
}

export function kunciProduk(nama: string): string {
  return rataTeks(nama).slice(0, KUNCI_MAKS);
}

function token(teks: string): Set<string> {
  return new Set(
    rataTeks(teks)
      .split(" ")
      .filter((t) => t && !ABAIKAN.has(t))
      .map((t) => JENIS[t] ?? t),
  );
}

function bobot(t: string): number {
  return UKURAN.test(t) || NAMA_JENIS.has(t) ? 3 : 1;
}

export function cocokKunci(kunci: string, tersimpan: string): boolean {
  if (kunci === tersimpan) return true;
  if (kunci.length < PREFIKS_MIN || tersimpan.length < PREFIKS_MIN) return false;
  return tersimpan.startsWith(kunci) || kunci.startsWith(tersimpan);
}

export function tebakVarian(namaMarketplace: string, katalog: VarianKatalog[]): string | null {
  const cari = token(namaMarketplace);
  const ukuranCari = [...cari].filter((t) => UKURAN.test(t));
  const jenisCari = [...cari].filter((t) => NAMA_JENIS.has(t));

  let terbaik: { slug: string; skor: number } | null = null;
  let kedua = -Infinity;

  for (const v of katalog) {
    const milik = token(`${v.produk} ${v.label}`);
    let skor = 0;

    for (const t of milik) if (cari.has(t)) skor += bobot(t);

    const ukuranMilik = [...milik].filter((t) => UKURAN.test(t));
    if (ukuranCari.length > 0 && ukuranMilik.length > 0 && !ukuranMilik.some((u) => cari.has(u))) skor -= 3;

    const jenisMilik = [...milik].filter((t) => NAMA_JENIS.has(t));
    if (jenisCari.length > 0 && jenisMilik.length > 0 && !jenisMilik.some((j) => cari.has(j))) skor -= 6;

    if (!terbaik || skor > terbaik.skor) {
      kedua = terbaik?.skor ?? -Infinity;
      terbaik = { slug: v.slug, skor };
    } else if (skor > kedua) {
      kedua = skor;
    }
  }

  if (!terbaik || terbaik.skor < 3 || terbaik.skor - kedua < 1) return null;
  return terbaik.slug;
}
