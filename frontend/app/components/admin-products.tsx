"use client";

import Link from "next/link";
import { useState } from "react";

import AdminNumberBox from "@/app/components/admin-number-box";
import { ubahProduk, ubahVarian } from "@/app/lib/api-client";
import { kategoriLabel, rupiah, type Produk, type Varian } from "@/app/data/produk";

export const AMBANG_MENIPIS = 10;

function warnaStok(v: Varian): string {
  if (v.aktif === false) return "w-20 border-ink/10 bg-stone-100 text-stone-400";
  if (v.stok === 0) return "w-20 border-red-300 bg-red-50 text-red-700";
  if (v.stok <= AMBANG_MENIPIS)
    return "w-20 border-amber-300 bg-amber-50 text-amber-800";
  return "w-20 border-ink/15 bg-white text-ink";
}

export default function AdminProducts({ awal }: { awal: Produk[] }) {
  const [produk, setProduk] = useState<Produk[]>(awal);
  const [menyimpan, setMenyimpan] = useState<string | null>(null);
  const [galat, setGalat] = useState<string | null>(null);

  const kembalikan = (sebelumnya: Produk[], pesan: unknown) => {
    setProduk(sebelumnya);
    setGalat(pesan instanceof Error ? pesan.message : "Gagal menyimpan");
  };

  const ubahAngkaVarian = async (
    slugVarian: string,
    medan: "stok" | "harga",
    angka: number,
  ) => {
    const sebelumnya = produk;

    setMenyimpan(slugVarian);
    setGalat(null);
    setProduk((lama) =>
      lama.map((p) => ({
        ...p,
        varian: p.varian.map((v) =>
          v.slug === slugVarian ? { ...v, [medan]: angka } : v,
        ),
      })),
    );

    try {
      await ubahVarian(
        slugVarian,
        medan === "stok" ? { stock: angka } : { price: angka },
      );
    } catch (err) {
      kembalikan(sebelumnya, err);
    } finally {
      setMenyimpan(null);
    }
  };

  const toggleUnggulan = async (slug: string, berikut: boolean) => {
    const sebelumnya = produk;

    setMenyimpan(slug);
    setGalat(null);
    setProduk((lama) =>
      lama.map((p) => (p.slug === slug ? { ...p, unggulan: berikut } : p)),
    );

    try {
      await ubahProduk(slug, { is_featured: berikut });
    } catch (err) {
      kembalikan(sebelumnya, err);
    } finally {
      setMenyimpan(null);
    }
  };

  const semuaVarian = produk.flatMap((p) => p.varian);
  const menipis = semuaVarian.filter(
    (v) => v.aktif !== false && v.stok <= AMBANG_MENIPIS,
  ).length;

  const kepala =
    "px-4 py-3 font-mono text-[12px] tracking-[0.18em] font-normal text-stone-500 uppercase";

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Produk</h1>
        <Link
          href="/admin/produk/baru"
          className="border border-brand-500 bg-brand-500 px-5 py-2.5 font-mono text-[13px] tracking-[0.18em] indent-[0.18em] text-white uppercase transition-colors hover:border-brand-600 hover:bg-brand-600"
        >
          + Tambah produk
        </Link>
      </div>
      <p className="mt-1 text-sm text-stone-500">
        {produk.length} produk, {semuaVarian.length} ukuran, {menipis} ukuran
        stoknya menipis
      </p>

      {galat && (
        <p role="alert" className="mt-6 border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {galat}
        </p>
      )}

      <div className="mt-8 overflow-x-auto border border-ink/10 bg-white">
        <table className="w-full min-w-200 text-sm">
          <thead>
            <tr className="border-b border-ink/10 text-left">
              <th className={`px-6 py-3 text-left ${kepala}`}>Produk</th>
              <th className={kepala}>Kategori</th>
              <th className={kepala}>Ukuran</th>
              <th className={`${kepala} text-right`}>Harga</th>
              <th className={`${kepala} text-right`}>Stok</th>
              <th className={`${kepala} text-right`}>Unggulan</th>
              <th className={`px-6 py-3 text-right ${kepala}`}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {produk.map((p) =>
              p.varian.map((v, i) => (
                <tr
                  key={v.slug}
                  className={i === 0 ? "border-t border-ink/10" : ""}
                >
                  {i === 0 && (
                    <td className="px-6 py-3 align-top" rowSpan={p.varian.length}>
                      <span className="text-ink">{p.nama}</span>
                      <span className="mt-0.5 block font-mono text-[13px] text-stone-400">
                        {p.slug}
                      </span>
                    </td>
                  )}
                  {i === 0 && (
                    <td
                      className="px-4 py-3 align-top text-stone-600"
                      rowSpan={p.varian.length}
                    >
                      {kategoriLabel[p.kategori]}
                    </td>
                  )}

                  <td className="px-4 py-3">
                    <span
                      className={v.aktif === false ? "text-stone-400" : "text-ink"}
                    >
                      {v.label}
                    </span>
                    {v.aktif === false && (
                      <span className="mt-0.5 block font-mono text-[11px] tracking-[0.14em] text-stone-400 uppercase">
                        Nonaktif
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3 text-right">
                    <AdminNumberBox
                      nilai={v.harga}
                      min={1}
                      label={`Harga ${p.nama} ${v.label}`}
                      kelas="w-28 border-ink/15 bg-white text-ink"
                      mati={menyimpan === v.slug}
                      onSimpan={(angka) => void ubahAngkaVarian(v.slug, "harga", angka)}
                    />
                    {v.promo?.status === "active" && v.promo.harga && (
                      <span className="mt-1 block font-mono text-[11px] text-red-700">
                        Promo {rupiah(v.promo.harga)}
                      </span>
                    )}
                    {v.promo?.status === "scheduled" && (
                      <span className="mt-1 block font-mono text-[11px] text-amber-700">
                        Promo terjadwal
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3 text-right">
                    <AdminNumberBox
                      nilai={v.stok}
                      min={0}
                      label={`Stok ${p.nama} ${v.label}`}
                      kelas={warnaStok(v)}
                      mati={menyimpan === v.slug}
                      onSimpan={(angka) => void ubahAngkaVarian(v.slug, "stok", angka)}
                    />
                  </td>

                  {i === 0 && (
                    <td
                      className="px-4 py-3 text-right align-top"
                      rowSpan={p.varian.length}
                    >
                      <button
                        type="button"
                        onClick={() => void toggleUnggulan(p.slug, !p.unggulan)}
                        aria-pressed={p.unggulan}
                        disabled={menyimpan === p.slug}
                        className={`border px-3 py-1.5 font-mono text-[12px] tracking-[0.16em] indent-[0.16em] uppercase transition-colors ${
                          p.unggulan
                            ? "border-brand-500 bg-brand-500 text-white"
                            : "border-ink/15 text-stone-500 hover:border-brand-400 hover:text-brand-600"
                        }`}
                      >
                        {p.unggulan ? "Ya" : "Tidak"}
                      </button>
                    </td>
                  )}

                  {i === 0 && (
                    <td
                      className="px-6 py-3 text-right align-top"
                      rowSpan={p.varian.length}
                    >
                      <Link
                        href={`/admin/produk/${p.slug}/ubah`}
                        className="font-mono text-[12px] tracking-[0.16em] text-stone-500 uppercase transition-colors hover:text-brand-600"
                      >
                        Ubah
                      </Link>
                    </td>
                  )}
                </tr>
              )),
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-6 text-sm text-stone-500">
        Harga dan stok diatur per ukuran. Perubahan tersimpan saat kotaknya
        ditinggalkan atau setelah menekan Enter, jadi angka setengah jadi tidak
        pernah ikut tersimpan.
      </p>
    </div>
  );
}
