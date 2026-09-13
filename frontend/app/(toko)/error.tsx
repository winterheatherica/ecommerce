"use client";

import { useEffect } from "react";

export default function TokoError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto w-full max-w-3xl px-6 pt-32 pb-24">
      <p className="font-mono text-[11px] tracking-[0.28em] text-brand-600 uppercase">
        Ada yang bermasalah
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
        Halaman ini gagal dimuat
      </h1>
      <p className="mt-4 max-w-lg leading-relaxed text-stone-600">
        Data produk sedang tidak bisa diambil. Coba muat ulang sebentar lagi, atau
        hubungi kami lewat WhatsApp kalau terus berulang.
      </p>

      <div className="mt-8 flex flex-wrap gap-4">
        <button type="button" onClick={reset} className="inline-block border border-ink px-8 py-3.5 font-mono text-[11px] tracking-[0.22em] text-ink uppercase transition-colors hover:bg-ink hover:text-white">
          Coba lagi
        </button>
        <a href="/" className="inline-block border border-ink px-8 py-3.5 font-mono text-[11px] tracking-[0.22em] text-ink uppercase transition-colors hover:bg-ink hover:text-white">
          Ke beranda
        </a>
      </div>

      {error.digest && (
        <p className="mt-10 font-mono text-[10px] tracking-[0.18em] text-stone-400 uppercase">
          Kode: {error.digest}
        </p>
      )}
    </div>
  );
}
