import type { Metadata } from "next";
import { KONTAK } from "@/app/data/kontak";

import JsonLd from "@/app/components/json-ld";
import { metaHalaman, skemaFaq } from "@/app/lib/seo";

export const metadata: Metadata = metaHalaman({
  judul: "Pertanyaan Umum",
  ringkasan:
    "Jawaban seputar produk pengusir hama alami, cara pakai, pemesanan, ongkos kirim, dan pengembalian barang di Menik Store.",
  path: "/faq",
});

const kelompok = [
  {
    judul: "Produk",
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
    isi: [
      {
        tanya: "Bagaimana cara memesan?",
        jawab:
          "Pilih produknya, isi alamat pengiriman, lalu selesaikan pembayaran di halaman yang muncul. Tidak perlu membuat akun.",
      },
      {
        tanya: "Metode pembayaran apa saja yang diterima?",
        jawab:
          "Untuk sementara lewat Virtual Account BNI. Nomornya muncul di halaman pembayaran setelah checkout, dan bisa dibayar dari bank lain lewat transfer antarbank.",
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

export default function FaqPage() {
  return (
    <section className="mx-auto w-full max-w-3xl px-6 pt-32 pb-24">
      <JsonLd data={skemaFaq(kelompok.flatMap((k) => k.isi))} />

      <p className="font-mono text-[13px] tracking-[0.28em] text-accent-600 uppercase">
        Bantuan
      </p>
      <h1 className="mt-3 text-3xl leading-tight font-semibold tracking-tight text-ink sm:text-4xl">
        Pertanyaan umum
      </h1>
      <p className="mt-4 max-w-xl leading-relaxed text-stone-600">
        Kalau jawabannya belum ada di sini, chat kami di WhatsApp. Dibalas
        rata-rata dalam satu jam pada hari kerja.
      </p>

      {kelompok.map((k) => (
        <div key={k.judul} className="mt-16">
          <h2 className="font-mono text-[13px] tracking-[0.28em] text-brand-600 uppercase">
            {k.judul}
          </h2>

          <div className="mt-6 border-t border-ink/10">
            {k.isi.map((item) => (
              <details key={item.tanya} className="group border-b border-ink/10">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-ink transition-colors hover:text-brand-600 [&::-webkit-details-marker]:hidden">
                  <span className="text-base leading-snug">{item.tanya}</span>
                  <svg
                    className="h-4 w-4 shrink-0 text-stone-400 transition-transform duration-300 group-open:rotate-45"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.6}
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" d="M12 5v14M5 12h14" />
                  </svg>
                </summary>
                <p className="pb-6 text-sm leading-relaxed text-stone-600">
                  {item.jawab}
                </p>
              </details>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
