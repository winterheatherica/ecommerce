export type VarianKatalog = { slug: string; label: string; produk: string };

const SATUAN: [RegExp, string][] = [
  [/(\d+)\s*(?:gram|grams|gr|g)\b/g, "$1g"],
  [/(\d+)\s*(?:ml|mili)\b/g, "$1ml"],
  [/(\d+)\s*(?:kg|kilo)\b/g, "$1kg"],
  [/(\d+)\s*(?:liter|litre|lt)\b/g, "$1l"],
];

const ABAIKAN = new Set([
  "dan", "untuk", "di", "dengan", "isi", "yang", "the", "and", "with", "for", "of", "pcs", "ori", "original", "x",
]);

const SINONIM: Record<string, string> = {
  cat: "kucing",
  mouse: "tikus",
  rat: "tikus",
  cockroach: "kecoa",
  roach: "kecoa",
  lizard: "cicak",
  gecko: "cicak",
  mosquito: "nyamuk",
  ant: "semut",
  fly: "lalat",
  flies: "lalat",
  snake: "ular",
  termite: "rayap",
  dog: "anjing",
  spider: "laba",
  bugs: "kutu",
  tungau: "kutu",
  snail: "siput",
  bekicot: "siput",
  civet: "musang",
  semprot: "spray",
  bundle: "paket",
  combo: "paket",
  lilin: "candle",
};

const JENIS = new Set([
  "kucing", "tikus", "kecoa", "cicak", "nyamuk", "semut", "lalat", "ular", "rayap", "anjing", "laba", "kutu",
  "siput", "musang",
]);
const BENTUK = new Set(["gel", "spray", "candle", "oil", "cleaner", "foam"]);
const BUKAN_MEREK = new Set(["paket", "hemat", "promo", "new", "baru"]);
const UKURAN = /^\d+(?:g|ml|kg|l)$/;
const AMBANG = 0.2;
const SELISIH = 1.1;
const KANDIDAT_MIN = 0.05;
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

export function cocokKunci(kunci: string, tersimpan: string): boolean {
  if (kunci === tersimpan) return true;
  if (kunci.length < PREFIKS_MIN || tersimpan.length < PREFIKS_MIN) return false;
  return tersimpan.startsWith(kunci) || kunci.startsWith(tersimpan);
}

function daftarToken(teks: string): string[] {
  return rataTeks(teks)
    .split(" ")
    .filter((t) => t && !ABAIKAN.has(t))
    .map((t) => SINONIM[t] ?? t);
}

function token(teks: string): Set<string> {
  const daftar = daftarToken(teks);
  const gabung = daftar.slice(1).map((t, i) => `${daftar[i]}${t}`);
  return new Set([...daftar, ...gabung]);
}

function merek(namaProduk: string): string | null {
  return daftarToken(namaProduk).find((t) => !BUKAN_MEREK.has(t) && !/^\d/.test(t)) ?? null;
}

function irisan(a: Set<string>, b: Set<string>): string[] {
  return [...a].filter((x) => b.has(x));
}

function berbeda(a: Set<string>, b: Set<string>, uji: (x: string) => boolean): boolean {
  const x = new Set([...a].filter(uji));
  const y = new Set([...b].filter(uji));
  return x.size > 0 && y.size > 0 && irisan(x, y).length === 0;
}

function skorKemiripan(
  cari: Set<string>,
  milik: Set<string>,
  merekMilik: string | null,
  bobot: (t: string) => number,
): number {
  const jumlah = (daftar: Iterable<string>) => [...daftar].reduce((n, t) => n + bobot(t), 0);
  const sama = jumlah(irisan(cari, milik));
  const totalMilik = jumlah(milik);
  const totalCari = jumlah(cari);
  if (sama === 0 || totalMilik === 0 || totalCari === 0) return 0;

  const tertutup = sama / totalMilik;
  const terjelaskan = sama / totalCari;
  let skor = (5 * tertutup * terjelaskan) / (4 * terjelaskan + tertutup);

  if (berbeda(cari, milik, (x) => JENIS.has(x))) skor *= 0.15;
  if (berbeda(cari, milik, (x) => UKURAN.test(x))) skor *= 0.7;
  if (berbeda(cari, milik, (x) => BENTUK.has(x))) skor *= 0.5;
  if (cari.has("paket") !== milik.has("paket")) skor *= 0.6;
  if (merekMilik && !cari.has(merekMilik)) skor *= 0.35;

  return skor;
}

export function peringkatVarian(
  namaMarketplace: string,
  katalog: VarianKatalog[],
): { slug: string; skor: number }[] {
  const cari = token(namaMarketplace);
  if (cari.size === 0 || katalog.length === 0) return [];

  const dokumen = katalog.map((v) => token(`${v.produk} ${v.label}`));
  const merekVarian = katalog.map((v) => merek(v.produk));
  const muncul = new Map<string, number>();
  for (const d of dokumen) for (const t of d) muncul.set(t, (muncul.get(t) ?? 0) + 1);

  const bobot = (t: string) => {
    const idf = Math.log(1 + katalog.length / (muncul.get(t) ?? 1));
    return UKURAN.test(t) || JENIS.has(t) ? idf * 1.5 : idf;
  };

  return dokumen
    .map((milik, i) => ({ slug: katalog[i].slug, skor: skorKemiripan(cari, milik, merekVarian[i], bobot) }))
    .sort((a, b) => b.skor - a.skor);
}

export function kandidatVarian(namaMarketplace: string, katalog: VarianKatalog[], jumlah = 3): string[] {
  return peringkatVarian(namaMarketplace, katalog)
    .filter((r) => r.skor >= KANDIDAT_MIN)
    .slice(0, jumlah)
    .map((r) => r.slug);
}

export function tebakVarian(namaMarketplace: string, katalog: VarianKatalog[]): string | null {
  const [pertama, kedua] = peringkatVarian(namaMarketplace, katalog);

  if (!pertama || pertama.skor < AMBANG) return null;
  if (kedua && kedua.skor > 0 && pertama.skor < kedua.skor * SELISIH) return null;
  return pertama.slug;
}
