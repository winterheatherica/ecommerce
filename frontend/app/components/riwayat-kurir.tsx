"use client";

import { useState } from "react";

import type { BarisRiwayat } from "@/app/lib/lacak";

type Props = {
  baris: BarisRiwayat[];
  awal?: number;
};

export default function RiwayatKurir({ baris, awal = 3 }: Props) {
  const [semua, setSemua] = useState(false);

  if (baris.length === 0) return null;

  const tampil = semua ? baris : baris.slice(0, awal);
  const sisa = baris.length - tampil.length;

  return (
    <div className="mt-4">
      {tampil.length > 0 && (
        <ol>
          {tampil.map((b, i) => (
            <li key={`${i}-${b.waktu}`} className="relative pb-3 pl-5 last:pb-0">
              {i < tampil.length - 1 && (
                <span
                  aria-hidden="true"
                  className="absolute top-[13px] -bottom-1 left-1 w-px bg-ink/10"
                />
              )}
              <span
                aria-hidden="true"
                className={`absolute top-1 left-0 h-[9px] w-[9px] rounded-full ${
                  i === 0 ? "bg-brand-500" : "bg-ink/20"
                }`}
              />
              {b.waktu && <p className="font-mono text-[12px] text-stone-500">{b.waktu}</p>}
              <p
                className={`text-sm leading-relaxed break-words ${
                  i === 0 ? "text-ink" : "text-stone-600"
                }`}
              >
                {b.keterangan}
              </p>
            </li>
          ))}
        </ol>
      )}

      {baris.length > awal && (
        <button
          type="button"
          onClick={() => setSemua(!semua)}
          aria-expanded={semua}
          className={`border-b border-stone-400 pb-0.5 text-sm text-ink transition-colors hover:border-brand-600 hover:text-brand-600 ${
            tampil.length > 0 ? "mt-3" : ""
          }`}
        >
          {semua
            ? "Sembunyikan riwayat"
            : awal === 0
              ? `Lihat riwayat perjalanan (${baris.length})`
              : `Lihat ${sisa} riwayat lainnya`}
        </button>
      )}
    </div>
  );
}
