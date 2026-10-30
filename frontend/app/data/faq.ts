import { KONTAK } from "@/app/data/kontak";

export type KelompokFaq = {
  judul: string;
  id: string;
  isi: { tanya: string; jawab: string }[];
};

export const KELOMPOK_FAQ: KelompokFaq[] = [
  {
    judul: "Produk",
    id: "produk",
    isi: [
      {
        tanya: "Aman untuk anak dan hewan peliharaan?",
        jawab:
          "Bahan dasarnya alami dan bekerja dengan aroma yang dihindari hama, bukan racun. Tetap simpan di luar jangkauan anak kecil dan jangan sampai termakan.",
      },
      {
        tanya: "Berapa lama efeknya bertahan?",
        jawab:
          "Tergantung bentuknya. Gel gantung seperti Goito dan Flygo bertahan sekitar satu bulan. Gel yang ditebar mengering dalam 2 sampai 5 hari tergantung produknya, lalu perlu ditebar ulang. Spray disemprot lagi begitu aromanya mulai hilang. Di area terbuka, kena hujan, atau kena matahari langsung, semuanya menguap lebih cepat.",
      },
      {
        tanya: "Cara pakainya bagaimana?",
        jawab:
          "Letakkan di jalur yang biasa dilewati hama: pintu, sudut teras, celah dapur, atau dekat tempat sampah. Jangan disemprotkan langsung ke hewannya.",
      },
      {
        tanya: "Kalau hamanya tetap datang bagaimana?",
        jawab:
          "Umumnya karena titik penempatannya kurang tepat, atau jumlahnya kurang untuk luas area tersebut. Kirim foto lokasinya lewat WhatsApp, nanti kami bantu tentukan penempatannya.",
      },
      {
        tanya: "Bedanya gel dan spray apa?",
        jawab:
          "Gel bertahan lebih lama dan cocok untuk area tetap seperti sudut ruangan. Spray bekerja lebih cepat tapi lebih singkat, cocok untuk area yang sesekali saja bermasalah.",
      },
    ],
  },
  {
    judul: "Pemesanan & Pembayaran",
    id: "pemesanan-pembayaran",
    isi: [
      {
        tanya: "Bagaimana cara memesan?",
        jawab:
          "Pilih produknya, isi alamat pengiriman, lalu selesaikan pembayaran di halaman yang muncul. Tidak perlu membuat akun.",
      },
      {
        tanya: "Metode pembayaran apa saja yang diterima?",
        jawab:
          "QRIS, yang bisa dibayar dari aplikasi m-banking atau e-wallet yang mendukung QRIS; Virtual Account BNI, BRI, Mandiri, BSI, CIMB Niaga, Permata, Danamon, BTN, dan DOKU; serta bayar tunai di kasir Indomaret atau Alfamart. Semua pilihan itu muncul di halaman pembayaran setelah checkout.",
      },
      {
        tanya: "Bisa bayar di tempat (COD)?",
        jawab:
          "Untuk saat ini belum. Semua pesanan dibayar di muka supaya paket bisa langsung masuk antrian kirim.",
      },
    ],
  },
  {
    judul: "Pengiriman",
    id: "pengiriman",
    isi: [
      {
        tanya: "Kapan pesanan saya dikirim?",
        jawab:
          `Pesanan yang dibayar sebelum pukul 12.00 dikirim hari itu juga. Setelah pukul 12.00 dikirim hari berikutnya. ${KONTAK.libur.charAt(0).toUpperCase()}${KONTAK.libur.slice(1)} tidak ada pengiriman.`,
      },
      {
        tanya: "Dikirim dari mana dan berapa lama sampai?",
        jawab:
          `Dikirim dari ${KONTAK.kotaAsalKirim}. Estimasi 1 sampai 3 hari kerja untuk Pulau Jawa, dan 3 sampai 7 hari kerja untuk luar Jawa, tergantung kurir dan alamat tujuan.`,
      },
      {
        tanya: "Ongkos kirimnya berapa?",
        jawab:
          "Dihitung otomatis saat checkout berdasarkan alamat dan berat paket, jadi angkanya sudah pasti sebelum kamu membayar.",
      },
      {
        tanya: "Bisa melacak pesanan?",
        jawab:
          "Bisa. Nomor resi dikirimkan setelah paket diserahkan ke kurir, dan status pesanan juga bisa dicek lewat halaman pesanan.",
      },
    ],
  },
  {
    judul: "Pengembalian",
    id: "pengembalian",
    isi: [
      {
        tanya: "Barang rusak atau salah kirim, bagaimana?",
        jawab:
          "Rekam video saat membuka paket, lalu kirimkan ke WhatsApp kami dalam 2x24 jam sejak paket diterima. Barang akan kami ganti tanpa biaya tambahan.",
      },
      {
        tanya: "Bisa retur kalau berubah pikiran?",
        jawab:
          "Setelah barang dikirim, pengembalian karena berubah pikiran tidak bisa kami terima. Kalau ragu soal ukuran atau kecocokan produk, tanyakan dulu lewat WhatsApp sebelum memesan.",
      },
    ],
  },
];
