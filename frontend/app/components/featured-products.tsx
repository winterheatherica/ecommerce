import ProductCard from "./product-card";
import { daftarProduk } from "../data/produk";

const unggulan = daftarProduk.filter((p) => p.unggulan).slice(0, 6);

export default function FeaturedProducts() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 pb-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] tracking-[0.28em] text-accent-600 uppercase">
            Paling dicari
          </p>
          <h2 className="mt-3 text-3xl leading-tight font-semibold tracking-tight text-ink sm:text-4xl">
            Yang sering diambil orang
          </h2>
        </div>

        <a
          href="/produk"
          className="border-b border-ink/30 pb-1 font-mono text-[11px] tracking-[0.22em] text-ink uppercase transition-colors hover:border-brand-600 hover:text-brand-600"
        >
          Lihat semua &rarr;
        </a>
      </div>

      <div className="mt-12 grid grid-cols-2 gap-6 lg:grid-cols-3">
        {unggulan.map((p) => (
          <ProductCard key={p.slug} produk={p} />
        ))}
      </div>
    </section>
  );
}
