"use client";

import Link from "next/link";
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
      <p className="text-[15px] text-brand-600 font-semibold">
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
        <button type="button" onClick={reset} className="tombol">
          Coba lagi
        </button>
        <Link href="/" className="tombol-garis">
          Ke beranda
        </Link>
      </div>

      {error.digest && (
        <p className="mt-10 text-[14px] text-stone-400 font-semibold">
          Kode: {error.digest}
        </p>
      )}
    </div>
  );
}
