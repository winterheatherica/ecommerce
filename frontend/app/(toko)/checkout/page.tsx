import type { Metadata } from "next";

import CheckoutForm from "@/app/components/checkout-form";
import { ambilProduk } from "@/app/lib/api";

export const metadata: Metadata = {
  title: "Checkout — Menik Store",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const produk = await ambilProduk({ limit: 100 });

  return <CheckoutForm produk={produk} />;
}
