import Link from "next/link";

import OrderLookup from "@/app/components/order-lookup";

export default function PesananTidakDitemukan() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 pt-32 pb-24">
      <p className="text-[15px] font-semibold text-oranye-600">404</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">Halaman tidak ditemukan</h1>
      <p role="alert" className="mt-4 max-w-lg text-[17px] leading-relaxed font-semibold text-red-700">
        Nomor pesanan tidak ditemukan, silakan periksa lagi nomor pesanannya.
      </p>
      <p className="mt-2 max-w-lg leading-relaxed text-stone-600">
        Nomornya ada di email konfirmasi pesanan, contohnya{" "}
        <span className="font-mono whitespace-nowrap text-ink">MNK-482917365520</span>.
      </p>

      <OrderLookup />

      <Link href="/produk" className="tombol-garis mt-10">
        Lihat produk
      </Link>
    </div>
  );
}
