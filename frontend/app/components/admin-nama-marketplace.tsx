"use client";

import { useState } from "react";

import { hapusNamaMarketplace, tambahNamaMarketplace, type SumberImporUlasan } from "@/app/lib/api-client";
import type { NamaMarketplace } from "@/app/lib/api";
import type { Produk } from "@/app/data/produk";

const SUMBER: { nilai: SumberImporUlasan; label: string }[] = [
  { nilai: "shopee", label: "Shopee" },
  { nilai: "tokopedia", label: "Tokopedia & TikTok Shop" },
];

const label = "block font-mono text-[12px] tracking-[0.2em] text-stone-500 uppercase";
const kotak =
  "min-w-0 flex-1 border border-ink/15 bg-white px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-stone-400 focus:border-brand-500 disabled:bg-stone-100";

export default function AdminNamaMarketplace({ produk, awal }: { produk: Produk; awal: NamaMarketplace[] }) {
  const [daftar, setDaftar] = useState<NamaMarketplace[]>(awal);
  const [isian, setIsian] = useState<Record<string, string>>({});
  const [proses, setProses] = useState<string | null>(null);
  const [galat, setGalat] = useState<string | null>(null);

  const tambah = async (variantSlug: string, sumber: SumberImporUlasan) => {
    const kunci = `${variantSlug}|${sumber}`;
    const nama = (isian[kunci] ?? "").trim();
    if (!nama) return;

    setProses(kunci);
    setGalat(null);

    try {
      const baru = await tambahNamaMarketplace(variantSlug, sumber, nama);
      setDaftar((lama) => [...lama, baru]);
      setIsian((lama) => ({ ...lama, [kunci]: "" }));
    } catch (err) {
      setGalat(err instanceof Error ? err.message : "Nama gagal ditambahkan");
    } finally {
      setProses(null);
    }
  };

  const hapus = async (n: NamaMarketplace) => {
    setProses(`hapus-${n.id}`);
    setGalat(null);

    try {
      await hapusNamaMarketplace(n.id);
      setDaftar((lama) => lama.filter((x) => x.id !== n.id));
    } catch (err) {
      setGalat(err instanceof Error ? err.message : "Nama gagal dihapus");
    } finally {
      setProses(null);
    }
  };

  return (
    <section className="mt-12 border-t border-ink/10 pt-10">
      <h2 className="text-lg font-semibold tracking-tight text-ink">Nama listing di marketplace</h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600">
        Dipakai fitur Impor ulasan untuk mengenali ukuran dari nama produk di screenshot. Tulis nama listing persis
        seperti di Shopee atau Tokopedia. Nama baru juga ditambahkan otomatis setiap kali impor ulasan disimpan.
      </p>

      {galat && (
        <p role="alert" className="mt-4 border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {galat}
        </p>
      )}

      <div className="mt-6 divide-y divide-ink/10 border border-ink/10 bg-white">
        {produk.varian.map((v) => (
          <div key={v.slug} className="grid gap-5 px-5 py-5 lg:grid-cols-[9rem_1fr_1fr]">
            <p className="text-sm font-medium text-ink">
              {v.label}
              {v.aktif === false && <span className="mt-0.5 block font-mono text-[11px] text-stone-400 uppercase">Nonaktif</span>}
            </p>

            {SUMBER.map((s) => {
              const kunci = `${v.slug}|${s.nilai}`;
              const nama = daftar.filter((n) => n.variant_slug === v.slug && n.source === s.nilai);

              return (
                <div key={s.nilai} className="min-w-0">
                  <p className={label}>{s.label}</p>
                  <ul className="mt-2 space-y-1.5">
                    {nama.length === 0 && <li className="text-sm text-stone-400">Belum ada</li>}
                    {nama.map((n) => (
                      <li key={n.id} className="flex items-start gap-2 text-sm text-stone-700">
                        <span className="min-w-0 flex-1 break-words">{n.name}</span>
                        <button
                          type="button"
                          onClick={() => void hapus(n)}
                          disabled={proses === `hapus-${n.id}`}
                          aria-label={`Hapus nama ${n.name}`}
                          className="shrink-0 px-1 text-base leading-none text-stone-400 transition-colors hover:text-red-600 disabled:text-stone-200"
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      void tambah(v.slug, s.nilai);
                    }}
                    className="mt-2 flex gap-2"
                  >
                    <input
                      value={isian[kunci] ?? ""}
                      onChange={(e) => setIsian((lama) => ({ ...lama, [kunci]: e.target.value }))}
                      maxLength={200}
                      placeholder="Tambah nama listing"
                      aria-label={`Tambah nama listing ${s.label} untuk ukuran ${v.label}`}
                      disabled={proses === kunci}
                      className={kotak}
                    />
                    <button
                      type="submit"
                      disabled={proses === kunci || !(isian[kunci] ?? "").trim()}
                      className="shrink-0 border border-ink/15 px-3 py-2 font-mono text-[12px] tracking-[0.14em] text-stone-600 uppercase transition-colors hover:border-brand-500 hover:text-brand-600 disabled:cursor-not-allowed disabled:text-stone-300"
                    >
                      Tambah
                    </button>
                  </form>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}
