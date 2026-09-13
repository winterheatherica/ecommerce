"use client";

import Image from "next/image";

import { hapusDariKeranjang, ubahQty, useKeranjang } from "@/app/lib/keranjang";
import { rupiah, type Produk } from "@/app/data/produk";

type Baris = { produk: Produk; qty: number };

export default function CartView({ produk }: { produk: Produk[] }) {
  const items = useKeranjang();

  const baris: Baris[] = items
    .map((i) => {
      const cocok = produk.find((p) => p.slug === i.slug);
      return cocok ? { produk: cocok, qty: i.qty } : null;
    })
    .filter((x): x is Baris => x !== null);

  const subtotal = baris.reduce((s, b) => s + b.produk.harga * b.qty, 0);
  const totalItem = baris.reduce((s, b) => s + b.qty, 0);
  const beratTotal = baris.reduce((s, b) => s + b.produk.beratG * b.qty, 0);
  const adaMelebihiStok = baris.some((b) => b.qty > b.produk.stok);

  if (baris.length === 0) {
    return (
      <div className="mx-auto w-full max-w-3xl px-6 pt-32 pb-24">
        <p className="font-mono text-[11px] tracking-[0.28em] text-accent-600 uppercase">
          Keranjang
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Masih kosong
        </h1>
        <p className="mt-4 leading-relaxed text-stone-600">
          Belum ada produk yang dimasukkan. Mulai dari masalah yang sedang
          mengganggu di rumahmu.
        </p>
        <a
          href="/produk"
          className="mt-8 inline-block border border-ink px-8 py-3.5 font-mono text-[11px] tracking-[0.22em] text-ink uppercase transition-colors hover:bg-ink hover:text-white"
        >
          Lihat produk
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-6 pt-32 pb-24">
      <p className="font-mono text-[11px] tracking-[0.28em] text-accent-600 uppercase">
        Keranjang
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
        {totalItem} item siap dipesan
      </h1>

      <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_20rem] lg:gap-16">
        <ul className="divide-y divide-ink/10 border-y border-ink/10">
          {baris.map(({ produk, qty }) => {
            const lebih = qty > produk.stok;

            return (
              <li key={produk.slug} className="flex gap-5 py-6">
                <a
                  href={`/produk/${produk.slug}`}
                  className="relative aspect-square w-24 shrink-0 overflow-hidden border border-brand-100 bg-brand-50 sm:w-28"
                >
                  {produk.gambar ? (
                    <Image
                      src={produk.gambar}
                      alt={produk.nama}
                      fill
                      sizes="112px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="absolute inset-0 flex items-center justify-center font-mono text-[9px] tracking-[0.16em] text-brand-300 uppercase">
                      Foto
                    </span>
                  )}
                </a>

                <div className="flex min-w-0 flex-1 flex-col">
                  <a
                    href={`/produk/${produk.slug}`}
                    className="text-sm leading-relaxed text-ink transition-colors hover:text-brand-600"
                  >
                    {produk.nama}
                  </a>
                  <p className="mt-1 font-mono text-sm text-brand-600">
                    {rupiah(produk.harga)}
                  </p>

                  {lebih && (
                    <p className="mt-2 text-xs text-red-600">
                      Sisa stok tinggal {produk.stok}. Kurangi jumlahnya dulu.
                    </p>
                  )}

                  <div className="mt-auto flex flex-wrap items-center gap-4 pt-4">
                    <div className="flex items-center border border-ink/15">
                      <button
                        type="button"
                        onClick={() => ubahQty(produk.slug, qty - 1, produk.stok)}
                        disabled={qty <= 1}
                        aria-label={`Kurangi ${produk.nama}`}
                        className="px-3 py-2 leading-none text-stone-600 transition-colors hover:text-brand-600 disabled:cursor-not-allowed disabled:text-stone-300"
                      >
                        &minus;
                      </button>
                      <span className="w-10 text-center font-mono text-sm text-ink">
                        {qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => ubahQty(produk.slug, qty + 1, produk.stok)}
                        disabled={qty >= produk.stok}
                        aria-label={`Tambah ${produk.nama}`}
                        className="px-3 py-2 leading-none text-stone-600 transition-colors hover:text-brand-600 disabled:cursor-not-allowed disabled:text-stone-300"
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => hapusDariKeranjang(produk.slug)}
                      className="font-mono text-[10px] tracking-[0.18em] text-stone-400 uppercase transition-colors hover:text-red-600"
                    >
                      Hapus
                    </button>

                    <span className="ml-auto font-mono text-sm font-semibold text-ink">
                      {rupiah(produk.harga * qty)}
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="border border-ink/10 bg-stone-50 p-6">
            <h2 className="font-mono text-[11px] tracking-[0.28em] text-stone-500 uppercase">
              Ringkasan
            </h2>

            <dl className="mt-6 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-stone-600">Subtotal</dt>
                <dd className="font-mono text-ink">{rupiah(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-stone-600">Berat total</dt>
                <dd className="font-mono text-ink">{beratTotal} g</dd>
              </div>
              <div className="flex justify-between border-t border-ink/10 pt-3">
                <dt className="text-stone-600">Ongkos kirim</dt>
                <dd className="text-stone-400">dihitung di checkout</dd>
              </div>
            </dl>

            <a
              href="/checkout"
              aria-disabled={adaMelebihiStok}
              className={`mt-8 block border px-8 py-3.5 text-center font-mono text-[11px] tracking-[0.22em] uppercase transition-colors ${
                adaMelebihiStok
                  ? "pointer-events-none border-stone-300 bg-stone-300 text-white"
                  : "border-brand-500 bg-brand-500 text-white hover:border-brand-600 hover:bg-brand-600"
              }`}
            >
              Lanjut ke checkout
            </a>

            <a
              href="/produk"
              className="mt-4 block text-center font-mono text-[10px] tracking-[0.18em] text-stone-500 uppercase transition-colors hover:text-brand-600"
            >
              Lanjut belanja
            </a>
          </div>
        </aside>
      </div>
    </div>
  );
}
