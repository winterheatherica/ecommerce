import type { Metadata } from "next";
import HargaCoret from "@/app/components/harga-coret";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import JsonLd from "@/app/components/json-ld";
import { PUNYA_GAMBAR, urlGambarBagi } from "@/app/data/gambar";
import ProductBuyBox from "@/app/components/product-buy-box";
import ProductCard from "@/app/components/product-card";
import ProductReviews from "@/app/components/product-reviews";
import { ambilProduk, ambilSatuProduk } from "@/app/lib/api";
import { uraiCaraPakai } from "@/app/lib/cara-pakai";
import { angkaRating, jumlahLengkap, perTerbaru, tanggalRating } from "@/app/lib/rating";
import {
  kategoriJudul,
  kategoriLabel,
  kategoriRingkasan,
  rupiah,
  type Produk,
} from "@/app/data/produk";
import { metaHalaman, skemaProduk, skemaRemah } from "@/app/lib/seo";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const produk = await ambilSatuProduk(slug);

  if (!produk) {
    return {
      title: "Produk tidak ditemukan",
      robots: { index: false, follow: true },
    };
  }

  const harga = rupiah(produk.harga);
  const ringkasan =
    produk.deskripsi.trim() || kategoriRingkasan[produk.kategori];

  return metaHalaman({
    judul: produk.nama,
    ringkasan: `${harga}. ${ringkasan}`,
    path: `/produk/${produk.slug}`,
    gambar: PUNYA_GAMBAR.has(produk.slug)
      ? { url: urlGambarBagi(produk.slug), lebar: 1200, tinggi: 630 }
      : undefined,
  });
}

export default async function DetailProdukPage({ params }: Props) {
  const { slug } = await params;
  const produk = await ambilSatuProduk(slug);

  if (!produk) notFound();

  const habis = produk.stok === 0;
  const caraPakai = uraiCaraPakai(produk.caraPakai);
  const rating = produk.ratingShopee;
  const ukuranDinilai = produk.varian.filter((v) => (v.shopee?.jumlah ?? 0) > 0).length;
  const linkTunggal = produk.varian.length === 1 ? (produk.varian[0].shopee?.url ?? null) : null;
  const perShopee = perTerbaru(produk.varian);

  return (
    <div className="mx-auto w-full max-w-6xl px-6 pt-32 pb-24">
      <JsonLd data={skemaProduk(produk)} />
      <JsonLd
        data={skemaRemah([
          { nama: "Beranda", path: "/" },
          { nama: "Produk", path: "/produk" },
          {
            nama: kategoriJudul[produk.kategori],
            path: `/produk?kategori=${produk.kategori}`,
          },
          { nama: produk.nama, path: `/produk/${produk.slug}` },
        ])}
      />

      <nav
        aria-label="Breadcrumb"
        className="font-mono text-[13px] tracking-[0.18em] text-stone-500 uppercase"
      >
        <Link href="/produk" className="transition-colors hover:text-brand-600">
          Produk
        </Link>
        <span className="mx-2 text-stone-300">/</span>
        <Link
          href={`/produk?kategori=${produk.kategori}`}
          className="transition-colors hover:text-brand-600"
        >
          {kategoriLabel[produk.kategori]}
        </Link>
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
            <span className="absolute inset-0 flex items-center justify-center font-mono text-[13px] tracking-[0.2em] text-brand-300 uppercase">
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
          <p className="font-mono text-[13px] tracking-[0.28em] text-accent-600 uppercase">
            {kategoriJudul[produk.kategori]}
          </p>

          <h1 className="mt-4 text-3xl leading-tight font-semibold tracking-tight text-ink sm:text-4xl">
            {produk.nama}
          </h1>

          {rating && (
            <div className="mt-4">
              <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm text-stone-600">
                <span aria-hidden="true" className="text-base text-amber-500">
                  &#9733;
                </span>
                <span className="font-semibold text-ink">{angkaRating(rating.rata)}</span>
                <span>
                  {jumlahLengkap(rating.jumlah)} penilaian di Shopee
                  {ukuranDinilai > 1 ? `, gabungan ${ukuranDinilai} ukuran` : ""}
                </span>
                {linkTunggal && (
                  <a
                    href={linkTunggal}
                    target="_blank"
                    rel="noopener nofollow"
                    className="border-b border-stone-400 font-mono text-[12px] tracking-[0.14em] text-ink uppercase transition-colors hover:border-brand-600 hover:text-brand-600"
                  >
                    Lihat di Shopee &#8599;
                  </a>
                )}
              </p>
              {perShopee && (
                <p className="mt-1 text-xs text-stone-400">
                  Angka dari Shopee per {tanggalRating(perShopee)}
                </p>
              )}
            </div>
          )}

          <p className="mt-6">
            <HargaCoret
              harga={produk.harga}
              normal={produk.hargaNormal}
              kelasHarga="text-3xl font-semibold tracking-tight text-brand-600"
            />
          </p>

          <p className="mt-3 font-mono text-[13px] tracking-[0.16em] text-stone-500 uppercase">
            {habis ? "Stok kosong" : `${produk.stok} tersedia`}
            <span className="mx-2 text-stone-300">&middot;</span>
            {produk.terjualPerBulan} terjual/bln
          </p>

          <ProductBuyBox produk={produk} />

          <div className="mt-12 border-t border-ink/10 pt-8">
            <h2 className="font-mono text-[13px] tracking-[0.28em] text-stone-500 uppercase">
              Deskripsi
            </h2>
            <p className="mt-4 leading-relaxed text-stone-600">{produk.deskripsi}</p>
          </div>

          {caraPakai.length > 0 && (
            <div className="mt-10 border-t border-ink/10 pt-8">
              <h2 className="font-mono text-[13px] tracking-[0.28em] text-stone-500 uppercase">
                Cara pakai
              </h2>
              {caraPakai.map((bagian, i) => {
                const Daftar = bagian.poin ? "ul" : "ol";

                return (
                  <div key={i} className="mt-5">
                    {bagian.judul && (
                      <h3 className="text-sm font-semibold text-ink">{bagian.judul}</h3>
                    )}
                    <Daftar
                      className={`mt-2 space-y-2 pl-5 leading-relaxed text-stone-600 marker:text-stone-400 ${
                        bagian.poin ? "list-disc" : "list-decimal"
                      }`}
                    >
                      {bagian.isi.map((langkah, j) => (
                        <li key={j} className="pl-1">
                          {langkah}
                        </li>
                      ))}
                    </Daftar>
                  </div>
                );
              })}
            </div>
          )}

          <dl className="mt-10 grid grid-cols-2 gap-x-8 gap-y-4 border-t border-ink/10 pt-8 text-sm">
            <div>
              <dt className="font-mono text-[12px] tracking-[0.2em] text-stone-500 uppercase">
                Berat
              </dt>
              <dd className="mt-1 text-ink">{produk.beratG} g</dd>
            </div>
            <div>
              <dt className="font-mono text-[12px] tracking-[0.2em] text-stone-500 uppercase">
                Kategori
              </dt>
              <dd className="mt-1 text-ink">{kategoriLabel[produk.kategori]}</dd>
            </div>
            <div className="col-span-2">
              <dt className="font-mono text-[12px] tracking-[0.2em] text-stone-500 uppercase">
                Keamanan
              </dt>
              <dd className="mt-1 leading-relaxed text-ink">
                Berbahan dasar alami. Simpan di luar jangkauan anak dan
                jangan sampai termakan.
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {produk.ulasan && produk.ulasan.length > 0 && (
        <ProductReviews
          produkSlug={produk.slug}
          ulasan={produk.ulasan}
          ringkasan={produk.ringkasanUlasan}
          ukuranPilihan={produk.varian.map((v) => ({ slug: v.slug, label: v.label }))}
          tampilkanUkuran={produk.varian.length > 1}
          linkShopee={linkTunggal}
          linkPerUkuran={Object.fromEntries(
            produk.varian.map((v) => [v.slug, v.shopee?.url ?? null]),
          )}
        />
      )}

      <Suspense fallback={<KerangkaSerupa />}>
        <ProdukSerupa kategori={produk.kategori} slug={produk.slug} />
      </Suspense>
    </div>
  );
}

function KerangkaSerupa() {
  return (
    <section className="mt-24 border-t border-ink/10 pt-16">
      <div className="h-3 w-32 animate-pulse bg-stone-200" />
      <div className="mt-4 h-7 w-64 animate-pulse bg-stone-200" />
      <div className="mt-10 grid grid-cols-2 gap-6 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i}>
            <div className="aspect-square animate-pulse bg-stone-200" />
            <div className="mt-4 h-3 w-full animate-pulse bg-stone-200" />
            <div className="mt-2 h-3 w-2/3 animate-pulse bg-stone-200" />
          </div>
        ))}
      </div>
    </section>
  );
}

async function ProdukSerupa({
  kategori,
  slug,
}: {
  kategori: Produk["kategori"];
  slug: string;
}) {
  const sekategori = await ambilProduk({ kategori, limit: 4 });
  const serupa = sekategori.filter((p) => p.slug !== slug).slice(0, 3);

  if (serupa.length === 0) return null;

  return (
    <section className="mt-24 border-t border-ink/10 pt-16">
      <p className="font-mono text-[13px] tracking-[0.28em] text-accent-600 uppercase">
        Masalah yang sama
      </p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-ink">
        Pilihan lain untuk {kategoriLabel[kategori].toLowerCase()}
      </h2>

      <div className="mt-10 grid grid-cols-2 gap-6 lg:grid-cols-3">
        {serupa.map((p) => (
          <ProductCard key={p.slug} produk={p} />
        ))}
      </div>
    </section>
  );
}
