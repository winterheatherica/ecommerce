export type Kategori =
  | "kucing"
  | "tikus"
  | "kecoa"
  | "cicak"
  | "nyamuk"
  | "ular"
  | "lalat"
  | "semut"
  | "musang"
  | "paket"
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
  ular: "Pengusir Ular",
  lalat: "Pengusir Lalat",
  semut: "Pengusir Semut",
  musang: "Pengusir Musang",
  paket: "Paket Hemat",
  "perawatan-kulit": "Perawatan Kulit",
};

export const kategoriLabel: Record<Kategori, string> = {
  kucing: "Kucing",
  tikus: "Tikus",
  kecoa: "Kecoa",
  cicak: "Cicak",
  nyamuk: "Nyamuk",
  ular: "Ular",
  lalat: "Lalat",
  semut: "Semut",
  musang: "Musang",
  paket: "Paket",
  "perawatan-kulit": "Perawatan Kulit",
};

export const kategoriJudulSeo: Record<Kategori, string> = {
  kucing: "Pengusir Kucing Alami",
  tikus: "Pengusir Tikus Alami",
  kecoa: "Pengusir Kecoa Alami",
  cicak: "Pengusir Cicak Alami",
  nyamuk: "Pengusir Nyamuk Alami",
  ular: "Pengusir Ular Alami",
  lalat: "Pengusir Lalat Alami",
  semut: "Pengusir Semut Alami",
  musang: "Pengusir Musang Alami",
  paket: "Paket Hemat Gel dan Spray",
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
  ular:
    "Pengusir ular berbahan tumbuhan untuk halaman, kebun, saluran air, dan celah bawah rumah. Ditaruh di jalur masuk, bukan untuk melukai ularnya.",
  lalat:
    "Pengusir lalat alami untuk dapur, tempat sampah, dan warung. Bekerja lewat aroma, tanpa racun dan tanpa kertas lengket yang perlu diganti terus.",
  semut:
    "Pengusir semut alami untuk dapur, lemari makanan, dan jalur semut di dinding. Mengusir tanpa meninggalkan bahan beracun di dekat makanan.",
  musang:
    "Pengusir musang untuk plafon, atap, dan kandang unggas. Mengusir lewat aroma yang dihindari musang, tanpa perangkap dan tanpa melukai.",
  paket:
    "Paket berisi gel dan spray sekaligus, untuk area yang perlu penanganan cepat sekaligus perlindungan yang bertahan lama.",
  "perawatan-kulit":
    "Perawatan bahan kulit untuk jaket, tas, sepatu, dan jok. Membersihkan dan merawat tanpa membuat permukaannya kering.",
};

export function kategoriSah(nilai: string): Kategori | "" {
  return nilai in kategoriLabel ? (nilai as Kategori) : "";
}

const angka = new Intl.NumberFormat("id-ID");

export const rupiah = (n: number) => `Rp${angka.format(n)}`;
