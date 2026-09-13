export default function TokoNotFound() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 pt-32 pb-24">
      <p className="font-mono text-[11px] tracking-[0.28em] text-accent-600 uppercase">
        404
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
        Halaman tidak ditemukan
      </h1>
      <p className="mt-4 max-w-lg leading-relaxed text-stone-600">
        Alamatnya mungkin salah ketik, atau produknya sudah tidak dijual lagi.
      </p>

      <div className="mt-8 flex flex-wrap gap-4">
        <a href="/produk" className="inline-block border border-ink px-8 py-3.5 font-mono text-[11px] tracking-[0.22em] text-ink uppercase transition-colors hover:bg-ink hover:text-white">
          Lihat produk
        </a>
        <a href="/order" className="inline-block border border-ink px-8 py-3.5 font-mono text-[11px] tracking-[0.22em] text-ink uppercase transition-colors hover:bg-ink hover:text-white">
          Lacak pesanan
        </a>
      </div>
    </div>
  );
}
