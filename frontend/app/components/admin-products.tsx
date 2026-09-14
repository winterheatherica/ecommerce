"use client";

import Link from "next/link";
import { useState } from "react";

import { ubahProduk } from "@/app/lib/api-client";
import { kategoriLabel, rupiah, type Produk } from "@/app/data/produk";

export default function AdminProducts({ awal }: { awal: Produk[] }) {
  const [produk, setProduk] = useState<Produk[]>(awal);
  const [menyimpan, setMenyimpan] = useState<string | null>(null);
  const [galat, setGalat] = useState<string | null>(null);

  const simpan = async (
    slug: string,
    perubahan: { stock?: number; is_featured?: boolean },
    sebelumnya: Produk,
  ) => {
    setMenyimpan(slug);
    setGalat(null);

    try {
      await ubahProduk(slug, perubahan);
    } catch (err) {
      setProduk((lama) => lama.map((p) => (p.slug === slug ? sebelumnya : p)));
      setGalat(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setMenyimpan(null);
    }
  };

  const ubahStok = (slug: string, nilai: string) => {
    const angka = Math.max(0, Number(nilai) || 0);
    const sebelumnya = produk.find((p) => p.slug === slug);
    if (!sebelumnya) return;

    setProduk((lama) =>
      lama.map((p) => (p.slug === slug ? { ...p, stok: angka } : p)),
    );
    void simpan(slug, { stock: angka }, sebelumnya);
  };

  const toggleUnggulan = (slug: string) => {
    const sebelumnya = produk.find((p) => p.slug === slug);
    if (!sebelumnya) return;

    const berikut = !sebelumnya.unggulan;
    setProduk((lama) =>
      lama.map((p) => (p.slug === slug ? { ...p, unggulan: berikut } : p)),
    );
    void simpan(slug, { is_featured: berikut }, sebelumnya);
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Produk</h1>
        <Link
          href="/admin/produk/baru"
          className="border border-brand-500 bg-brand-500 px-5 py-2.5 font-mono text-[11px] tracking-[0.18em] text-white uppercase transition-colors hover:border-brand-600 hover:bg-brand-600"
        >
          + Tambah produk
        </Link>
      </div>
      <p className="mt-1 text-sm text-stone-500">
        {produk.length} produk &middot; {produk.filter((p) => p.unggulan).length} ditandai
        unggulan
      </p>

      {galat && (
        <p role="alert" className="mt-6 border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {galat}
        </p>
      )}

      <div className="mt-8 overflow-x-auto border border-ink/10 bg-white">
        <table className="w-full min-w-160 text-sm">
          <thead>
            <tr className="border-b border-ink/10 text-left">
              <th className="px-6 py-3 font-mono text-[10px] tracking-[0.18em] font-normal text-stone-500 uppercase">
                Produk
              </th>
              <th className="px-4 py-3 font-mono text-[10px] tracking-[0.18em] font-normal text-stone-500 uppercase">
                Kategori
              </th>
              <th className="px-4 py-3 text-right font-mono text-[10px] tracking-[0.18em] font-normal text-stone-500 uppercase">
                Harga
              </th>
              <th className="px-4 py-3 text-right font-mono text-[10px] tracking-[0.18em] font-normal text-stone-500 uppercase">
                Stok
              </th>
              <th className="px-4 py-3 text-right font-mono text-[10px] tracking-[0.18em] font-normal text-stone-500 uppercase">
                Unggulan
              </th>
              <th className="px-6 py-3 text-right font-mono text-[10px] tracking-[0.18em] font-normal text-stone-500 uppercase">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/5">
            {produk.map((p) => (
              <tr key={p.slug} className="transition-colors hover:bg-stone-50">
                <td className="px-6 py-3">
                  <span className="text-ink">{p.nama}</span>
                  <span className="mt-0.5 block font-mono text-[11px] text-stone-400">
                    {p.slug}
                  </span>
                </td>
                <td className="px-4 py-3 text-stone-600">{kategoriLabel[p.kategori]}</td>
                <td className="px-4 py-3 text-right font-mono text-ink">
                  {rupiah(p.harga)}
                </td>
                <td className="px-4 py-3 text-right">
                  <input
                    type="number"
                    min={0}
                    value={p.stok}
                    onChange={(e) => ubahStok(p.slug, e.target.value)}
                    aria-label={`Stok ${p.nama}`}
                    disabled={menyimpan === p.slug}
                    className={`w-20 border px-2 py-1.5 text-right font-mono text-sm outline-none transition-colors focus:border-brand-500 ${
                      p.stok === 0
                        ? "border-red-300 bg-red-50 text-red-700"
                        : p.stok <= 10
                          ? "border-amber-300 bg-amber-50 text-amber-800"
                          : "border-ink/15 bg-white text-ink"
                    }`}
                  />
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => toggleUnggulan(p.slug)}
                    aria-pressed={p.unggulan}
                    disabled={menyimpan === p.slug}
                    className={`border px-3 py-1.5 font-mono text-[10px] tracking-[0.16em] uppercase transition-colors ${
                      p.unggulan
                        ? "border-brand-500 bg-brand-500 text-white"
                        : "border-ink/15 text-stone-500 hover:border-brand-400 hover:text-brand-600"
                    }`}
                  >
                    {p.unggulan ? "Ya" : "Tidak"}
                  </button>
                </td>
                <td className="px-6 py-3 text-right">
                  <Link
                    href={`/admin/produk/${p.slug}/ubah`}
                    className="font-mono text-[10px] tracking-[0.16em] text-stone-500 uppercase transition-colors hover:text-brand-600"
                  >
                    Ubah
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-6 text-sm text-stone-500">
        Perubahan langsung dikirim ke API. Datanya masih disimpan di memori Worker,
        jadi akan kembali ke awal setiap kali backend dinyalakan ulang.
      </p>
    </div>
  );
}
