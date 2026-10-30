"use client";

import { LinkWa } from "@/app/components/situs-konteks";
import Link from "next/link";
import { useState } from "react";

import HargaCoret from "@/app/components/harga-coret";
import { usePilihanUkuran } from "@/app/components/pilihan-ukuran";
import { MAKS_PER_UKURAN, tambahKeKeranjang } from "@/app/lib/keranjang";
import { angkaRating, jumlahLengkap, NAMA_MARKETPLACE, SATUAN_RATING } from "@/app/lib/rating";
import { tanggalWib } from "@/app/lib/waktu-wib";
import { rupiah, type Produk, type Varian } from "@/app/data/produk";

export default function ProductBuyBox({ produk }: { produk: Produk }) {
  const { ukuran, pilihUkuran } = usePilihanUkuran();
  const dipilih = produk.varian.find((v) => v.slug === ukuran) ?? null;
  const [qty, setQty] = useState(1);
  const [baruDitambah, setBaruDitambah] = useState(false);

  const banyakUkuran = produk.varian.length > 1;
  const stok = dipilih?.stok ?? produk.stok;
  const harga = dipilih?.harga ?? produk.harga;
  const hargaNormal = dipilih ? dipilih.hargaNormal : produk.hargaNormal;
  const habis = stok === 0;
  const maksimal = Math.max(1, Math.min(stok, MAKS_PER_UKURAN));
  const marketplace =
    banyakUkuran && dipilih
      ? (["shopee", "tokopedia"] as const).flatMap((m) => {
          const r = dipilih[m];
          return r && (r.url || (r.jumlah ?? 0) > 0) ? [{ m, r }] : [];
        })
      : [];

  const ubah = (delta: number) => {
    setQty((n) => Math.min(maksimal, Math.max(1, n + delta)));
    setBaruDitambah(false);
  };

  const pilih = (v: Varian) => {
    pilihUkuran(v.slug);
    setQty(1);
    setBaruDitambah(false);
  };

  const tambah = () => {
    tambahKeKeranjang(dipilih?.slug ?? produk.slug, qty, stok);
    setBaruDitambah(true);
    window.setTimeout(() => setBaruDitambah(false), 2500);
  };

  const pemilih = banyakUkuran && (
    <fieldset className="mt-8">
      <legend className="font-mono text-[13px] tracking-[0.2em] text-stone-500 uppercase">
        Pilih ukuran
      </legend>
      <div className="mt-4 flex flex-wrap gap-3">
        {produk.varian.map((v) => {
          const aktif = v.slug === dipilih?.slug;
          const kosong = v.stok === 0;

          return (
            <button
              key={v.slug}
              type="button"
              onClick={() => pilih(v)}
              aria-pressed={aktif}
              className={`border px-5 py-3 text-left transition-colors ${
                aktif
                  ? "border-brand-500 bg-brand-50"
                  : "border-ink/15 hover:border-brand-400"
              }`}
            >
              <span
                className={`block text-sm font-medium ${
                  aktif ? "text-brand-700" : "text-ink"
                }`}
              >
                {v.label}
              </span>
              <span className="mt-0.5 block font-mono text-[12px] text-stone-500">
                {kosong ? "Stok habis" : <HargaCoret harga={v.harga} normal={v.hargaNormal} kecil />}
              </span>
            </button>
          );
        })}
      </div>

      {dipilih && marketplace.length > 0 && (
        <div className="mt-4 text-sm text-stone-600">
          <p>Ukuran {dipilih.label}:</p>
          <ul className="mt-1 space-y-1">
            {marketplace.map(({ m, r }) => {
              const ada = (r.jumlah ?? 0) > 0 && r.rata != null;

              return (
                <li key={m} className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  {ada ? (
                    <>
                      <span>{NAMA_MARKETPLACE[m]}</span>
                      <span aria-hidden="true" className="text-amber-500">
                        &#9733;
                      </span>
                      <span className="font-semibold text-ink">{angkaRating(r.rata ?? 0)}</span>
                      <span>
                        dari {jumlahLengkap(r.jumlah ?? 0)} {SATUAN_RATING[m]}
                      </span>
                    </>
                  ) : (
                    <span>
                      Belum punya {SATUAN_RATING[m]} di {NAMA_MARKETPLACE[m]}
                    </span>
                  )}
                  {r.url && (
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener nofollow"
                      className="border-b border-stone-400 font-mono text-[12px] tracking-[0.14em] text-ink uppercase transition-colors hover:border-brand-600 hover:text-brand-600"
                    >
                      Lihat di {NAMA_MARKETPLACE[m]} &#8599;
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </fieldset>
  );

  if (habis) {
    return (
      <div className="mt-10">
        {pemilih}
        <div className="mt-8 border border-ink/12 bg-stone-50 px-6 py-8">
          <p className="font-mono text-[13px] tracking-[0.2em] text-stone-500 uppercase">
            Stok habis
          </p>
          <p className="mt-3 text-sm leading-relaxed text-stone-600">
            {banyakUkuran
              ? "Ukuran ini sedang kosong. Coba ukuran lain, atau chat kami di WhatsApp untuk tahu kapan tersedia lagi."
              : "Produk ini sedang kosong. Chat kami di WhatsApp untuk tahu kapan tersedia lagi."}
          </p>
          <LinkWa
            className="mt-6 inline-block border border-ink px-8 py-3.5 font-mono text-[13px] tracking-[0.22em] indent-[0.22em] text-ink uppercase transition-colors hover:bg-ink hover:text-white"
          >
            Tanya stok
          </LinkWa>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-10">
      {pemilih}

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <div className="flex items-center border border-ink/15">
          <button
            type="button"
            onClick={() => ubah(-1)}
            disabled={qty <= 1}
            aria-label="Kurangi jumlah"
            className="px-4 py-3 text-lg leading-none text-stone-600 transition-colors hover:text-brand-600 disabled:cursor-not-allowed disabled:text-stone-300"
          >
            &minus;
          </button>
          <span className="w-12 text-center font-mono text-sm text-ink" aria-live="polite">
            {qty}
          </span>
          <button
            type="button"
            onClick={() => ubah(1)}
            disabled={qty >= maksimal}
            aria-label="Tambah jumlah"
            className="px-4 py-3 text-lg leading-none text-stone-600 transition-colors hover:text-brand-600 disabled:cursor-not-allowed disabled:text-stone-300"
          >
            +
          </button>
        </div>

        <button
          type="button"
          onClick={tambah}
          className="flex-1 border border-brand-500 bg-brand-500 px-8 py-3.5 font-mono text-[13px] tracking-[0.22em] indent-[0.22em] text-white uppercase transition-colors hover:border-brand-600 hover:bg-brand-600 sm:flex-none"
        >
          Tambah ke keranjang
        </button>
      </div>

      {qty >= MAKS_PER_UKURAN && stok > MAKS_PER_UKURAN && (
        <p className="mt-3 text-sm text-stone-600">
          Maksimal {MAKS_PER_UKURAN} per ukuran dalam satu pesanan. Butuh lebih banyak?{" "}
          <LinkWa className="underline underline-offset-2">
            Chat WhatsApp
          </LinkWa>
          .
        </p>
      )}

      <p className="mt-4 font-mono text-[13px] tracking-[0.16em] text-stone-500 uppercase">
        Subtotal {rupiah(harga * qty)}
        {dipilih && banyakUkuran ? ` · ${dipilih.label}` : ""}
        {hargaNormal && hargaNormal > harga ? ` · Hemat ${rupiah((hargaNormal - harga) * qty)}` : ""}
      </p>

      {dipilih?.promoSampai && (
        <p className="mt-2 text-sm text-red-700">
          Harga promo berlaku sampai {tanggalWib(dipilih.promoSampai)} WIB
        </p>
      )}

      {baruDitambah && (
        <p
          role="status"
          className="mt-4 border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-700"
        >
          Ditambahkan ke keranjang.{" "}
          <Link href="/keranjang" className="font-medium underline underline-offset-2">
            Lihat keranjang
          </Link>
        </p>
      )}
    </div>
  );
}
