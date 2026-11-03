"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import {
  PILIHAN_PERIODE,
  teksRentang,
  type LaporanAPI,
  type Periode,
  type PilihanLaporan,
} from "@/app/lib/laporan";

export default function BingkaiLaporan({
  pilihan,
  rentang,
  unduh,
  children,
}: {
  pilihan: PilihanLaporan;
  rentang: LaporanAPI["range"];
  unduh: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const [tertunda, mulai] = useTransition();
  const [dari, setDari] = useState(rentang.from);
  const [sampai, setSampai] = useState(rentang.to);
  const [galat, setGalat] = useState<string | null>(null);

  const pergi = (kueri: string) => mulai(() => router.replace(`/admin?${kueri}`, { scroll: false }));

  const pilihPeriode = (p: Periode) => {
    setGalat(null);
    pergi(`periode=${p}`);
  };

  const terapkan = () => {
    if (!dari || !sampai) return setGalat("Isi tanggal awal dan akhir");
    if (dari > sampai) return setGalat("Tanggal awal tidak boleh setelah tanggal akhir");
    setGalat(null);
    pergi(`dari=${dari}&sampai=${sampai}`);
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Laporan penjualan</h1>
          <p className="mt-1 text-sm text-stone-500">
            {rentang.all ? "Semua waktu, " : ""}
            {teksRentang(rentang.from, rentang.to)}
            {rentang.previous
              ? ` · dibandingkan dengan ${teksRentang(rentang.previous.from, rentang.previous.to)}`
              : ""}{" "}
            · waktu WIB
          </p>
        </div>
        <a
          href={unduh}
          download
          className="inline-flex min-h-10 items-center gap-2 border border-ink/15 bg-white px-4 text-sm font-medium text-ink transition-colors hover:border-brand-500 hover:text-brand-600"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v11m0 0-4-4m4 4 4-4M5 19h14" />
          </svg>
          Unduh CSV
        </a>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3">
        <div role="group" aria-label="Periode laporan" className="flex flex-wrap gap-1.5">
          {PILIHAN_PERIODE.map((p) => (
            <button
              key={p.kunci}
              type="button"
              aria-pressed={pilihan.periode === p.kunci}
              onClick={() => pilihPeriode(p.kunci)}
              className={`min-h-9 border px-3 text-sm transition-colors ${
                pilihan.periode === p.kunci
                  ? "border-brand-500 bg-brand-500 font-semibold text-white"
                  : "border-ink/15 bg-white text-stone-700 hover:border-brand-400"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            terapkan();
          }}
          className="flex flex-wrap items-center gap-2"
        >
          <label className="sr-only" htmlFor="laporan-dari">
            Tanggal awal
          </label>
          <input
            id="laporan-dari"
            type="date"
            value={dari}
            max={sampai || undefined}
            onChange={(e) => setDari(e.target.value)}
            className={`min-h-9 border bg-white px-2 text-sm text-ink ${
              pilihan.periode === "kustom" ? "border-brand-500" : "border-ink/15"
            }`}
          />
          <span className="text-sm text-stone-500" aria-hidden="true">
            sampai
          </span>
          <label className="sr-only" htmlFor="laporan-sampai">
            Tanggal akhir
          </label>
          <input
            id="laporan-sampai"
            type="date"
            value={sampai}
            min={dari || undefined}
            onChange={(e) => setSampai(e.target.value)}
            className={`min-h-9 border bg-white px-2 text-sm text-ink ${
              pilihan.periode === "kustom" ? "border-brand-500" : "border-ink/15"
            }`}
          />
          <button
            type="submit"
            className="min-h-9 border border-ink/15 bg-white px-3 text-sm font-medium text-ink transition-colors hover:border-brand-500 hover:text-brand-600"
          >
            Terapkan
          </button>
        </form>
        {galat && (
          <p role="alert" className="w-full text-sm text-red-700">
            {galat}
          </p>
        )}
      </div>

      <div
        aria-busy={tertunda}
        className={`mt-8 transition-opacity duration-200 ${tertunda ? "pointer-events-none opacity-50" : ""}`}
      >
        {children}
      </div>
    </div>
  );
}
