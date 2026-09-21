export type Grup = "hama" | "hewan" | "rumah" | "paket";

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
  | "laba-laba"
  | "rayap"
  | "siput"
  | "kutu-kasur"
  | "perilaku-anjing"
  | "perawatan-hewan"
  | "perawatan-kulit"
  | "pembersih-rumah"
  | "aroma-rumah"
  | "paket";

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

type InfoKategori = {
  grup: Grup;
  label: string;
  judul: string;
  judulSeo: string;
  ringkasan: string;
};

export const KATEGORI: Record<Kategori, InfoKategori> = {
  kucing: {
    grup: "hama",
    label: "Kucing",
    judul: "Pengusir Kucing",
    judulSeo: "Pengusir Kucing Alami",
    ringkasan:
      "Pengusir kucing berbahan dasar tumbuhan untuk teras, motor, dan taman. Bekerja lewat aroma yang dihindari kucing, tanpa racun dan tanpa melukai.",
  },
  tikus: {
    grup: "hama",
    label: "Tikus",
    judul: "Pengusir Tikus",
    judulSeo: "Pengusir Tikus Alami",
    ringkasan:
      "Pengusir tikus tanpa racun untuk plafon, gudang, dan dapur. Mengusir tikus keluar, jadi tidak ada bangkai yang membusuk di tempat sulit dijangkau.",
  },
  kecoa: {
    grup: "hama",
    label: "Kecoa",
    judul: "Pengusir Kecoa",
    judulSeo: "Pengusir Kecoa Alami",
    ringkasan:
      "Pengusir kecoa berbahan tumbuhan untuk dapur, saluran air, dan sudut lembap. Ditaruh di jalur yang biasa dilewati, bukan disemprot ke kecoanya.",
  },
  cicak: {
    grup: "hama",
    label: "Cicak",
    judul: "Pengusir Cicak",
    judulSeo: "Pengusir Cicak Alami",
    ringkasan:
      "Pengusir cicak untuk dinding, plafon, dan sekitar lampu. Mengurangi kotoran cicak di rumah tanpa memakai bahan beracun.",
  },
  nyamuk: {
    grup: "hama",
    label: "Nyamuk",
    judul: "Pengusir Nyamuk",
    judulSeo: "Pengusir Nyamuk Alami",
    ringkasan:
      "Pengusir nyamuk alami untuk kamar dan ruang keluarga. Berbahan dasar tumbuhan, cocok dipakai di ruangan yang ditempati sehari-hari.",
  },
  ular: {
    grup: "hama",
    label: "Ular",
    judul: "Pengusir Ular",
    judulSeo: "Pengusir Ular Alami",
    ringkasan:
      "Pengusir ular berbahan tumbuhan untuk halaman, kebun, saluran air, dan celah bawah rumah. Ditaruh di jalur masuk, bukan untuk melukai ularnya.",
  },
  lalat: {
    grup: "hama",
    label: "Lalat",
    judul: "Pengusir Lalat",
    judulSeo: "Pengusir Lalat Alami",
    ringkasan:
      "Pengusir lalat alami untuk dapur, tempat sampah, dan warung. Bekerja lewat aroma, tanpa racun dan tanpa kertas lengket yang perlu diganti terus.",
  },
  semut: {
    grup: "hama",
    label: "Semut",
    judul: "Pengusir Semut",
    judulSeo: "Pengusir Semut Alami",
    ringkasan:
      "Pengusir semut alami untuk dapur, lemari makanan, dan jalur semut di dinding. Mengusir tanpa meninggalkan bahan beracun di dekat makanan.",
  },
  musang: {
    grup: "hama",
    label: "Musang",
    judul: "Pengusir Musang",
    judulSeo: "Pengusir Musang Alami",
    ringkasan:
      "Pengusir musang untuk plafon, atap, dan kandang unggas. Mengusir lewat aroma yang dihindari musang, tanpa perangkap dan tanpa melukai.",
  },
  "laba-laba": {
    grup: "hama",
    label: "Laba-laba",
    judul: "Pengusir Laba-laba",
    judulSeo: "Pengusir Laba-laba Alami",
    ringkasan:
      "Pengusir laba-laba untuk sudut plafon, gudang, dan belakang lemari. Mengurangi sarang yang terus muncul di tempat yang jarang tersentuh.",
  },
  rayap: {
    grup: "hama",
    label: "Rayap",
    judul: "Pengusir Rayap",
    judulSeo: "Pengusir Rayap Alami",
    ringkasan:
      "Pengusir rayap untuk kusen, perabot kayu, dan bagian rumah yang lembap. Disemprotkan ke area yang ingin dilindungi, bukan ke rayapnya.",
  },
  siput: {
    grup: "hama",
    label: "Siput",
    judul: "Pengusir Siput dan Bekicot",
    judulSeo: "Pengusir Siput dan Bekicot Alami",
    ringkasan:
      "Pengusir siput dan bekicot untuk kebun, pot tanaman, dan teras yang lembap. Menjaga tanaman tanpa memakai bahan yang meracuni tanahnya.",
  },
  "kutu-kasur": {
    grup: "hama",
    label: "Kutu kasur",
    judul: "Pengusir Kutu Kasur",
    judulSeo: "Pengusir Kutu Kasur dan Tungau",
    ringkasan:
      "Untuk kasur, sofa, dan kain pelapis yang jadi sarang kutu dan tungau. Disemprotkan ke permukaan yang sering bersentuhan dengan kulit.",
  },
  "perilaku-anjing": {
    grup: "hewan",
    label: "Perilaku anjing",
    judul: "Perilaku Anjing",
    judulSeo: "Spray Pelatih Perilaku Anjing",
    ringkasan:
      "Untuk anjing yang menggigiti perabot atau buang air sembarangan. Disemprotkan ke barang atau area yang ingin dihindari, bukan ke anjingnya.",
  },
  "perawatan-hewan": {
    grup: "hewan",
    label: "Perawatan hewan",
    judul: "Perawatan Hewan Peliharaan",
    judulSeo: "Suplemen dan Perawatan Hewan Peliharaan",
    ringkasan:
      "Suplemen campuran makanan dan penghilang bau untuk anjing dan kucing peliharaan di rumah.",
  },
  "perawatan-kulit": {
    grup: "rumah",
    label: "Bahan kulit",
    judul: "Perawatan Bahan Kulit",
    judulSeo: "Pembersih dan Perawatan Bahan Kulit",
    ringkasan:
      "Perawatan bahan kulit untuk jaket, tas, sepatu, dan jok. Membersihkan dan merawat tanpa membuat permukaannya kering.",
  },
  "pembersih-rumah": {
    grup: "rumah",
    label: "Pembersih rumah",
    judul: "Pembersih Rumah",
    judulSeo: "Pembersih Rumah dan Perabot",
    ringkasan:
      "Pembersih sepatu, penghilang jamur dan lumut, serta perapi kain tanpa setrika untuk keperluan rumah sehari-hari.",
  },
  "aroma-rumah": {
    grup: "rumah",
    label: "Aroma rumah",
    judul: "Aroma Rumah",
    judulSeo: "Lilin Aromaterapi dan Pewangi Rumah",
    ringkasan:
      "Lilin aromaterapi dan pewangi untuk ruangan di rumah.",
  },
  paket: {
    grup: "paket",
    label: "Paket",
    judul: "Paket Hemat",
    judulSeo: "Paket Hemat Gel dan Spray",
    ringkasan:
      "Paket berisi gel dan spray sekaligus, untuk area yang perlu penanganan cepat sekaligus perlindungan yang bertahan lama.",
  },
};

export const GRUP: Record<Grup, { label: string; judul: string; ringkasan: string }> =
  {
    hama: {
      label: "Pengusir hama",
      judul: "Pengusir Hama Alami",
      ringkasan:
        "Pengusir kucing, tikus, kecoa, cicak, nyamuk, dan hama rumah lainnya, semuanya berbahan dasar tumbuhan dan bekerja dengan aroma.",
    },
    hewan: {
      label: "Hewan peliharaan",
      judul: "Kebutuhan Hewan Peliharaan",
      ringkasan:
        "Spray pelatih perilaku, suplemen campuran makanan, dan penghilang bau untuk anjing dan kucing di rumah.",
    },
    rumah: {
      label: "Perawatan rumah",
      judul: "Perawatan Rumah dan Barang",
      ringkasan:
        "Perawatan bahan kulit, pembersih sepatu, penghilang jamur dan lumut, serta pewangi ruangan.",
    },
    paket: {
      label: "Paket hemat",
      judul: "Paket Hemat",
      ringkasan:
        "Paket berisi gel dan spray sekaligus, lebih hemat dibanding membeli terpisah.",
    },
  };

export const SEMUA_KATEGORI = Object.keys(KATEGORI) as Kategori[];
export const SEMUA_GRUP = Object.keys(GRUP) as Grup[];

function petakan<T>(ambil: (i: InfoKategori) => T): Record<Kategori, T> {
  return Object.fromEntries(
    Object.entries(KATEGORI).map(([k, v]) => [k, ambil(v)]),
  ) as Record<Kategori, T>;
}

export const kategoriLabel = petakan((i) => i.label);
export const kategoriJudul = petakan((i) => i.judul);
export const kategoriJudulSeo = petakan((i) => i.judulSeo);
export const kategoriRingkasan = petakan((i) => i.ringkasan);

export function kategoriSah(nilai: string): Kategori | "" {
  return nilai in KATEGORI ? (nilai as Kategori) : "";
}

export function grupSah(nilai: string): Grup | "" {
  return nilai in GRUP ? (nilai as Grup) : "";
}

export function kategoriDalamGrup(grup: Grup): Kategori[] {
  return SEMUA_KATEGORI.filter((k) => KATEGORI[k].grup === grup);
}

export function grupDariKategori(kategori: Kategori): Grup {
  return KATEGORI[kategori].grup;
}

const angka = new Intl.NumberFormat("id-ID");

export const rupiah = (n: number) => `Rp${angka.format(n)}`;
