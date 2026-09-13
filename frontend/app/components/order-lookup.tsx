"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function OrderLookup() {
  const router = useRouter();
  const [nomor, setNomor] = useState("");

  const cari = (e: React.FormEvent) => {
    e.preventDefault();
    const bersih = nomor.trim().toUpperCase();
    if (!bersih) return;
    router.push(`/order/${encodeURIComponent(bersih)}`);
  };

  return (
    <form onSubmit={cari} className="mt-10 flex flex-wrap gap-3">
      <input
        value={nomor}
        onChange={(e) => setNomor(e.target.value)}
        placeholder="MNK-XXXXXXXX"
        aria-label="Nomor pesanan"
        className="flex-1 border border-ink/15 px-4 py-3.5 font-mono text-sm tracking-[0.1em] text-ink uppercase outline-none transition-colors placeholder:font-sans placeholder:tracking-normal placeholder:normal-case placeholder:text-stone-400 focus:border-brand-500 sm:flex-none sm:w-72"
      />
      <button
        type="submit"
        disabled={!nomor.trim()}
        className="border border-brand-500 bg-brand-500 px-8 py-3.5 font-mono text-[11px] tracking-[0.22em] text-white uppercase transition-colors hover:border-brand-600 hover:bg-brand-600 disabled:cursor-not-allowed disabled:border-stone-300 disabled:bg-stone-300"
      >
        Lacak
      </button>
    </form>
  );
}
