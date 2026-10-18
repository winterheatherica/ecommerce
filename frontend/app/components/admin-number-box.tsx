"use client";

import { useSuntingDiTempat } from "@/app/lib/sunting-di-tempat";

type Props = {
  nilai: number | null;
  min: number;
  label: string;
  kelas: string;
  mati?: boolean;
  placeholder?: string;
  onSimpan: (angka: number) => void;
};

export default function AdminNumberBox({
  nilai,
  min,
  label,
  kelas,
  mati,
  placeholder,
  onSimpan,
}: Props) {
  const sunting = useSuntingDiTempat<number | null>(
    nilai,
    (v) => (v === null ? "" : String(v)),
    (teks) => {
      const bersih = teks.trim();
      const angka = Number(bersih);
      return bersih && Number.isInteger(angka) && angka >= min ? angka : null;
    },
    (angka) => {
      if (angka !== null) onSimpan(angka);
    },
  );

  return (
    <input
      type="number"
      min={min}
      inputMode="numeric"
      aria-label={label}
      placeholder={placeholder}
      disabled={mati}
      {...sunting}
      className={`border px-2 py-1.5 text-right font-mono text-sm outline-none transition-colors focus:border-brand-500 disabled:cursor-not-allowed ${kelas}`}
    />
  );
}
