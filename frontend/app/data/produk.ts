export type StatusPromo = "none" | "active" | "scheduled" | "ended";

export type PromoAdmin = {
  harga: number | null;
  mulai: string | null;
  akhir: string | null;
  tampilkanPeriode: boolean;
  aktif: boolean;
  status: StatusPromo;
};

export type Varian = {
  slug: string;
  sku?: string;
  label: string;
  harga: number;
  hargaNormal?: number;
  promoSampai?: string;
  beratG: number;
  stok: number;
  gambar?: string;
  aktif?: boolean;
  promo?: PromoAdmin;
  paketBeratG?: number | null;
  paketDimensi?: DimensiPaket | null;
  shopee?: RatingVarian | null;
  tokopedia?: RatingVarian | null;
};

export type DimensiPaket = { p: number; l: number; t: number };

export type Foto = {
  id: number;
  url: string;
  alt: string | null;
  varianSlug: string | null;
};

export type RatingVarian = {
  url: string | null;
  rata: number | null;
  jumlah: number | null;
  per: string | null;
};

export type RingkasanRating = { rata: number; jumlah: number };

export type SumberUlasan = "shopee" | "web" | "tokopedia";
export type PresisiUlasan = "day" | "month" | "over_year";

export type Ulasan = {
  id: number;
  sumber: SumberUlasan;
  bintang: number;
  nama: string;
  teks: string | null;
  susulan: string | null;
  susulanPada: string | null;
  pada: string;
  presisi: PresisiUlasan;
  produkAsal: string | null;
  urlAsal: string | null;
  ukuran: string;
  ukuranSlug: string;
  tersembunyi?: boolean;
};

export type RingkasanUlasan = {
  total: number;
  shopee: number;
  tokopedia: number;
  web: number;
  bintang?: Record<"1" | "2" | "3" | "4" | "5", number>;
};

export type Produk = {
  slug: string;
  nama: string;
  deskripsi: string;
  caraPakai?: string | null;
  harga: number;
  hargaNormal?: number;
  kategori: string;
  beratG: number;
  stok: number;
  terjualPerBulan: number;
  unggulan: boolean;
  aktif?: boolean;
  gambar?: string;
  foto: Foto[];
  varian: Varian[];
  ratingShopee?: RingkasanRating | null;
  ratingTokopedia?: RingkasanRating | null;
  rating?: RingkasanRating | null;
  ulasan?: Ulasan[];
  ringkasanUlasan?: RingkasanUlasan;
};

export type PasanganVarian = { produk: Produk; varian: Varian };

export function cariVarian(
  daftar: Produk[],
  slug: string,
): PasanganVarian | null {
  for (const p of daftar) {
    const v = p.varian.find((x) => x.slug === slug);
    if (v) return { produk: p, varian: v };
  }
  return null;
}

export function varianAwal(daftar: Varian[]): Varian | null {
  if (daftar.length === 0) return null;
  return daftar.find((v) => v.stok > 0) ?? daftar[0];
}

export function rentangHarga(p: Produk): { min: number; max: number } | null {
  const harga = p.varian.map((v) => v.harga);
  if (harga.length < 2) return null;

  const min = Math.min(...harga);
  const max = Math.max(...harga);
  return min === max ? null : { min, max };
}

export function semuaSlugVarian(daftar: Produk[]): string[] {
  return daftar.flatMap((p) => p.varian.map((v) => v.slug));
}

export function namaDenganUkuran(p: PasanganVarian): string {
  return p.produk.varian.length > 1
    ? `${p.produk.nama} (${p.varian.label})`
    : p.produk.nama;
}

const angka = new Intl.NumberFormat("id-ID");

export const rupiah = (n: number) => `Rp${angka.format(n)}`;
