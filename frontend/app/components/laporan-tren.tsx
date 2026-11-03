"use client";

import { useId, useState, type KeyboardEvent } from "react";

import { rupiah } from "@/app/data/produk";
import { angka, labelEmber, rupiahRingkas, type LaporanAPI, type TitikTren } from "@/app/lib/laporan";

type Metrik = "revenue" | "orders" | "items";

const METRIK: { kunci: Metrik; label: string; satuan: string }[] = [
  { kunci: "revenue", label: "Pendapatan", satuan: "" },
  { kunci: "orders", label: "Pesanan", satuan: "pesanan" },
  { kunci: "items", label: "Barang", satuan: "barang" },
];

const KATA_EMBER = { day: "Per hari", week: "Per minggu", month: "Per bulan" };

function skala(maks: number, bulat: boolean): { atas: number; langkah: number } {
  if (maks <= 0) return { atas: bulat ? 4 : 100_000, langkah: bulat ? 1 : 25_000 };

  const kasar = maks / 4;
  const pangkat = 10 ** Math.floor(Math.log10(kasar));
  let langkah = [1, 2, 2.5, 5, 10].map((k) => k * pangkat).find((s) => s >= kasar) ?? 10 * pangkat;
  if (bulat) langkah = Math.max(1, Math.ceil(langkah));

  return { atas: langkah * Math.ceil(maks / langkah), langkah };
}

function tampil(metrik: Metrik, n: number): string {
  if (metrik === "revenue") return rupiah(n);
  return `${angka(n)} ${METRIK.find((m) => m.kunci === metrik)!.satuan}`;
}

export default function LaporanTren({ tren, ember }: { tren: TitikTren[]; ember: LaporanAPI["range"]["bucket"] }) {
  const [metrik, setMetrik] = useState<Metrik>("revenue");
  const [aktif, setAktif] = useState<number | null>(null);
  const [tabel, setTabel] = useState(false);
  const dasar = useId();

  const nilai = tren.map((t) => t[metrik]);
  const maks = Math.max(0, ...nilai);
  const { atas, langkah } = skala(maks, metrik !== "revenue");
  const garis = Array.from({ length: Math.round(atas / langkah) + 1 }, (_, i) => i * langkah).reverse();
  const jumlah = nilai.reduce((a, b) => a + b, 0);
  const n = tren.length;
  const tiapLabel = Math.max(1, Math.ceil(n / 7));
  const labelTik = (v: number) => (metrik === "revenue" ? rupiahRingkas(v).replace("Rp", "") : angka(v));
  const titik = aktif === null ? null : tren[aktif];

  const tekan = (e: KeyboardEvent<HTMLDivElement>) => {
    const ke = { ArrowRight: 1, ArrowLeft: -1 }[e.key as "ArrowRight" | "ArrowLeft"];
    if (ke !== undefined) {
      e.preventDefault();
      setAktif((a) => Math.min(n - 1, Math.max(0, (a ?? n - 1) + ke)));
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      setAktif(e.key === "Home" ? 0 : n - 1);
    } else if (e.key === "Escape") {
      setAktif(null);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-stone-500">
            {METRIK.find((m) => m.kunci === metrik)!.label} · {KATA_EMBER[ember].toLowerCase()}
          </p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-ink">{tampil(metrik, jumlah)}</p>
        </div>
        <div role="group" aria-label="Pilih metrik" className="flex border border-ink/15 bg-white p-0.5">
          {METRIK.map((m) => (
            <button
              key={m.kunci}
              type="button"
              aria-pressed={metrik === m.kunci}
              onClick={() => setMetrik(m.kunci)}
              className={`min-h-9 px-3 text-sm transition-colors ${
                metrik === m.kunci ? "bg-brand-500 font-semibold text-white" : "text-stone-600 hover:bg-stone-100"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 flex gap-2">
        <div className="relative h-56 w-14 shrink-0" aria-hidden="true">
          {garis.map((v, i) => (
            <span
              key={v}
              className="absolute right-0 -translate-y-1/2 text-[11px] text-stone-500 tabular-nums"
              style={{ top: `${(i / (garis.length - 1)) * 100}%` }}
            >
              {labelTik(v)}
            </span>
          ))}
        </div>

        <div className="min-w-0 flex-1">
          <div
            tabIndex={0}
            role="group"
            aria-label={`Grafik ${METRIK.find((m) => m.kunci === metrik)!.label.toLowerCase()}, ${n} titik. Pakai panah kiri dan kanan untuk membaca nilainya.`}
            onKeyDown={tekan}
            onFocus={() => setAktif((a) => a ?? n - 1)}
            onBlur={() => setAktif(null)}
            onPointerLeave={() => setAktif(null)}
            className="relative h-56 focus-visible:outline-offset-4"
          >
            {garis.map((v, i) => (
              <div
                key={v}
                className={`absolute inset-x-0 border-t ${i === garis.length - 1 ? "border-stone-300" : "border-stone-200"}`}
                style={{ top: `${(i / (garis.length - 1)) * 100}%` }}
              />
            ))}

            <div className="absolute inset-0 flex items-end gap-[2px]">
              {tren.map((t, i) => {
                const tinggi = atas > 0 ? (t[metrik] / atas) * 100 : 0;
                return (
                  <div
                    key={t.start}
                    onPointerEnter={() => setAktif(i)}
                    className="flex h-full min-w-0 flex-1 items-end justify-center"
                  >
                    <div
                      className={`w-full max-w-6 rounded-t-[4px] transition-colors ${
                        aktif === i ? "bg-brand-700" : "bg-brand-500"
                      }`}
                      style={{ height: t[metrik] > 0 ? `max(${tinggi}%, 2px)` : 0 }}
                    />
                  </div>
                );
              })}
            </div>

            {titik && aktif !== null && (
              <div
                className="pointer-events-none absolute top-0 z-10 w-max max-w-56 -translate-y-full border border-ink/10 bg-white px-3 py-2 text-sm shadow-lg"
                style={
                  aktif / n > 0.66
                    ? { right: `${((n - aktif - 1) / n) * 100}%` }
                    : { left: `${(aktif / n) * 100}%` }
                }
              >
                <p className="font-semibold text-ink">{tampil(metrik, titik[metrik])}</p>
                <p className="text-xs text-stone-500">{labelEmber(titik.start, ember)}</p>
              </div>
            )}
            {maks === 0 && (
              <p className="absolute inset-0 flex items-center justify-center text-sm text-stone-500">
                Belum ada penjualan di periode ini.
              </p>
            )}
          </div>

          <div className="relative mt-2 h-5" aria-hidden="true">
            {tren.map((t, i) =>
              (i % tiapLabel === 0 && n - 1 - i >= tiapLabel / 2) || i === n - 1 ? (
                <span
                  key={t.start}
                  className="absolute top-0 text-[11px] whitespace-nowrap text-stone-500"
                  style={
                    i === n - 1 && n > 7
                      ? { right: 0 }
                      : { left: `${((i + 0.5) / n) * 100}%`, transform: "translateX(-50%)" }
                  }
                >
                  {labelEmber(t.start, ember, true)}
                </span>
              ) : null,
            )}
          </div>
          <p className="sr-only" aria-live="polite">
            {titik ? `${labelEmber(titik.start, ember)}: ${tampil(metrik, titik[metrik])}` : ""}
          </p>
        </div>
      </div>

      <button
        type="button"
        aria-expanded={tabel}
        aria-controls={`${dasar}tabel`}
        onClick={() => setTabel((v) => !v)}
        className="mt-4 text-sm font-medium text-brand-600 underline-offset-4 hover:underline"
      >
        {tabel ? "Sembunyikan tabel" : "Lihat tabel"}
      </button>
      {tabel && (
        <div id={`${dasar}tabel`} className="mt-3 max-h-80 overflow-auto border border-ink/10">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-stone-50 text-left text-stone-500">
              <tr>
                <th className="px-3 py-2 font-medium">Periode</th>
                <th className="px-3 py-2 text-right font-medium">Pendapatan</th>
                <th className="px-3 py-2 text-right font-medium">Pesanan</th>
                <th className="px-3 py-2 text-right font-medium">Barang</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5 tabular-nums">
              {tren.map((t) => (
                <tr key={t.start}>
                  <td className="px-3 py-2 text-stone-700">{labelEmber(t.start, ember)}</td>
                  <td className="px-3 py-2 text-right text-ink">{rupiah(t.revenue)}</td>
                  <td className="px-3 py-2 text-right text-ink">{angka(t.orders)}</td>
                  <td className="px-3 py-2 text-right text-ink">{angka(t.items)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
