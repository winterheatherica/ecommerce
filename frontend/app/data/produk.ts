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

export const kategoriJudulSeo: Record<Kategori, string> = {
  kucing: "Pengusir Kucing Alami",
  tikus: "Pengusir Tikus Alami",
  kecoa: "Pengusir Kecoa Alami",
  cicak: "Pengusir Cicak Alami",
  nyamuk: "Pengusir Nyamuk Alami",
  "perawatan-kulit": "Pembersih dan Perawatan Bahan Kulit",
};

export const kategoriRingkasan: Record<Kategori, string> = {
  kucing:
    "Pengusir kucing berbahan dasar tumbuhan untuk teras, motor, dan taman. Bekerja lewat aroma yang dihindari kucing, tanpa racun dan tanpa melukai.",
  tikus:
    "Pengusir tikus tanpa racun untuk plafon, gudang, dan dapur. Mengusir tikus keluar, jadi tidak ada bangkai yang membusuk di tempat sulit dijangkau.",
  kecoa:
    "Pengusir kecoa berbahan tumbuhan untuk dapur, saluran air, dan sudut lembap. Ditaruh di jalur yang biasa dilewati, bukan disemprot ke kecoanya.",
  cicak:
    "Pengusir cicak untuk dinding, plafon, dan sekitar lampu. Mengurangi kotoran cicak di rumah tanpa memakai bahan beracun.",
  nyamuk:
    "Pengusir nyamuk alami untuk kamar dan ruang keluarga. Berbahan dasar tumbuhan, cocok dipakai di ruangan yang ditempati sehari-hari.",
  "perawatan-kulit":
    "Perawatan bahan kulit untuk jaket, tas, sepatu, dan jok. Membersihkan dan merawat tanpa membuat permukaannya kering.",
};

export function kategoriSah(nilai: string): Kategori | "" {
  return nilai in kategoriLabel ? (nilai as Kategori) : "";
}

const angka = new Intl.NumberFormat("id-ID");

export const rupiah = (n: number) => `Rp${angka.format(n)}`;
