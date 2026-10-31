import ProductCard from "./product-card";
import Link from "next/link";
import type { Produk } from "@/app/data/produk";

export default function FeaturedProducts({ produk }: { produk: Produk[] }) {
  const unggulan = produk.filter((p) => p.unggulan).slice(0, 6);

  if (unggulan.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-6xl px-6 pb-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[15px] text-oranye-600 font-semibold">
            Paling dicari
          </p>
          <h2 className="mt-3 text-3xl leading-tight font-semibold tracking-tight text-ink sm:text-4xl">
            Yang sering dibeli orang
          </h2>
        </div>

        <Link
          href="/produk"
          className="tombol-garis tombol-kecil"
        >
          Lihat semua
        </Link>
      </div>

      <div className="mt-12 grid grid-cols-2 gap-6 lg:grid-cols-3">
        {unggulan.map((p) => (
          <ProductCard key={p.slug} produk={p} />
        ))}
      </div>
    </section>
  );
}
