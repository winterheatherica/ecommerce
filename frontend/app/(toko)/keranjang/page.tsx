import type { Metadata } from "next";

import CartView from "@/app/components/cart-view";
import { ambilSemuaProduk } from "@/app/lib/api";

export const metadata: Metadata = {
  title: "Keranjang",
  robots: { index: false, follow: false },
};

export default async function KeranjangPage() {
  const produk = await ambilSemuaProduk();

  return <CartView produk={produk} />;
}
