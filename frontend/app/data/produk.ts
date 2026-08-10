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
  harga: number;
  kategori: Kategori;
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

export const daftarProduk: Produk[] = [
  {
    slug: "bye-bye-cat-50g",
    nama: "Alat pengusir kucing Bye Bye Cat 50g",
    harga: 49000,
    kategori: "kucing",
    stok: 24,
    terjualPerBulan: 27,
    unggulan: true,
  },
  {
    slug: "bye-bye-cat-80g",
    nama: "Alat pengusir kucing Bye Bye Cat 80g",
    harga: 59000,
    kategori: "kucing",
    stok: 18,
    terjualPerBulan: 18,
    unggulan: true,
  },
  {
    slug: "goito-gel-nyamuk",
    nama: "Goito Gel — Pengusir Nyamuk Alami",
    harga: 33000,
    kategori: "nyamuk",
    stok: 31,
    terjualPerBulan: 17,
    unggulan: true,
  },
  {
    slug: "sangreat-leather-jacket-cleaner",
    nama: "SanGreat Leather Jacket Cleaner and Polish",
    harga: 97000,
    kategori: "perawatan-kulit",
    stok: 7,
    terjualPerBulan: 10,
    unggulan: true,
  },
  {
    slug: "bye-bye-kecoa-50gr",
    nama: "Bye Bye Kecoa Gel 50gr — Pengusir Kecoa Natural",
    harga: 54000,
    kategori: "kecoa",
    stok: 12,
    terjualPerBulan: 9,
    unggulan: true,
  },
  {
    slug: "cicago-gel-cicak-70g",
    nama: "Cicago Gel Pengusir Cicak Alami 70g",
    harga: 35000,
    kategori: "cicak",
    stok: 15,
    terjualPerBulan: 8,
    unggulan: true,
  },
  {
    slug: "sangreat-leather-bag-cleaner",
    nama: "SanGreat Leather Bag Cleaner & Polish",
    harga: 97000,
    kategori: "perawatan-kulit",
    stok: 5,
    terjualPerBulan: 6,
    unggulan: false,
  },
  {
    slug: "bye-bye-cicak-spray-80ml",
    nama: "Bye Bye Cicak Spray 80ml Pengusir Cicak",
    harga: 64000,
    kategori: "cicak",
    stok: 9,
    terjualPerBulan: 5,
    unggulan: false,
  },
  {
    slug: "bye-bye-mouse-100gr",
    nama: "Bye Bye Mouse 100gr — Pengusir Tikus Non-Racun",
    harga: 59000,
    kategori: "tikus",
    stok: 11,
    terjualPerBulan: 5,
    unggulan: false,
  },
  {
    slug: "bye-bye-cicak-gel-80gr",
    nama: "Bye Bye Cicak Gel 80gr — Pengusir Cicak",
    harga: 69000,
    kategori: "cicak",
    stok: 0,
    terjualPerBulan: 4,
    unggulan: false,
  },
  {
    slug: "gocat-gel-refill-66g",
    nama: "GoCat Gel Refill Ekonomis 66g Pengusir Kucing",
    harga: 35000,
    kategori: "kucing",
    stok: 20,
    terjualPerBulan: 4,
    unggulan: false,
  },
];

const angka = new Intl.NumberFormat("id-ID");

export const rupiah = (n: number) => `Rp${angka.format(n)}`;
