import Link from "next/link";
export default function TokoNotFound() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 pt-32 pb-24">
      <p className="text-[15px] text-oranye-600 font-semibold">
        404
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
        Halaman tidak ditemukan
      </h1>
      <p className="mt-4 max-w-lg leading-relaxed text-stone-600">
        Alamatnya mungkin salah ketik, atau produknya sudah tidak dijual lagi.
      </p>

      <div className="mt-8 flex flex-wrap gap-4">
        <Link href="/produk" className="tombol">
          Lihat produk
        </Link>
        <Link href="/order" className="tombol-garis">
          Lacak pesanan
        </Link>
      </div>
    </div>
  );
}
