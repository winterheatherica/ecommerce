import { urlFoto } from "./cloudinary";

export type FotoFeed = { cloudinary_id: string; version: number | null };

export type StatusPromoFeed = "none" | "active" | "scheduled" | "ended";

export type BarisFeed = {
  product_slug: string;
  name: string;
  description: string | null;
  brand: string | null;
  product_type: string | null;
  variant_slug: string;
  label: string;
  jumlah_ukuran: number;
  price: number;
  promo_price: number | null;
  promo_starts_at: Date | string | null;
  promo_ends_at: Date | string | null;
  promo_status: StatusPromoFeed;
  stock: number;
  weight_g: number;
  images: FotoFeed[];
};

export type OpsiFeed = { situs: string; awan: string; sekarang: Date };

export const NAMA_TOKO_FEED = "Menik Store";
const JUDUL_MAKS = 150;
const DESKRIPSI_MAKS = 5000;
const FOTO_TAMBAHAN_MAKS = 10;

function tanpaKendali(teks: string): string {
  let hasil = "";
  for (const c of teks) {
    const kode = c.codePointAt(0) ?? 0;
    if (kode < 32 && kode !== 9 && kode !== 10 && kode !== 13) continue;
    hasil += c;
  }
  return hasil;
}

function xml(teks: string): string {
  return tanpaKendali(teks)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function rapikan(teks: string): string {
  return teks.replace(/\s+/g, " ").trim();
}

function potong(teks: string, maks: number): string {
  if (teks.length <= maks) return teks;
  const sebagian = teks.slice(0, maks);
  const spasi = sebagian.lastIndexOf(" ");
  return (spasi > maks * 0.6 ? sebagian.slice(0, spasi) : sebagian).trim();
}

function sudahAdaUkuran(nama: string, ukuran: string): boolean {
  const n = ` ${nama.toLowerCase()} `;
  const u = ukuran.toLowerCase();
  return n.includes(` ${u} `) || n.includes(` ${u.replace(/\s+/g, "")} `);
}

function judul(b: BarisFeed): string {
  const nama = rapikan(b.name);
  const ukuran = rapikan(b.label);

  if (b.jumlah_ukuran < 2 || sudahAdaUkuran(nama, ukuran)) {
    return potong(nama, JUDUL_MAKS);
  }

  return `${potong(nama, JUDUL_MAKS - ukuran.length - 1)} ${ukuran}`;
}

function deskripsi(b: BarisFeed): string {
  return potong(rapikan(b.description ?? "") || rapikan(b.name), DESKRIPSI_MAKS);
}

function tautan(b: BarisFeed, o: OpsiFeed): string {
  const halaman = `${o.situs}/produk/${encodeURIComponent(b.product_slug)}`;
  return b.jumlah_ukuran > 1 ? `${halaman}?ukuran=${encodeURIComponent(b.variant_slug)}` : halaman;
}

export function waktuGoogle(nilai: Date | string): string {
  const wib = new Date(new Date(nilai).getTime() + 7 * 3600 * 1000);
  return `${wib.toISOString().slice(0, 16)}+0700`;
}

function promo(b: BarisFeed, o: OpsiFeed): { harga: number; periode: string | null } | null {
  if (b.promo_price === null || b.promo_price >= b.price) return null;

  if (b.promo_status === "active") {
    const periode = b.promo_ends_at
      ? `${waktuGoogle(b.promo_starts_at ?? o.sekarang)}/${waktuGoogle(b.promo_ends_at)}`
      : null;
    return { harga: b.promo_price, periode };
  }

  if (b.promo_status === "scheduled" && b.promo_starts_at && b.promo_ends_at) {
    return {
      harga: b.promo_price,
      periode: `${waktuGoogle(b.promo_starts_at)}/${waktuGoogle(b.promo_ends_at)}`,
    };
  }

  return null;
}

function elemen(nama: string, isi: string): string {
  return `    <g:${nama}>${xml(isi)}</g:${nama}>`;
}

function item(b: BarisFeed, o: OpsiFeed): string | null {
  if (b.images.length === 0) return null;

  const [utama, ...lain] = b.images.map((f) => urlFoto(o.awan, f));
  const diskon = promo(b, o);
  const bervarian = b.jumlah_ukuran > 1;

  const isi = [
    elemen("id", b.variant_slug),
    bervarian ? elemen("item_group_id", b.product_slug) : null,
    elemen("title", judul(b)),
    elemen("description", deskripsi(b)),
    elemen("link", tautan(b, o)),
    elemen("image_link", utama),
    ...lain.slice(0, FOTO_TAMBAHAN_MAKS).map((u) => elemen("additional_image_link", u)),
    elemen("availability", b.stock > 0 ? "in_stock" : "out_of_stock"),
    elemen("price", `${b.price} IDR`),
    diskon ? elemen("sale_price", `${diskon.harga} IDR`) : null,
    diskon?.periode ? elemen("sale_price_effective_date", diskon.periode) : null,
    elemen("condition", "new"),
    b.brand ? elemen("brand", b.brand) : null,
    bervarian ? elemen("size", rapikan(b.label)) : null,
    b.product_type ? elemen("product_type", b.product_type) : null,
    elemen("shipping_weight", `${b.weight_g} g`),
  ].filter((x): x is string => x !== null);

  return ["  <item>", ...isi, "  </item>"].join("\n");
}

export function buatFeedGoogle(baris: BarisFeed[], o: OpsiFeed): string {
  const isi = baris.map((b) => item(b, o)).filter((x): x is string => x !== null);

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">',
    "<channel>",
    `  <title>${xml(NAMA_TOKO_FEED)}</title>`,
    `  <link>${xml(o.situs)}</link>`,
    `  <description>${xml(`Katalog produk ${NAMA_TOKO_FEED}`)}</description>`,
    ...isi,
    "</channel>",
    "</rss>",
    "",
  ].join("\n");
}
