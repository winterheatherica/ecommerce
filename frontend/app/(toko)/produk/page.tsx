import type { Metadata } from "next";

import JsonLd from "@/app/components/json-ld";
import ProductCatalog from "@/app/components/product-catalog";
import { ambilSemuaProduk } from "@/app/lib/api";
import {
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
  searchParams: Promise<{ kategori?: string; urut?: string }>;
};

function jalanKategori(kategori: string): string {
  return kategori ? `/produk?kategori=${kategori}` : "/produk";
}

export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  const { kategori = "" } = await searchParams;
  const sah = kategoriSah(kategori);

  if (!sah) {
    return metaHalaman({
      judul: JUDUL_SEMUA,
      ringkasan: RINGKASAN_SEMUA,
      path: "/produk",
    });
  }

  return metaHalaman({
    judul: kategoriJudulSeo[sah],
    ringkasan: kategoriRingkasan[sah],
    path: jalanKategori(sah),
  });
}

export default async function ProdukPage({ searchParams }: Props) {
  const { kategori = "", urut = "populer" } = await searchParams;
  const sah = kategoriSah(kategori);
  const produk = await ambilSemuaProduk();

  const tampil = sah ? produk.filter((p) => p.kategori === sah) : produk;
  const judul = sah ? kategoriJudul[sah] : "Semua produk";

  return (
    <>
      <JsonLd data={skemaDaftarProduk(tampil, judul)} />
      <JsonLd
        data={skemaRemah([
          { nama: "Beranda", path: "/" },
          { nama: "Produk", path: "/produk" },
          ...(sah ? [{ nama: kategoriJudul[sah], path: jalanKategori(sah) }] : []),
        ])}
      />
      <ProductCatalog produk={produk} kategori={sah} urut={urut} />
    </>
  );
}
