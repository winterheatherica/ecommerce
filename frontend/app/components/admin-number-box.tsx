"use client";

import { useSuntingDiTempat } from "@/app/lib/sunting-di-tempat";

type Props = {
  nilai: number;
  min: number;
  label: string;
  kelas: string;
  mati?: boolean;
  onSimpan: (angka: number) => void;
};

export default function AdminNumberBox({
  nilai,
  min,
  label,
  kelas,
  mati,
  onSimpan,
}: Props) {
  const sunting = useSuntingDiTempat(
    nilai,
    String,
    (teks) => {
      const bersih = teks.trim();
      const angka = Number(bersih);
      return bersih && Number.isInteger(angka) && angka >= min ? angka : null;
    },
    onSimpan,
  );

  return (
    <input
      type="number"
      min={min}
      inputMode="numeric"
      aria-label={label}
      disabled={mati}
      {...sunting}
      className={`border px-2 py-1.5 text-right font-mono text-sm outline-none transition-colors focus:border-brand-500 disabled:cursor-not-allowed ${kelas}`}
    />
  );
}
