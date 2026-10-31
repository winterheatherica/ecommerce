"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import KolomPilih from "./kolom-pilih";
import ProductCard from "./product-card";
import { useSitus } from "./situs-konteks";
import type { Produk } from "../data/produk";
import { cariGrup, cariKategori, grupDariKategori, kategoriDalamGrup } from "../lib/situs";

type Props = {
  produk: Produk[];
  kategori: string;
  grup: string;
  urut: string;
};

const opsiUrut = [
  { nilai: "populer", label: "Paling dicari" },
  { nilai: "termurah", label: "Harga terendah" },
  { nilai: "termahal", label: "Harga tertinggi" },
];

export default function ProductCatalog({
  produk,
  kategori: kategoriMentah,
  grup: grupMentah,
  urut: urutMentah,
}: Props) {
  const router = useRouter();
  const [cari, setCari] = useState("");

  const situs = useSitus();
  const infoKategori = cariKategori(situs, kategoriMentah);
  const infoGrup = cariGrup(situs, infoKategori ? infoKategori.grup : grupMentah);
  const kategori = infoKategori?.slug ?? "";
  const grup = infoGrup?.slug ?? "";
  const urut = opsiUrut.some((o) => o.nilai === urutMentah)
    ? urutMentah
    : "populer";

  const pergi = (k: string, g: string, u: string) => {
    const next = new URLSearchParams();

    if (k) next.set("kategori", k);
    else if (g) next.set("grup", g);
    if (u && u !== "populer") next.set("urut", u);

    const query = next.toString();
    router.replace(query ? `/produk?${query}` : "/produk", { scroll: false });
  };

  const pilihGrup = (g: string) => pergi("", g, urut);
  const pilihKategori = (k: string) => pergi(k, grup, urut);
  const pilihUrut = (u: string) => pergi(kategori, grup, u);

  const reset = () => {
    setCari("");
    router.replace("/produk", { scroll: false });
  };

  const hasil = useMemo(() => {
    const kata = cari.trim().toLowerCase();

    const disaring = produk.filter((p) => {
      const cocokKategori = kategori
        ? p.kategori === kategori
        : !grup || grupDariKategori(situs, p.kategori) === grup;
      const cocokKata = !kata || p.nama.toLowerCase().includes(kata);
      return cocokKategori && cocokKata;
    });

    if (urut === "termurah") return [...disaring].sort((a, b) => a.harga - b.harga);
    if (urut === "termahal") return [...disaring].sort((a, b) => b.harga - a.harga);
    return [...disaring].sort((a, b) => b.terjualPerBulan - a.terjualPerBulan);
  }, [produk, cari, kategori, grup, urut, situs]);

  const adaSaringan = Boolean(kategori || grup) || cari.trim() !== "";

  const jumlahGrup = (g: string) =>
    produk.filter((p) => grupDariKategori(situs, p.kategori) === g).length;

  return (
    <section className="mx-auto w-full max-w-6xl px-6 pt-32 pb-24">
      <p className="text-[15px] text-oranye-600 font-semibold">
        Katalog
      </p>
      <h1 className="mt-3 text-3xl leading-tight font-semibold tracking-tight text-ink sm:text-4xl">
        {infoKategori ? infoKategori.judul : infoGrup ? infoGrup.judul : "Semua produk"}
      </h1>

      {infoGrup && !infoKategori && (
        <p className="mt-4 max-w-xl leading-relaxed text-stone-600">
          {infoGrup.ringkasan}
        </p>
      )}

      <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          value={cari}
          onChange={(e) => setCari(e.target.value)}
          placeholder="Cari produk..."
          aria-label="Cari produk"
          className="min-h-11 w-full rounded-full border-2 border-ink/15 px-5 py-2.5 text-[15px] text-ink outline-none transition-colors placeholder:text-stone-400 focus:border-brand-500 sm:max-w-xs"
        />

        <div className="flex items-center gap-3 text-[15px] font-semibold text-stone-600">
          <span id="label-urutkan">Urutkan</span>
          <KolomPilih
            labelId="label-urutkan"
            nilai={urut}
            opsi={opsiUrut}
            ubah={pilihUrut}
            className="min-h-11 rounded-full border-2 border-ink/15 bg-white py-2 pr-4 pl-5 text-[15px] font-bold text-ink outline-none transition-colors hover:border-brand-400 focus:border-brand-500"
          />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => pilihGrup("")}
          className={`chip ${grup === "" ? "chip-aktif" : ""}`}
        >
          Semua
        </button>

        {situs.grup.filter((g) => jumlahGrup(g.slug) > 0).map((g) => (
          <button
            key={g.slug}
            type="button"
            onClick={() => pilihGrup(g.slug)}
            className={`chip ${grup === g.slug ? "chip-aktif" : ""}`}
          >
            {g.label}
          </button>
        ))}
      </div>

      {grup && (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-ink/10 pt-4">
          <button
            type="button"
            onClick={() => pilihKategori("")}
            className={`inline-flex min-h-11 items-center rounded-full border-2 px-4 py-1.5 text-sm font-bold transition-colors sm:min-h-10 ${
              kategori === "" ? "border-ink bg-ink text-white" : "border-ink/15 bg-white text-ink hover:border-ink"
            }`}
          >
            Semua {infoGrup?.label}
          </button>

          {kategoriDalamGrup(situs, grup)
            .filter(
              (k) => produk.some((p) => p.kategori === k.slug) || kategori === k.slug,
            )
            .map((k) => (
              <button
                key={k.slug}
                type="button"
                onClick={() => pilihKategori(k.slug)}
                className={`inline-flex min-h-11 items-center rounded-full border-2 px-4 py-1.5 text-sm font-bold transition-colors sm:min-h-10 ${
                  kategori === k.slug ? "border-ink bg-ink text-white" : "border-ink/15 bg-white text-ink hover:border-ink"
                }`}
              >
                {k.label}
              </button>
            ))}
        </div>
      )}

      <p className="mt-8 text-[15px] font-semibold text-stone-600">
        <span className="font-bold text-brand-600">{hasil.length}</span> produk
        {infoKategori ? ` · ${infoKategori.label}` : infoGrup ? ` · ${infoGrup.label}` : ""}
      </p>

      {hasil.length > 0 ? (
        <div className="mt-8 grid grid-cols-2 gap-6 lg:grid-cols-3">
          {hasil.map((p) => (
            <ProductCard key={p.slug} produk={p} />
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-ink/12 px-6 py-20 text-center">
          <p className="text-ink">Tidak ada produk yang cocok.</p>
          <p className="mt-2 text-sm text-stone-500">
            Coba kata kunci lain, atau hapus saringannya.
          </p>
          {adaSaringan && (
            <button
              type="button"
              onClick={reset}
              className="mt-8 tombol"
            >
              Hapus saringan
            </button>
          )}
        </div>
      )}
    </section>
  );
}
