"use client";

import { useId, useState } from "react";

import { HARI_PANJANG, HARI_SINGKAT, angka } from "@/app/lib/laporan";

const TINGKAT = ["bg-brand-100", "bg-brand-300", "bg-brand-500", "bg-brand-700"];
const jam = (h: number) => `${String(h).padStart(2, "0")}.00`;

export default function LaporanPanas({ data }: { data: { dow: number; hour: number; orders: number }[] }) {
  const [tabel, setTabel] = useState(false);
  const [sorot, setSorot] = useState<{ hari: number; jam: number } | null>(null);
  const dasar = useId();

  const grid = Array.from({ length: 7 }, () => Array<number>(24).fill(0));
  for (const d of data) grid[d.dow - 1][d.hour] += d.orders;

  const maks = Math.max(0, ...grid.flat());
  const total = grid.flat().reduce((a, b) => a + b, 0);
  const perJam = Array.from({ length: 24 }, (_, h) => grid.reduce((a, baris) => a + baris[h], 0));
  const perHari = grid.map((baris) => baris.reduce((a, b) => a + b, 0));
  const jamTersibuk = perJam.indexOf(Math.max(...perJam));
  const hariTersibuk = perHari.indexOf(Math.max(...perHari));
  const tingkat = (v: number) => (v === 0 ? "bg-stone-100" : TINGKAT[Math.min(3, Math.ceil((v / maks) * 4) - 1)]);
  const isiSorot = sorot ? grid[sorot.hari][sorot.jam] : 0;

  if (total === 0) {
    return <p className="text-sm text-stone-500">Belum ada pesanan masuk di periode ini.</p>;
  }

  return (
    <div>
      <p className="text-sm text-stone-600">
        Paling ramai jam <strong className="font-semibold text-ink">{jam(jamTersibuk)}–{jam((jamTersibuk + 1) % 24)}</strong>{" "}
        ({angka(perJam[jamTersibuk])} pesanan) dan hari{" "}
        <strong className="font-semibold text-ink">{HARI_PANJANG[hariTersibuk]}</strong> ({angka(perHari[hariTersibuk])}{" "}
        pesanan).
      </p>

      <div className="mt-4 overflow-x-auto pb-1">
        <div
          role="img"
          aria-label={`Peta waktu pesanan masuk. Paling ramai jam ${jam(jamTersibuk)} dan hari ${HARI_PANJANG[hariTersibuk]}. Rinciannya ada di tabel.`}
          className="relative grid min-w-[36rem] grid-cols-[2.5rem_repeat(24,minmax(0,1fr))] gap-[2px]"
          onPointerLeave={() => setSorot(null)}
        >
          <span />
          {Array.from({ length: 24 }, (_, h) => (
            <span key={h} className="text-center text-[10px] text-stone-500 tabular-nums">
              {h % 3 === 0 ? String(h).padStart(2, "0") : ""}
            </span>
          ))}
          {grid.map((baris, d) => (
            <div key={d} className="contents">
              <span className="pr-1 text-[11px] leading-6 text-stone-500">{HARI_SINGKAT[d]}</span>
              {baris.map((v, h) => (
                <span
                  key={h}
                  onPointerEnter={() => setSorot({ hari: d, jam: h })}
                  className={`h-6 rounded-[3px] ${tingkat(v)} ${
                    sorot?.hari === d && sorot.jam === h ? "outline-2 outline-offset-1 outline-ink" : ""
                  }`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-500">
        <p aria-hidden="true" className="min-h-4">
          {sorot
            ? `${HARI_PANJANG[sorot.hari]}, ${jam(sorot.jam)}–${jam((sorot.jam + 1) % 24)}: ${angka(isiSorot)} pesanan`
            : "Arahkan kursor ke kotak untuk melihat jumlahnya."}
        </p>
        <div className="flex items-center gap-1.5" aria-hidden="true">
          <span>Sepi</span>
          <span className="h-3 w-3 rounded-[3px] bg-stone-100" />
          {TINGKAT.map((t) => (
            <span key={t} className={`h-3 w-3 rounded-[3px] ${t}`} />
          ))}
          <span>Ramai</span>
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
        <div id={`${dasar}tabel`} className="mt-3 overflow-x-auto border border-ink/10">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 text-left text-stone-500">
              <tr>
                <th className="px-3 py-2 font-medium">Hari</th>
                <th className="px-3 py-2 text-right font-medium">Pesanan</th>
                <th className="px-3 py-2 font-medium">Jam yang ada pesanannya</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {grid.map((baris, d) => (
                <tr key={d}>
                  <td className="px-3 py-2 text-stone-700">{HARI_PANJANG[d]}</td>
                  <td className="px-3 py-2 text-right text-ink tabular-nums">{angka(perHari[d])}</td>
                  <td className="px-3 py-2 text-stone-600">
                    {baris
                      .map((v, h) => (v > 0 ? `${jam(h)} (${angka(v)})` : null))
                      .filter(Boolean)
                      .join(", ") || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
