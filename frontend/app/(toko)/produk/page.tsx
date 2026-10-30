import type { Metadata } from "next";
import { Suspense } from "react";

import JsonLd from "@/app/components/json-ld";
import ProductCatalog from "@/app/components/product-catalog";
import { ambilSemuaProduk, ambilSitus } from "@/app/lib/api";
import type { Produk } from "@/app/data/produk";
import { metaHalaman, skemaDaftarProduk, skemaRemah } from "@/app/lib/seo";
import {
  cariGrup,
  cariKategori,
  grupDariKategori,
  type GrupKategori,
  type InfoKategori,
  type Situs,
} from "@/app/lib/situs";

const JUDUL_SEMUA = "Semua Produk Pengusir Hama Alami";
const RINGKASAN_SEMUA =
  "Katalog pengusir kucing, tikus, kecoa, cicak, dan nyamuk berbahan dasar alami, lengkap dengan harga dan stok terkini.";

type Props = {
  searchParams: Promise<{ kategori?: string; grup?: string; urut?: string }>;
};

function baca(
  situs: Situs,
  q: { kategori?: string; grup?: string },
): { kategori?: InfoKategori; grup?: GrupKategori } {
  const kategori = cariKategori(situs, q.kategori ?? "");
  const grup = cariGrup(situs, kategori ? kategori.grup : (q.grup ?? ""));

  return { kategori, grup };
}

function jalan(kategori: string, grup: string): string {
  if (kategori) return `/produk?kategori=${kategori}`;
  if (grup) return `/produk?grup=${grup}`;
  return "/produk";
}

function saring(situs: Situs, produk: Produk[], kategori?: string, grup?: string): Produk[] {
  if (kategori) return produk.filter((p) => p.kategori === kategori);
  if (grup) return produk.filter((p) => grupDariKategori(situs, p.kategori) === grup);
  return produk;
}

export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  const { kategori, grup } = baca(await ambilSitus(), await searchParams);

  if (kategori) {
    return metaHalaman({
      judul: kategori.judulSeo,
      ringkasan: kategori.ringkasan,
      path: jalan(kategori.slug, ""),
    });
  }

  if (grup) {
    return metaHalaman({
      judul: grup.judul,
      ringkasan: grup.ringkasan,
      path: jalan("", grup.slug),
    });
  }

  return metaHalaman({
    judul: JUDUL_SEMUA,
    ringkasan: RINGKASAN_SEMUA,
    path: "/produk",
  });
}

function KerangkaKatalog() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 pt-32 pb-24">
      <div className="h-3 w-24 animate-pulse bg-stone-200" />
      <div className="mt-5 h-9 w-72 animate-pulse bg-stone-200" />
      <div className="mt-12 grid grid-cols-2 gap-6 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i}>
            <div className="aspect-square animate-pulse bg-stone-200" />
            <div className="mt-4 h-3 w-full animate-pulse bg-stone-200" />
            <div className="mt-2 h-3 w-2/3 animate-pulse bg-stone-200" />
            <div className="mt-4 h-5 w-24 animate-pulse bg-stone-200" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function ProdukPage({ searchParams }: Props) {
  const q = await searchParams;

  return (
    <Suspense key={JSON.stringify(q)} fallback={<KerangkaKatalog />}>
      <IsiKatalog q={q} />
    </Suspense>
  );
}

async function IsiKatalog({
  q,
}: {
  q: { kategori?: string; grup?: string; urut?: string };
}) {
  const [produk, situs] = await Promise.all([ambilSemuaProduk(), ambilSitus()]);
  const { kategori, grup } = baca(situs, q);
  const tampil = saring(situs, produk, kategori?.slug, grup?.slug);

  const judul = kategori ? kategori.judul : grup ? grup.judul : "Semua produk";

  const remah = [
    { nama: "Beranda", path: "/" },
    { nama: "Produk", path: "/produk" },
    ...(grup ? [{ nama: grup.judul, path: jalan("", grup.slug) }] : []),
    ...(kategori ? [{ nama: kategori.judul, path: jalan(kategori.slug, "") }] : []),
  ];

  return (
    <>
      <JsonLd data={skemaDaftarProduk(tampil, judul)} />
      <JsonLd data={skemaRemah(remah)} />
      <ProductCatalog
        produk={produk}
        kategori={kategori?.slug ?? ""}
        grup={grup?.slug ?? ""}
        urut={q.urut ?? "populer"}
      />
    </>
  );
}
