import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import ProductBuyBox from "@/app/components/product-buy-box";
import ProductCard from "@/app/components/product-card";
import { ambilProduk, ambilSatuProduk } from "@/app/lib/api";
import { kategoriJudul, kategoriLabel, rupiah } from "@/app/data/produk";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const produk = await ambilSatuProduk(slug);

  if (!produk) return { title: "Produk tidak ditemukan — Menik Store" };

  return {
    title: `${produk.nama} — Menik Store`,
    description: produk.deskripsi.slice(0, 155),
  };
}

export default async function DetailProdukPage({ params }: Props) {
  const { slug } = await params;
  const produk = await ambilSatuProduk(slug);

  if (!produk) notFound();

  const sekategori = await ambilProduk({ kategori: produk.kategori, limit: 4 });
  const serupa = sekategori.filter((p) => p.slug !== produk.slug).slice(0, 3);

  const habis = produk.stok === 0;

  return (
    <div className="mx-auto w-full max-w-6xl px-6 pt-32 pb-24">
      <nav
        aria-label="Breadcrumb"
        className="font-mono text-[11px] tracking-[0.18em] text-stone-500 uppercase"
      >
        <a href="/produk" className="transition-colors hover:text-brand-600">
          Produk
        </a>
        <span className="mx-2 text-stone-300">/</span>
        <a
          href={`/produk?kategori=${produk.kategori}`}
          className="transition-colors hover:text-brand-600"
        >
          {kategoriLabel[produk.kategori]}
        </a>
      </nav>

      <div className="mt-8 grid gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="relative aspect-square overflow-hidden border border-brand-100 bg-brand-50">
          {produk.gambar ? (
            <Image
              src={produk.gambar}
              alt={produk.nama}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center font-mono text-[11px] tracking-[0.2em] text-brand-300 uppercase">
              Foto produk
            </span>
          )}

          {habis && (
            <span className="absolute inset-0 flex items-center justify-center bg-white/70 font-mono text-xs tracking-[0.2em] text-ink uppercase">
              Stok habis
            </span>
          )}
        </div>

        <div>
          <p className="font-mono text-[11px] tracking-[0.28em] text-accent-600 uppercase">
            {kategoriJudul[produk.kategori]}
          </p>

          <h1 className="mt-4 text-3xl leading-tight font-semibold tracking-tight text-ink sm:text-4xl">
            {produk.nama}
          </h1>

          <p className="mt-6 text-3xl font-semibold tracking-tight text-brand-600">
            {rupiah(produk.harga)}
          </p>

          <p className="mt-3 font-mono text-[11px] tracking-[0.16em] text-stone-500 uppercase">
            {habis ? "Stok kosong" : `${produk.stok} tersedia`}
            <span className="mx-2 text-stone-300">&middot;</span>
            {produk.terjualPerBulan} terjual/bln
          </p>

          <ProductBuyBox produk={produk} />

          <div className="mt-12 border-t border-ink/10 pt-8">
            <h2 className="font-mono text-[11px] tracking-[0.28em] text-stone-500 uppercase">
              Deskripsi
            </h2>
            <p className="mt-4 leading-relaxed text-stone-600">{produk.deskripsi}</p>
          </div>

          <dl className="mt-10 grid grid-cols-2 gap-x-8 gap-y-4 border-t border-ink/10 pt-8 text-sm">
            <div>
              <dt className="font-mono text-[10px] tracking-[0.2em] text-stone-500 uppercase">
                Berat
              </dt>
              <dd className="mt-1 text-ink">{produk.beratG} g</dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] tracking-[0.2em] text-stone-500 uppercase">
                Kategori
              </dt>
              <dd className="mt-1 text-ink">{kategoriLabel[produk.kategori]}</dd>
            </div>
            <div className="col-span-2">
              <dt className="font-mono text-[10px] tracking-[0.2em] text-stone-500 uppercase">
                Keamanan
              </dt>
              <dd className="mt-1 leading-relaxed text-ink">
                Berbahan alami, non-toksik. Produk terdaftar Kemenkes RI.
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {serupa.length > 0 && (
        <section className="mt-24 border-t border-ink/10 pt-16">
          <p className="font-mono text-[11px] tracking-[0.28em] text-accent-600 uppercase">
            Masalah yang sama
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-ink">
            Pilihan lain untuk {kategoriLabel[produk.kategori].toLowerCase()}
          </h2>

          <div className="mt-10 grid grid-cols-2 gap-6 lg:grid-cols-3">
            {serupa.map((p) => (
              <ProductCard key={p.slug} produk={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
