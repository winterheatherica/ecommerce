import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import PaymentPicker from "@/app/components/payment-picker";
import { ambilPesanan } from "@/app/lib/api";
import { rupiah } from "@/app/data/produk";

type Props = {
  params: Promise<{ orderNo: string }>;
};

export const metadata: Metadata = {
  title: "Pembayaran",
  robots: { index: false, follow: false },
};

const jam = (iso: string) =>
  new Date(iso).toLocaleString("id-ID", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });

export default async function BayarPage({ params }: Props) {
  const { orderNo } = await params;
  const pesanan = await ambilPesanan(orderNo);

  if (!pesanan) notFound();

  if (pesanan.status !== "PENDING") {
    redirect(`/order/${pesanan.order_no}`);
  }

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-xl flex-col justify-center px-6 py-16">
      <div className="border border-ink/10 bg-white p-8 shadow-sm sm:p-10">
        <p className="font-mono text-[10px] tracking-[0.28em] text-accent-600 uppercase">
          Pembayaran
        </p>
        <p className="mt-3 text-sm leading-relaxed text-stone-600">
          Pilih metode pembayaran, lalu kamu akan diarahkan ke halaman
          pembayaran yang aman.
        </p>

        <div className="mt-8 border-t border-ink/10 pt-8">
          <p className="font-mono text-[10px] tracking-[0.2em] text-stone-500 uppercase">
            Tagihan untuk
          </p>
          <p className="mt-2 font-mono text-lg tracking-[0.1em] text-ink">
            {pesanan.order_no}
          </p>
          <p className="mt-1 text-sm text-stone-600">{pesanan.customer_name}</p>

          <p className="mt-6 text-4xl font-semibold tracking-tight text-brand-600">
            {rupiah(pesanan.total)}
          </p>

          {pesanan.expires_at && (
            <p className="mt-3 font-mono text-[11px] tracking-[0.16em] text-stone-500 uppercase">
              Berlaku sampai {jam(pesanan.expires_at)} WIB
            </p>
          )}
        </div>

        <PaymentPicker orderNo={pesanan.order_no} total={pesanan.total} />
      </div>
    </main>
  );
}
