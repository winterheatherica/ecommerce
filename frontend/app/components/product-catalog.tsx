"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import ProductCard from "./product-card";
import {
  daftarProduk,
  kategoriJudul,
  kategoriLabel,
  type Kategori,
} from "../data/produk";

type Props = {
  kategori: string;
  urut: string;
};

const semuaKategori = Object.keys(kategoriLabel) as Kategori[];

const opsiUrut = [
  { nilai: "populer", label: "Paling dicari" },
  { nilai: "termurah", label: "Harga terendah" },
  { nilai: "termahal", label: "Harga tertinggi" },
];

export default function ProductCatalog({ kategori, urut }: Props) {
  const router = useRouter();
  const [cari, setCari] = useState("");

  const perbarui = (kunci: "kategori" | "urut", nilai: string) => {
    const berikut = { kategori, urut, [kunci]: nilai };
    const next = new URLSearchParams();

    if (berikut.kategori) next.set("kategori", berikut.kategori);
    if (berikut.urut && berikut.urut !== "populer") next.set("urut", berikut.urut);

    const query = next.toString();
    router.replace(query ? `/produk?${query}` : "/produk", { scroll: false });
  };

  const reset = () => {
    setCari("");
    router.replace("/produk", { scroll: false });
  };

  const hasil = useMemo(() => {
    const kata = cari.trim().toLowerCase();

    const disaring = daftarProduk.filter((p) => {
      const cocokKategori = !kategori || p.kategori === kategori;
      const cocokKata = !kata || p.nama.toLowerCase().includes(kata);
      return cocokKategori && cocokKata;
    });

    if (urut === "termurah") return [...disaring].sort((a, b) => a.harga - b.harga);
    if (urut === "termahal") return [...disaring].sort((a, b) => b.harga - a.harga);
    return [...disaring].sort((a, b) => b.terjualPerBulan - a.terjualPerBulan);
  }, [cari, kategori, urut]);

  const adaSaringan = Boolean(kategori) || cari.trim() !== "";

  return (
    <section className="mx-auto w-full max-w-6xl px-6 pt-32 pb-24">
      <p className="font-mono text-[11px] tracking-[0.28em] text-accent-600 uppercase">
        Katalog
      </p>
      <h1 className="mt-3 text-3xl leading-tight font-semibold tracking-tight text-ink sm:text-4xl">
        {kategori && kategori in kategoriJudul
          ? kategoriJudul[kategori as Kategori]
          : "Semua produk"}
      </h1>

      <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          value={cari}
          onChange={(e) => setCari(e.target.value)}
          placeholder="Cari produk..."
          aria-label="Cari produk"
          className="w-full border border-ink/15 px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-stone-400 focus:border-brand-500 sm:max-w-xs"
        />

        <label className="flex items-center gap-3 font-mono text-[11px] tracking-[0.2em] text-stone-500 uppercase">
          Urutkan
          <span className="relative">
            <select
              value={urut}
              onChange={(e) => perbarui("urut", e.target.value)}
              className="appearance-none border border-ink/15 py-2.5 pr-11 pl-4 font-sans text-sm tracking-normal text-ink normal-case outline-none transition-colors hover:border-brand-400 focus:border-brand-500"
            >
              {opsiUrut.map((o) => (
                <option key={o.nilai} value={o.nilai}>
                  {o.label}
                </option>
              ))}
            </select>
            <svg
              className="pointer-events-none absolute top-1/2 right-4 h-3.5 w-3.5 -translate-y-1/2 text-stone-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.75}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
            </svg>
          </span>
        </label>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => perbarui("kategori", "")}
          className={`border px-4 py-2 font-mono text-[11px] tracking-[0.18em] uppercase transition-colors ${
            kategori === ""
              ? "border-brand-500 bg-brand-500 text-white"
              : "border-ink/15 text-stone-600 hover:border-brand-400 hover:bg-brand-50 hover:text-brand-600"
          }`}
        >
          Semua
        </button>

        {semuaKategori.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => perbarui("kategori", k)}
            className={`border px-4 py-2 font-mono text-[11px] tracking-[0.18em] uppercase transition-colors ${
              kategori === k
                ? "border-ink bg-ink text-white"
                : "border-ink/15 text-stone-600 hover:border-brand-500 hover:text-brand-600"
            }`}
          >
            {kategoriLabel[k]}
          </button>
        ))}
      </div>

      <p className="mt-8 font-mono text-[11px] tracking-[0.18em] text-stone-500 uppercase">
        <span className="text-brand-600">{hasil.length}</span> produk
        {kategori ? ` · ${kategoriLabel[kategori as Kategori]}` : ""}
      </p>

      {hasil.length > 0 ? (
        <div className="mt-8 grid grid-cols-2 gap-6 lg:grid-cols-3">
          {hasil.map((p) => (
            <ProductCard key={p.slug} produk={p} />
          ))}
        </div>
      ) : (
        <div className="mt-8 border border-ink/12 px-6 py-20 text-center">
          <p className="text-ink">Tidak ada produk yang cocok.</p>
          <p className="mt-2 text-sm text-stone-500">
            Coba kata kunci lain, atau hapus saringannya.
          </p>
          {adaSaringan && (
            <button
              type="button"
              onClick={reset}
              className="mt-8 border border-ink px-8 py-3 font-mono text-[11px] tracking-[0.22em] text-ink uppercase transition-colors hover:bg-ink hover:text-white"
            >
              Hapus saringan
            </button>
          )}
        </div>
      )}
    </section>
  );
}
