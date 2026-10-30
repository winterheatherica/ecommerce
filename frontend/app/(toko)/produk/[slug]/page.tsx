import type { Metadata } from "next";
import HargaCoret from "@/app/components/harga-coret";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import JsonLd from "@/app/components/json-ld";
import ProductBuyBox from "@/app/components/product-buy-box";
import ProductGallery from "@/app/components/product-gallery";
import { PilihanUkuran } from "@/app/components/pilihan-ukuran";
import ProductCard from "@/app/components/product-card";
import ProductReviews from "@/app/components/product-reviews";
import { ambilProduk, ambilSatuProduk, ambilSitus } from "@/app/lib/api";
import { cariKategori } from "@/app/lib/situs";
import { uraiCaraPakai } from "@/app/lib/cara-pakai";
import {
  angkaRating,
  jumlahLengkap,
  NAMA_MARKETPLACE,
  perTerbaru,
  SATUAN_RATING,
  tanggalRating,
} from "@/app/lib/rating";
import {
  rentangHarga,
  rupiah,
  varianAwal,
  type Produk,
} from "@/app/data/produk";

function teksHarga(produk: Produk): string {
  const rentang = rentangHarga(produk);
  return rentang ? `${rupiah(rentang.min)} - ${rupiah(rentang.max)}` : rupiah(produk.harga);
}
import { gambarBagiFoto, metaHalaman, skemaProduk, skemaRemah } from "@/app/lib/seo";

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

  const harga = teksHarga(produk);
  const ringkasan =
    produk.deskripsi.trim() || (cariKategori(await ambilSitus(), produk.kategori)?.ringkasan ?? "");

  return metaHalaman({
    judul: produk.nama,
    ringkasan: `${harga}. ${ringkasan}`,
    path: `/produk/${produk.slug}`,
    gambar: produk.gambar ? gambarBagiFoto(produk.gambar) : undefined,
  });
}

export default async function DetailProdukPage({ params }: Props) {
  const { slug } = await params;
  const [produk, situs] = await Promise.all([ambilSatuProduk(slug), ambilSitus()]);

  if (!produk) notFound();

  const kategori = cariKategori(situs, produk.kategori);
  const judulKategori = kategori?.judul ?? produk.kategori;
  const labelKategori = kategori?.label ?? produk.kategori;

  const habis = produk.stok === 0;
  const caraPakai = uraiCaraPakai(produk.caraPakai);
  const linkTunggal = produk.varian.length === 1 ? (produk.varian[0].shopee?.url ?? null) : null;
  const rentang = rentangHarga(produk);

  return (
    <div className="mx-auto w-full max-w-6xl px-6 pt-32 pb-24">
      <JsonLd data={skemaProduk(produk, judulKategori)} />
      <JsonLd
        data={skemaRemah([
          { nama: "Beranda", path: "/" },
          { nama: "Produk", path: "/produk" },
          {
            nama: judulKategori,
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
          {labelKategori}
        </Link>
      </nav>

      <PilihanUkuran foto={produk.foto} awal={varianAwal(produk.varian)?.slug ?? null}>
        <div className="mt-8 grid gap-12 lg:grid-cols-2 lg:gap-16">
          <ProductGallery nama={produk.nama} habis={habis} />

          <div>
            <p className="font-mono text-[13px] tracking-[0.28em] text-accent-600 uppercase">
              {judulKategori}
            </p>

            <h1 className="mt-4 text-3xl leading-tight font-semibold tracking-tight text-ink sm:text-4xl">
              {produk.nama}
            </h1>

            <RatingMarketplace produk={produk} />

            <p className="mt-6">
              {rentang ? (
                <span className="text-2xl font-semibold tracking-tight text-brand-600 sm:text-3xl">
                  {teksHarga(produk)}
                </span>
              ) : (
                <HargaCoret
                  harga={produk.harga}
                  normal={produk.hargaNormal}
                  kelasHarga="text-3xl font-semibold tracking-tight text-brand-600"
                />
              )}
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
                <dd className="mt-1 text-ink">{labelKategori}</dd>
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
      </PilihanUkuran>

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
        <ProdukSerupa kategori={produk.kategori} label={labelKategori} slug={produk.slug} />
      </Suspense>
    </div>
  );
}

const kelasLink =
  "border-b border-stone-400 font-mono text-[12px] tracking-[0.14em] text-ink uppercase transition-colors hover:border-brand-600 hover:text-brand-600";

function RatingMarketplace({ produk }: { produk: Produk }) {
  const rating = produk.rating;
  if (!rating) return null;

  const daftar = (["shopee", "tokopedia"] as const).flatMap((m) => {
    const r = m === "shopee" ? produk.ratingShopee : produk.ratingTokopedia;
    return r ? [{ m, r }] : [];
  });
  const tunggal = produk.varian.length === 1 ? produk.varian[0] : null;
  const ukuranDinilai = produk.varian.filter(
    (v) => (v.shopee?.jumlah ?? 0) + (v.tokopedia?.jumlah ?? 0) > 0,
  ).length;

  return (
    <div className="mt-4">
      <p className="text-sm leading-relaxed text-stone-600">
        <span aria-hidden="true" className="mr-2 text-base text-amber-500">
          &#9733;
        </span>
        <span className="mr-2 font-semibold text-ink">{angkaRating(rating.rata)}</span>
        {jumlahLengkap(rating.jumlah)} penilaian di{" "}
        {daftar.map(({ m }) => NAMA_MARKETPLACE[m]).join(" dan ")}
        {ukuranDinilai > 1 ? `, gabungan ${ukuranDinilai} ukuran` : ""}
      </p>
      <ul className="mt-1.5 space-y-1 text-xs text-stone-500">
        {daftar.map(({ m, r }) => {
          const per = perTerbaru(produk.varian, m);
          const link = tunggal?.[m]?.url ?? null;
          if (daftar.length === 1 && !per && !link) return null;

          return (
            <li key={m} className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span>
                {daftar.length > 1
                  ? `${NAMA_MARKETPLACE[m]} ${angkaRating(r.rata)} dari ${jumlahLengkap(r.jumlah)} ${SATUAN_RATING[m]}${per ? `, per ${tanggalRating(per)}` : ""}`
                  : per
                    ? `Angka dari ${NAMA_MARKETPLACE[m]} per ${tanggalRating(per)}`
                    : ""}
              </span>
              {link && (
                <a href={link} target="_blank" rel="noopener nofollow" className={kelasLink}>
                  Lihat di {NAMA_MARKETPLACE[m]} &#8599;
                </a>
              )}
            </li>
          );
        })}
      </ul>
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
  label,
  slug,
}: {
  kategori: Produk["kategori"];
  label: string;
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
        Pilihan lain untuk {label.toLowerCase()}
      </h2>

      <div className="mt-10 grid grid-cols-2 gap-6 lg:grid-cols-3">
        {serupa.map((p) => (
          <ProductCard key={p.slug} produk={p} />
        ))}
      </div>
    </section>
  );
}
