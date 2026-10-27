import type { Varian } from "@/app/data/produk";

export function angkaRating(rata: number): string {
  return rata.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

export function jumlahLengkap(n: number): string {
  return n.toLocaleString("id-ID");
}

export function jumlahSingkat(n: number): string {
  if (n < 1000) return String(n);
  const ribu = Math.floor(n / 100) / 10;
  return `${ribu.toLocaleString("id-ID", { maximumFractionDigits: 1 })} rb`;
}

export function tanggalRating(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });
}

export type Marketplace = "shopee" | "tokopedia";

export const NAMA_MARKETPLACE: Record<Marketplace, string> = {
  shopee: "Shopee",
  tokopedia: "Tokopedia",
};

export const SATUAN_RATING: Record<Marketplace, string> = {
  shopee: "penilaian",
  tokopedia: "rating",
};

export function perTerbaru(varian: Varian[], sumber: Marketplace = "shopee"): string | null {
  const daftar = varian.flatMap((v) => {
    const per = v[sumber]?.per;
    return per ? [per] : [];
  });
  if (daftar.length === 0) return null;
  return daftar.reduce((a, b) => (Date.parse(b) > Date.parse(a) ? b : a));
}
