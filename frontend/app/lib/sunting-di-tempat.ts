"use client";

import { useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";

export function useSuntingDiTempat<T>(
  nilai: T,
  keTeks: (v: T) => string,
  dariTeks: (teks: string) => T | null,
  onSimpan: (v: T) => void,
) {
  const [draf, setDraf] = useState(() => keTeks(nilai));
  const [fokus, setFokus] = useState(false);
  const batal = useRef(false);

  return {
    value: fokus ? draf : keTeks(nilai),
    onFocus: () => {
      setDraf(keTeks(nilai));
      setFokus(true);
    },
    onChange: (e: ChangeEvent<HTMLInputElement>) => setDraf(e.target.value),
    onBlur: () => {
      setFokus(false);

      if (batal.current) {
        batal.current = false;
        return;
      }

      const hasil = dariTeks(draf);
      if (hasil !== null && hasil !== nilai) onSimpan(hasil);
    },
    onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") e.currentTarget.blur();
      if (e.key === "Escape") {
        batal.current = true;
        e.currentTarget.blur();
      }
    },
  };
}
