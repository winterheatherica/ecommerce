import type { Metadata } from "next";

import ProductCatalog from "../components/product-catalog";

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

  return <ProductCatalog kategori={kategori} urut={urut} />;
}
