import type { Produk } from "@/app/data/produk";

const DAFTAR_PRODUK = "/admin/produk";
const PANJANG_MAKS = 100;

export function rapikanCari(nilai: string | string[] | undefined): string {
  const teks = Array.isArray(nilai) ? (nilai[0] ?? "") : (nilai ?? "");
  return teks.slice(0, PANJANG_MAKS);
}

export function alamatDaftarProduk(cari: string): string {
  const kata = cari.trim();
  return kata ? `${DAFTAR_PRODUK}?${new URLSearchParams({ q: kata })}` : DAFTAR_PRODUK;
}

function normalisasi(teks: string): string {
  return teks
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function saringProduk(
  produk: Produk[],
  cari: string,
  labelKategori: (slug: string) => string | undefined,
): Produk[] {
  const kata = normalisasi(cari).split(" ").filter(Boolean);

  if (kata.length === 0) return produk;

  return produk.filter((p) => {
    const isian = [
      p.nama,
      p.slug,
      p.kategori,
      labelKategori(p.kategori),
      ...p.varian.flatMap((v) => [v.label, v.slug, v.sku]),
    ];
    const teks = normalisasi(isian.filter(Boolean).join(" "));
    const rapat = teks.replace(/ /g, "");

    return kata.every((k) => teks.includes(k) || rapat.includes(k));
  });
}
