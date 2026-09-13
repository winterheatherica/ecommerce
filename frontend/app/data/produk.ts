export type Kategori =
  | "kucing"
  | "tikus"
  | "kecoa"
  | "cicak"
  | "nyamuk"
  | "perawatan-kulit";

export type Produk = {
  slug: string;
  nama: string;
  deskripsi: string;
  harga: number;
  kategori: Kategori;
  beratG: number;
  stok: number;
  terjualPerBulan: number;
  unggulan: boolean;
  gambar?: string;
};

export const kategoriJudul: Record<Kategori, string> = {
  kucing: "Pengusir Kucing",
  tikus: "Pengusir Tikus",
  kecoa: "Pengusir Kecoa",
  cicak: "Pengusir Cicak",
  nyamuk: "Pengusir Nyamuk",
  "perawatan-kulit": "Perawatan Kulit",
};

export const kategoriLabel: Record<Kategori, string> = {
  kucing: "Kucing",
  tikus: "Tikus",
  kecoa: "Kecoa",
  cicak: "Cicak",
  nyamuk: "Nyamuk",
  "perawatan-kulit": "Perawatan Kulit",
};

const angka = new Intl.NumberFormat("id-ID");

export const rupiah = (n: number) => `Rp${angka.format(n)}`;
