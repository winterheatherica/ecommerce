"use client";

import { useState } from "react";

export default function CopyButton({
  nilai,
  label,
}: {
  nilai: string;
  label: string;
}) {
  const [keadaan, setKeadaan] = useState<"diam" | "sukses" | "gagal">("diam");

  const salin = async () => {
    try {
      await navigator.clipboard.writeText(nilai);
      setKeadaan("sukses");
    } catch {
      setKeadaan("gagal");
    }

    window.setTimeout(() => setKeadaan("diam"), 2000);
  };

  return (
    <button
      type="button"
      onClick={salin}
      aria-label={`Salin ${label}`}
      className={`shrink-0 border px-2 py-1 font-mono text-[10px] tracking-[0.14em] uppercase transition-colors ${
        keadaan === "sukses"
          ? "border-emerald-600 text-emerald-700"
          : keadaan === "gagal"
            ? "border-red-400 text-red-600"
            : "border-ink/15 text-stone-500 hover:border-brand-500 hover:text-brand-600"
      }`}
    >
      {keadaan === "sukses"
        ? "Tersalin"
        : keadaan === "gagal"
          ? "Gagal"
          : "Salin"}
    </button>
  );
}
