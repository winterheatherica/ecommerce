import type { Metadata } from "next";

import { KONTAK, WA_URL } from "@/app/data/kontak";
import { metaHalaman } from "@/app/lib/seo";

export const metadata: Metadata = metaHalaman({
  judul: "Kebijakan Privasi",
  ringkasan:
    "Data apa saja yang Menik Store kumpulkan saat kamu berbelanja, untuk apa dipakai, siapa saja yang menerimanya, dan berapa lama disimpan.",
  path: "/privasi",
});

const bagian = [
  {
    judul: "Data yang kami kumpulkan",
    isi: [
      "Saat kamu menyelesaikan pemesanan, kami menyimpan nama penerima, nomor HP, alamat email, alamat pengiriman lengkap, kecamatan tujuan, dan catatan yang kamu tulis sendiri di formulir.",
      "Kami juga menyimpan isi pesanan, berat paket, kurir dan layanan yang kamu pilih, ongkos kirim, total pembayaran, status pesanan, serta nomor resi setelah paket dikirim.",
      "Kami tidak meminta tanggal lahir, nomor identitas, maupun data yang tidak diperlukan untuk mengirim paket.",
    ],
  },
  {
    judul: "Kami tidak menyimpan data pembayaranmu",
    isi: [
      "Nomor kartu, PIN, OTP, dan kredensial rekening tidak pernah melewati situs ini. Seluruh proses pembayaran ditangani Tripay di halaman mereka sendiri.",
      "Yang kami terima kembali dari Tripay hanya nomor rujukan transaksi, metode pembayaran yang kamu pakai, dan konfirmasi lunas atau belum.",
    ],
  },
  {
    judul: "Tidak ada akun, tidak ada kata sandi",
    isi: [
      "Belanja di sini tidak memerlukan pendaftaran. Karena tidak ada akun, kami tidak menyimpan kata sandi siapa pun.",
      "Keranjang belanjamu disimpan di browser sendiri lewat localStorage dengan kunci menik-keranjang-v1, bukan di server kami. Isinya cuma kode produk dan jumlahnya, dan akan hilang kalau kamu membersihkan data browser.",
    ],
  },
  {
    judul: "Siapa saja yang menerima datamu",
    isi: [
      "Tripay menerima nama, email, dan nomor HP untuk menerbitkan tagihan dan mengirimkan instruksi pembayaran kepadamu.",
      "RajaOngkir menerima kecamatan tujuan dan berat paket untuk menghitung ongkos kirim. Nama dan alamat lengkapmu tidak dikirimkan ke sana.",
      "Kurir yang kamu pilih menerima nama, nomor HP, dan alamat pengiriman, karena tanpa itu paket tidak bisa diantar.",
      "Selain ketiganya, kami tidak membagikan, menjual, atau menyewakan datamu kepada siapa pun.",
    ],
  },
  {
    judul: "Pelacakan dan iklan",
    isi: [
      "Situs ini tidak memasang Google Analytics, piksel Facebook, maupun alat pelacak pihak ketiga lainnya. Karena itu juga tidak ada banner persetujuan cookie, sebab memang tidak ada cookie iklan yang dipasang.",
      "Kami tidak membuat profil perilaku dan tidak menargetkan iklan berdasarkan kunjunganmu.",
    ],
  },
  {
    judul: "Berapa lama disimpan",
    isi: [
      "Data pesanan disimpan selama diperlukan untuk melayani pengiriman, menangani keluhan, dan memenuhi kewajiban pembukuan.",
      "Pesanan yang tidak dibayar sampai batas waktunya otomatis dibatalkan dan stoknya dikembalikan, tetapi catatan pesanannya tetap tersimpan sebagai riwayat.",
    ],
  },
  {
    judul: "Keamanan",
    isi: [
      "Seluruh halaman disajikan lewat HTTPS. Database kami tidak terbuka ke internet dan hanya bisa diakses oleh layanan kami sendiri.",
      "Halaman pengelola toko dilindungi kata sandi dan tidak diindeks mesin pencari.",
    ],
  },
  {
    judul: "Hakmu atas datamu",
    isi: [
      "Kamu berhak meminta salinan data pesananmu, meminta perbaikan kalau ada yang keliru, atau meminta penghapusan data yang sudah tidak diperlukan untuk pengiriman maupun pembukuan.",
      "Kirim permintaannya lewat WhatsApp dengan menyebutkan nomor pesanan, supaya kami bisa memastikan itu memang kamu.",
    ],
  },
];

export default function PrivasiPage() {
  return (
    <section className="mx-auto w-full max-w-3xl px-6 pt-32 pb-24">
      <p className="font-mono text-[11px] tracking-[0.28em] text-accent-600 uppercase">
        Kebijakan
      </p>
      <h1 className="mt-3 text-3xl leading-tight font-semibold tracking-tight text-ink sm:text-4xl">
        Kebijakan Privasi
      </h1>
      <p className="mt-4 max-w-xl leading-relaxed text-stone-600">
        Halaman ini menjelaskan apa yang benar-benar terjadi pada datamu saat
        berbelanja di Menik Store. Ditulis sependek mungkin, tanpa kalimat yang
        tidak kami jalankan.
      </p>

      {bagian.map((b) => (
        <div key={b.judul} className="mt-12 border-t border-ink/10 pt-8">
          <h2 className="text-lg font-semibold tracking-tight text-ink">
            {b.judul}
          </h2>
          {b.isi.map((p) => (
            <p key={p} className="mt-3 leading-relaxed text-stone-600">
              {p}
            </p>
          ))}
        </div>
      ))}

      <div className="mt-12 border border-brand-200 bg-brand-50 px-8 py-8">
        <h2 className="text-lg font-semibold tracking-tight text-ink">
          Menghubungi kami
        </h2>
        <p className="mt-3 leading-relaxed text-ink">
          Pertanyaan soal data pribadi bisa disampaikan lewat WhatsApp{" "}
          <a
            href={WA_URL}
            className="border-b border-ink/30 transition-colors hover:border-brand-600 hover:text-brand-600"
          >
            {KONTAK.waTampil}
          </a>
          , atau datang langsung ke alamat kami.
        </p>
        <p className="mt-3 leading-relaxed text-stone-600">
          {KONTAK.alamatSatuBaris}
        </p>
      </div>
    </section>
  );
}
