"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

import type { Foto } from "@/app/data/produk";

type Pilihan = {
  foto: Foto[];
  ukuran: string | null;
  pilihUkuran: (slug: string) => void;
  indeksFoto: number;
  setIndeksFoto: (i: number) => void;
};

const Konteks = createContext<Pilihan | null>(null);

export function PilihanUkuran({
  foto,
  awal,
  children,
}: {
  foto: Foto[];
  awal: string | null;
  children: ReactNode;
}) {
  const [ukuran, setUkuran] = useState(awal);
  const [indeksFoto, setIndeksFoto] = useState(0);

  const pilihUkuran = (slug: string) => {
    setUkuran(slug);
    const i = foto.findIndex((f) => f.varianSlug === slug);
    if (i >= 0) setIndeksFoto(i);
  };

  return (
    <Konteks.Provider value={{ foto, ukuran, pilihUkuran, indeksFoto, setIndeksFoto }}>
      {children}
    </Konteks.Provider>
  );
}

export function usePilihanUkuran(): Pilihan {
  const isi = useContext(Konteks);
  if (!isi) throw new Error("usePilihanUkuran harus dipakai di dalam PilihanUkuran");
  return isi;
}
