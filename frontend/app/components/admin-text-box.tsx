"use client";

import { useSuntingDiTempat } from "@/app/lib/sunting-di-tempat";

type Props = {
  nilai: string;
  label: string;
  kelas: string;
  mati?: boolean;
  onSimpan: (teks: string) => void;
};

export default function AdminTextBox({ nilai, label, kelas, mati, onSimpan }: Props) {
  const sunting = useSuntingDiTempat(
    nilai,
    (v) => v,
    (teks) => teks.trim() || null,
    onSimpan,
  );

  return (
    <input
      aria-label={label}
      disabled={mati}
      {...sunting}
      className={`border bg-white px-2 py-1.5 text-sm text-ink outline-none transition-colors focus:border-brand-500 disabled:bg-stone-100 ${kelas}`}
    />
  );
}
