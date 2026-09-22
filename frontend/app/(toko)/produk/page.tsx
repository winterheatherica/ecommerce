import type { Metadata } from "next";
import { Suspense } from "react";

import JsonLd from "@/app/components/json-ld";
import ProductCatalog from "@/app/components/product-catalog";
import { ambilSemuaProduk } from "@/app/lib/api";
import {
  GRUP,
  grupDariKategori,
  grupSah,
  kategoriJudul,
  kategoriJudulSeo,
  kategoriRingkasan,
  kategoriSah,
} from "@/app/data/produk";
import { metaHalaman, skemaDaftarProduk, skemaRemah } from "@/app/lib/seo";

const JUDUL_SEMUA = "Semua Produk Pengusir Hama Alami";
const RINGKASAN_SEMUA =
  "Katalog pengusir kucing, tikus, kecoa, cicak, dan nyamuk berbahan dasar tumbuhan, lengkap dengan harga dan stok terkini.";

type Props = {
  searchParams: Promise<{ kategori?: string; grup?: string; urut?: string }>;
};

function baca(q: { kategori?: string; grup?: string }) {
  const kategori = kategoriSah(q.kategori ?? "");
  const grup = kategori ? grupDariKategori(kategori) : grupSah(q.grup ?? "");

  return { kategori, grup };
}

function jalan(kategori: string, grup: string): string {
  if (kategori) return `/produk?kategori=${kategori}`;
  if (grup) return `/produk?grup=${grup}`;
  return "/produk";
}

export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  const { kategori, grup } = baca(await searchParams);

  if (kategori) {
    return metaHalaman({
      judul: kategoriJudulSeo[kategori],
      ringkasan: kategoriRingkasan[kategori],
      path: jalan(kategori, ""),
    });
  }

  if (grup) {
    return metaHalaman({
      judul: GRUP[grup].judul,
      ringkasan: GRUP[grup].ringkasan,
      path: jalan("", grup),
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
  const { kategori, grup } = baca(q);
  const produk = await ambilSemuaProduk();

  const tampil = kategori
    ? produk.filter((p) => p.kategori === kategori)
    : grup
      ? produk.filter((p) => grupDariKategori(p.kategori) === grup)
      : produk;

  const judul = kategori
    ? kategoriJudul[kategori]
    : grup
      ? GRUP[grup].judul
      : "Semua produk";

  const remah = [
    { nama: "Beranda", path: "/" },
    { nama: "Produk", path: "/produk" },
    ...(grup ? [{ nama: GRUP[grup].judul, path: jalan("", grup) }] : []),
    ...(kategori
      ? [{ nama: kategoriJudul[kategori], path: jalan(kategori, "") }]
      : []),
  ];

  return (
    <>
      <JsonLd data={skemaDaftarProduk(tampil, judul)} />
      <JsonLd data={skemaRemah(remah)} />
      <ProductCatalog
        produk={produk}
        kategori={kategori}
        grup={grup}
        urut={q.urut ?? "populer"}
      />
    </>
  );
}
