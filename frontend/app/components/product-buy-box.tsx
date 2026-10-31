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
      <legend className="text-[15px] text-stone-500 font-semibold">
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
              className={`min-h-11 rounded-2xl border-2 px-5 py-2.5 text-left transition-colors ${
                aktif
                  ? "border-brand-500 bg-brand-500 text-white"
                  : "border-ink/15 bg-white text-ink hover:border-brand-400"
              }`}
            >
              <span className="block text-[16px] font-bold">{v.label}</span>
              <span className={`mt-0.5 block text-[14px] font-medium ${aktif ? "text-white" : "text-stone-600"}`}>
                {kosong ? (
                  "Stok habis"
                ) : (
                  <HargaCoret
                    harga={v.harga}
                    normal={v.hargaNormal}
                    kecil
                    kelasNormal={aktif ? "text-white/80" : "text-stone-400"}
                  />
                )}
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
                      className="tautan"
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
        <div className="mt-8 rounded-2xl border border-ink/12 bg-stone-50 px-6 py-8">
          <p className="text-[15px] text-stone-500 font-semibold">
            Stok habis
          </p>
          <p className="mt-3 text-sm leading-relaxed text-stone-600">
            {banyakUkuran
              ? "Ukuran ini sedang kosong. Coba ukuran lain, atau chat kami di WhatsApp untuk tahu kapan tersedia lagi."
              : "Produk ini sedang kosong. Chat kami di WhatsApp untuk tahu kapan tersedia lagi."}
          </p>
          <LinkWa
            className="mt-6 tombol"
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
        <div className="flex items-center rounded-full border-2 border-ink/15">
          <button
            type="button"
            onClick={() => ubah(-1)}
            disabled={qty <= 1}
            aria-label="Kurangi jumlah"
            className="flex min-h-11 min-w-12 items-center justify-center rounded-l-full text-xl leading-none font-bold text-ink transition-colors hover:text-brand-600 disabled:cursor-not-allowed disabled:text-stone-300"
          >
            &minus;
          </button>
          <span className="w-10 text-center text-[17px] font-bold text-ink" aria-live="polite">
            {qty}
          </span>
          <button
            type="button"
            onClick={() => ubah(1)}
            disabled={qty >= maksimal}
            aria-label="Tambah jumlah"
            className="flex min-h-11 min-w-12 items-center justify-center rounded-r-full text-xl leading-none font-bold text-ink transition-colors hover:text-brand-600 disabled:cursor-not-allowed disabled:text-stone-300"
          >
            +
          </button>
        </div>

        <button
          type="button"
          onClick={tambah}
          className="tombol-oranye flex-1 px-10 text-[17px] sm:flex-none"
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

      <p className="mt-4 text-[15px] text-stone-500 font-semibold">
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
          className="mt-4 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700"
        >
          Ditambahkan ke keranjang.{" "}
          <Link href="/keranjang" className="tautan">
            Lihat keranjang
          </Link>
        </p>
      )}
    </div>
  );
}
