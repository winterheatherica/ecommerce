import type { Metadata } from "next";
import { LinkWa } from "@/app/components/situs-konteks";

import OrderLookup from "@/app/components/order-lookup";
import { metaHalaman } from "@/app/lib/seo";

export const metadata: Metadata = metaHalaman({
  judul: "Lacak Pesanan",
  ringkasan:
    "Cek status pesanan Menik Store dengan nomor pesanan, mulai dari menunggu pembayaran sampai paket diterima.",
  path: "/order",
});

export default function LacakPesananPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 pt-32 pb-24">
      <p className="font-mono text-[13px] tracking-[0.28em] text-accent-600 uppercase">
        Lacak pesanan
      </p>
      <h1 className="mt-3 text-3xl leading-tight font-semibold tracking-tight text-ink sm:text-4xl">
        Di mana pesanan saya?
      </h1>
      <p className="mt-4 max-w-lg leading-relaxed text-stone-600">
        Masukkan nomor pesanan yang kamu terima setelah checkout. Bentuknya
        seperti <span className="font-mono text-ink">MNK-482917365520</span>.
        Pesanan yang dibuat saat masuk dengan akun hanya bisa dibuka setelah
        masuk dengan akun yang sama.
      </p>

      <OrderLookup />

      <p className="mt-10 text-sm leading-relaxed text-stone-500">
        Lupa nomor pesanannya?{" "}
        <LinkWa
          className="border-b border-stone-400 pb-0.5 text-ink transition-colors hover:border-brand-600 hover:text-brand-600"
        >
          Chat WhatsApp
        </LinkWa>{" "}
        dengan nama dan nomor HP yang dipakai saat memesan.
      </p>
    </div>
  );
}
