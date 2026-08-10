import Image from "next/image";

import { rupiah, type Produk } from "../data/produk";

export default function ProductCard({ produk }: { produk: Produk }) {
  const habis = produk.stok === 0;

  return (
    <a href={`/produk/${produk.slug}`} className="group flex flex-col">
      <div className="relative aspect-square overflow-hidden border border-brand-100 bg-brand-50 transition-colors group-hover:border-brand-300">
        {produk.gambar ? (
          <Image
            src={produk.gambar}
            alt={produk.nama}
            fill
            sizes="(max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center font-mono text-[10px] tracking-[0.2em] text-brand-300 uppercase">
            Foto produk
          </span>
        )}

        {habis && (
          <span className="absolute inset-0 flex items-center justify-center bg-white/70 font-mono text-[11px] tracking-[0.2em] text-ink uppercase">
            Stok habis
          </span>
        )}
      </div>

      <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-ink transition-colors group-hover:text-brand-600">
        {produk.nama}
      </p>

      <div className="mt-auto flex flex-col gap-1 pt-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
        <span className="text-lg font-semibold tracking-tight text-brand-600">
          {rupiah(produk.harga)}
        </span>
        <span className="font-mono text-[10px] tracking-[0.14em] text-stone-400 uppercase">
          {produk.terjualPerBulan} terjual/bln
        </span>
      </div>
    </a>
  );
}
