"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function OrderLookup() {
  const router = useRouter();
  const [nomor, setNomor] = useState("");

  const cari = (e: React.FormEvent) => {
    e.preventDefault();
    const bersih = nomor.replace(/\s+/g, "").toUpperCase();
    if (!bersih) return;

    const lengkap = /^\d{12}$/.test(bersih) ? `MNK-${bersih}` : bersih;
    router.push(`/order/${encodeURIComponent(lengkap)}`);
  };

  return (
    <form onSubmit={cari} className="mt-10 flex flex-wrap gap-3">
      <input
        value={nomor}
        onChange={(e) => setNomor(e.target.value)}
        placeholder="MNK-123456789012"
        aria-label="Nomor pesanan"
        className="min-h-11 flex-1 rounded-full border-2 border-ink/15 px-5 py-2.5 font-mono text-[16px] tracking-[0.06em] text-ink uppercase outline-none transition-colors placeholder:font-sans placeholder:tracking-normal placeholder:normal-case placeholder:text-stone-400 focus:border-brand-500 sm:w-72 sm:flex-none"
      />
      <button
        type="submit"
        disabled={!nomor.trim()}
        className="tombol"
      >
        Lacak
      </button>
    </form>
  );
}
