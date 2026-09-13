"use client";

import { useEffect } from "react";

export default function AdminError({
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
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">
        Gagal memuat data
      </h1>
      <p className="mt-3 leading-relaxed text-stone-600">
        API tidak merespons. Pastikan backend sedang jalan, lalu coba lagi.
      </p>
      <pre className="mt-6 overflow-x-auto border border-ink/10 bg-white p-4 font-mono text-xs text-stone-600">
        {error.message}
      </pre>
      <button
        type="button"
        onClick={reset}
        className="mt-6 border border-ink bg-ink px-6 py-2.5 font-mono text-[11px] tracking-[0.18em] text-white uppercase transition-colors hover:border-brand-600 hover:bg-brand-600"
      >
        Coba lagi
      </button>
    </div>
  );
}
