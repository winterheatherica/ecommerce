import Link from "next/link";

import SiteHeader from "@/app/components/site-header";
import SiteFooter from "@/app/components/site-footer";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-3xl px-6 pt-32 pb-24">
          <p className="font-mono text-[11px] tracking-[0.28em] text-accent-600 uppercase">
            404
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Halaman tidak ditemukan
          </h1>
          <p className="mt-4 max-w-lg leading-relaxed text-stone-600">
            Alamatnya mungkin salah ketik, atau produknya sudah tidak dijual
            lagi.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/produk"
              className="inline-block border border-ink px-8 py-3.5 font-mono text-[11px] tracking-[0.22em] text-ink uppercase transition-colors hover:bg-ink hover:text-white"
            >
              Lihat produk
            </Link>
            <Link
              href="/order"
              className="inline-block border border-ink px-8 py-3.5 font-mono text-[11px] tracking-[0.22em] text-ink uppercase transition-colors hover:bg-ink hover:text-white"
            >
              Lacak pesanan
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
