import type { Metadata } from "next";

import CartView from "@/app/components/cart-view";
import { ambilProduk } from "@/app/lib/api";

export const metadata: Metadata = {
  title: "Keranjang — Menik Store",
  robots: { index: false, follow: false },
};

export default async function KeranjangPage() {
  const produk = await ambilProduk({ limit: 100 });

  return <CartView produk={produk} />;
}
