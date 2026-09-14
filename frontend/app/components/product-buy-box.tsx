"use client";

import Link from "next/link";
import { useState } from "react";

import { tambahKeKeranjang } from "@/app/lib/keranjang";
import { rupiah, type Produk } from "@/app/data/produk";

export default function ProductBuyBox({ produk }: { produk: Produk }) {
  const [qty, setQty] = useState(1);
  const [baruDitambah, setBaruDitambah] = useState(false);

  const habis = produk.stok === 0;
  const maksimal = Math.max(1, produk.stok);

  const ubah = (delta: number) => {
    setQty((n) => Math.min(maksimal, Math.max(1, n + delta)));
    setBaruDitambah(false);
  };

  const tambah = () => {
    tambahKeKeranjang(produk.slug, qty, produk.stok);
    setBaruDitambah(true);
    window.setTimeout(() => setBaruDitambah(false), 2500);
  };

  if (habis) {
    return (
      <div className="mt-10 border border-ink/12 bg-stone-50 px-6 py-8">
        <p className="font-mono text-[11px] tracking-[0.2em] text-stone-500 uppercase">
          Stok habis
        </p>
        <p className="mt-3 text-sm leading-relaxed text-stone-600">
          Produk ini sedang kosong. Chat kami di WhatsApp untuk tahu kapan
          tersedia lagi.
        </p>
        <a
          href="https://wa.me/6281234567890"
          className="mt-6 inline-block border border-ink px-8 py-3.5 font-mono text-[11px] tracking-[0.22em] text-ink uppercase transition-colors hover:bg-ink hover:text-white"
        >
          Tanya stok
        </a>
      </div>
    );
  }

  return (
    <div className="mt-10">
      <div className="flex flex-wrap items-center gap-4">
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
          className="flex-1 border border-brand-500 bg-brand-500 px-8 py-3.5 font-mono text-[11px] tracking-[0.22em] text-white uppercase transition-colors hover:border-brand-600 hover:bg-brand-600 sm:flex-none"
        >
          Tambah ke keranjang
        </button>
      </div>

      <p className="mt-4 font-mono text-[11px] tracking-[0.16em] text-stone-500 uppercase">
        Subtotal {rupiah(produk.harga * qty)}
      </p>

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
