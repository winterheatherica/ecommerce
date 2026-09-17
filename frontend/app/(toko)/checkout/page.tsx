import type { Metadata } from "next";

import CheckoutForm from "@/app/components/checkout-form";
import { ambilSemuaProduk } from "@/app/lib/api";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const produk = await ambilSemuaProduk();

  return <CheckoutForm produk={produk} />;
}
