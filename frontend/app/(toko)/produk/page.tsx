import type { Metadata } from "next";

import ProductCatalog from "@/app/components/product-catalog";
import { ambilProduk } from "@/app/lib/api";

export const metadata: Metadata = {
  title: "Produk — Menik Store",
  description:
    "Katalog pengusir kucing, tikus, kecoa, cicak, dan nyamuk berbahan alami.",
};

type Props = {
  searchParams: Promise<{ kategori?: string; urut?: string }>;
};

export default async function ProdukPage({ searchParams }: Props) {
  const { kategori = "", urut = "populer" } = await searchParams;
  const produk = await ambilProduk({ limit: 100 });

  return <ProductCatalog produk={produk} kategori={kategori} urut={urut} />;
}
