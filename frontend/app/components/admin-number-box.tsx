"use client";

import { useState } from "react";

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
  const [draf, setDraf] = useState(String(nilai));
  const [fokus, setFokus] = useState(false);

  const simpan = () => {
    setFokus(false);

    const bersih = draf.trim();
    const angka = Number(bersih);

    if (!bersih || !Number.isInteger(angka) || angka < min) {
      setDraf(String(nilai));
      return;
    }

    if (angka !== nilai) onSimpan(angka);
  };

  return (
    <input
      type="number"
      min={min}
      inputMode="numeric"
      value={fokus ? draf : String(nilai)}
      aria-label={label}
      disabled={mati}
      onFocus={() => {
        setDraf(String(nilai));
        setFokus(true);
      }}
      onChange={(e) => setDraf(e.target.value)}
      onBlur={simpan}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") {
          setDraf(String(nilai));
          e.currentTarget.blur();
        }
      }}
      className={`border px-2 py-1.5 text-right font-mono text-sm outline-none transition-colors focus:border-brand-500 disabled:cursor-not-allowed ${kelas}`}
    />
  );
}
