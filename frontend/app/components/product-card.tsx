import Image from "next/image";
import HargaCoret from "@/app/components/harga-coret";
import Link from "next/link";

import type { Produk } from "../data/produk";
import { angkaRating, jumlahSingkat } from "../lib/rating";

export default function ProductCard({ produk }: { produk: Produk }) {
  const habis = produk.stok === 0;
  const sumber = [produk.ratingShopee && "Shopee", produk.ratingTokopedia && "Tokopedia"]
    .filter(Boolean)
    .join(" & ");

  return (
    <Link href={`/produk/${produk.slug}`} className="group flex flex-col">
      <div className="relative aspect-square overflow-hidden rounded-2xl border border-brand-100 bg-brand-50 transition-colors group-hover:border-brand-300">
        {produk.gambar ? (
          <Image
            src={produk.gambar}
            alt={produk.nama}
            fill
            sizes="(max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-[14px] text-brand-300 font-semibold">
            Foto produk
          </span>
        )}

        {habis && (
          <span className="absolute inset-0 flex items-center justify-center bg-white/60">
            <span className="rounded-full bg-ink px-4 py-1.5 text-[14px] font-bold text-white">Stok habis</span>
          </span>
        )}
      </div>

      <p className="mt-3 line-clamp-2 text-[15px] leading-snug font-semibold text-ink transition-colors group-hover:text-brand-600 sm:text-base lg:text-[19px]">
        {produk.nama}
      </p>

      {produk.rating && (
        <p className="mt-1.5 flex flex-wrap items-baseline gap-x-1.5 text-[13px] font-medium text-stone-500 lg:text-[15px]">
          <span className="sr-only">Rating di {sumber}</span>
          <span aria-hidden="true" className="text-amber-500">
            &#9733;
          </span>
          <span className="font-bold text-ink">{angkaRating(produk.rating.rata)}</span>
          <span>({jumlahSingkat(produk.rating.jumlah)})</span>
          <span aria-hidden="true">di {sumber}</span>
        </p>
      )}

      <div className="mt-auto flex flex-col gap-1 pt-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
        <HargaCoret
          harga={produk.harga}
          normal={produk.hargaNormal}
          kelasHarga="text-lg font-extrabold tracking-tight text-brand-600 lg:text-[23px]"
          kecil
        />
        <span className="text-[13px] font-medium text-stone-500 lg:text-[15px]">
          {produk.terjualPerBulan} terjual/bln
        </span>
      </div>
    </Link>
  );
}
