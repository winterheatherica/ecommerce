"use client";

import type { DimensiPaket } from "@/app/data/produk";
import { useSuntingDiTempat } from "@/app/lib/sunting-di-tempat";

const POLA = /^\s*(\d{1,3})\s*[x×*]\s*(\d{1,3})\s*[x×*]\s*(\d{1,3})\s*(cm)?\s*$/i;
const MAKS_CM = 300;

function keTeks(d: DimensiPaket | null): string {
  return d ? `${d.p}x${d.l}x${d.t}` : "";
}

function baca(teks: string): DimensiPaket | null {
  const cocok = POLA.exec(teks);
  if (!cocok) return null;

  const [p, l, t] = [cocok[1], cocok[2], cocok[3]].map(Number);
  const sah = [p, l, t].every((n) => n >= 1 && n <= MAKS_CM);
  return sah ? { p, l, t } : null;
}

type Props = {
  nilai: DimensiPaket | null;
  label: string;
  kelas: string;
  mati?: boolean;
  onSimpan: (dimensi: DimensiPaket) => void;
};

export default function AdminDimensionBox({ nilai, label, kelas, mati, onSimpan }: Props) {
  const sunting = useSuntingDiTempat(
    keTeks(nilai),
    (v) => v,
    (teks) => {
      const d = baca(teks);
      return d ? keTeks(d) : null;
    },
    (teks) => {
      const d = baca(teks);
      if (d) onSimpan(d);
    },
  );

  return (
    <input
      aria-label={label}
      placeholder="18x8x6"
      title="Panjang x lebar x tinggi dalam cm, misalnya 18x8x6"
      disabled={mati}
      {...sunting}
      className={`border bg-white px-2 py-1.5 text-right font-mono text-sm text-ink outline-none transition-colors focus:border-brand-500 disabled:bg-stone-100 ${kelas}`}
    />
  );
}
