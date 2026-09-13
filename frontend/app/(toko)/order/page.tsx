import type { Metadata } from "next";

import OrderLookup from "@/app/components/order-lookup";

export const metadata: Metadata = {
  title: "Lacak Pesanan — Menik Store",
  description: "Cek status pesanan dengan nomor pesanan.",
};

export default function LacakPesananPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 pt-32 pb-24">
      <p className="font-mono text-[11px] tracking-[0.28em] text-accent-600 uppercase">
        Lacak pesanan
      </p>
      <h1 className="mt-3 text-3xl leading-tight font-semibold tracking-tight text-ink sm:text-4xl">
        Di mana pesanan saya?
      </h1>
      <p className="mt-4 max-w-lg leading-relaxed text-stone-600">
        Masukkan nomor pesanan yang kamu terima setelah checkout. Bentuknya
        seperti <span className="font-mono text-ink">MNK-7K3QX9F2</span>.
      </p>

      <OrderLookup />

      <p className="mt-10 text-sm leading-relaxed text-stone-500">
        Lupa nomor pesanannya?{" "}
        <a
          href="https://wa.me/6281234567890"
          className="border-b border-stone-400 pb-0.5 text-ink transition-colors hover:border-brand-600 hover:text-brand-600"
        >
          Chat WhatsApp
        </a>{" "}
        dengan nama dan nomor HP yang dipakai saat memesan.
      </p>
    </div>
  );
}
