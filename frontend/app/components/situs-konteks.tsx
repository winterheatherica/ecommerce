"use client";

import { createContext, useContext, type ComponentProps, type ReactNode } from "react";

import type { SitusKlien } from "@/app/lib/situs";

const Konteks = createContext<SitusKlien | null>(null);

export function SitusProvider({ situs, children }: { situs: SitusKlien; children: ReactNode }) {
  return <Konteks.Provider value={situs}>{children}</Konteks.Provider>;
}

export function useSitus(): SitusKlien {
  const isi = useContext(Konteks);
  if (!isi) throw new Error("useSitus harus dipakai di dalam SitusProvider");
  return isi;
}

export function LinkWa(props: Omit<ComponentProps<"a">, "href">) {
  const { toko } = useSitus();
  return <a href={toko.waUrl} {...props} />;
}
