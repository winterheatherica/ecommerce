import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pertanyaan Umum — Menik Store",
  description:
    "Jawaban seputar produk pengusir hama alami, pemesanan, pengiriman, dan pengembalian barang.",
};

const kelompok = [
  {
    judul: "Produk",
    isi: [
      {
        tanya: "Aman untuk anak dan hewan peliharaan?",
        jawab:
          "Bahan dasarnya tumbuhan, tanpa pestisida sintetis, dan produknya terdaftar Kemenkes RI PKD. Tetap simpan di luar jangkauan anak kecil dan jangan sampai termakan.",
      },
      {
        tanya: "Berapa lama efeknya bertahan?",
        jawab:
          "Rata-rata 3–5 hari sekali pakai. Di area terbuka, kena hujan, atau kena matahari langsung, aromanya menguap lebih cepat sehingga perlu diganti lebih sering.",
      },
      {
        tanya: "Cara pakainya bagaimana?",
        jawab:
          "Letakkan di jalur yang biasa dilewati hama — pintu, sudut teras, celah dapur, atau dekat tempat sampah. Jangan disemprotkan langsung ke hewannya.",
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
          "Transfer bank (BCA, Mandiri, BNI), QRIS, dan dompet digital seperti GoPay, OVO, serta DANA.",
      },
      {
        tanya: "Bisa bayar di tempat (COD)?",
        jawab:
          "Untuk saat ini belum. Semua pesanan dibayar di muka agar paket bisa langsung diproses hari itu juga.",
      },
    ],
  },
  {
    judul: "Pengiriman",
    isi: [
      {
        tanya: "Dikirim dari mana dan berapa lama sampai?",
        jawab:
          "Dikirim dari Bandung. Estimasi 1–3 hari kerja untuk Pulau Jawa, dan 3–7 hari kerja untuk luar Jawa, tergantung kurir dan alamat tujuan.",
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
          "Rekam video saat membuka paket, lalu kirimkan ke WhatsApp kami dalam 2×24 jam sejak paket diterima. Barang akan kami ganti tanpa biaya tambahan.",
      },
      {
        tanya: "Bisa retur kalau berubah pikiran?",
        jawab:
          "Selama segelnya belum dibuka dan belum lewat 3 hari sejak diterima, bisa. Ongkos kirim baliknya ditanggung pembeli.",
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <section className="mx-auto w-full max-w-3xl px-6 pt-32 pb-24">
      <p className="font-mono text-[11px] tracking-[0.28em] text-accent-600 uppercase">
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
          <h2 className="font-mono text-[11px] tracking-[0.28em] text-brand-600 uppercase">
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

      <div className="mt-16 border border-brand-200 bg-brand-50 px-8 py-10">
        <p className="font-mono text-[11px] tracking-[0.28em] text-brand-700 uppercase">
          Masih bingung?
        </p>
        <p className="mt-4 max-w-md leading-relaxed text-ink">
          Ceritakan masalah di rumahmu, kami bantu pilihkan produk yang cocok.
        </p>
        <a
          href="https://wa.me/6281234567890"
          className="mt-8 inline-block border border-ink px-8 py-3.5 font-mono text-[11px] tracking-[0.22em] text-ink uppercase transition-colors hover:bg-ink hover:text-white"
        >
          Chat WhatsApp
        </a>
      </div>
    </section>
  );
}
