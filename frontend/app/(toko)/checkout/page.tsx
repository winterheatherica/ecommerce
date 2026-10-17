import type { Metadata } from "next";

import CheckoutForm from "@/app/components/checkout-form";
import { ambilAkun, urlMasukGoogle } from "@/app/lib/akun";
import { ambilSemuaProduk } from "@/app/lib/api";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const [produk, akun] = await Promise.all([ambilSemuaProduk(), ambilAkun()]);

  return (
    <CheckoutForm
      produk={produk}
      akun={akun}
      urlMasuk={urlMasukGoogle("/checkout")}
    />
  );
}
