import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ambilPesanan } from "@/app/lib/api";
import { rupiah } from "@/app/data/produk";
import { statusLabel, type StatusPesanan } from "@/app/data/status-pesanan";

type Props = {
  params: Promise<{ orderNo: string }>;
};

const ALUR: StatusPesanan[] = ["PENDING", "PAID", "SHIPPED", "DELIVERED"];

const LANGKAH: { status: StatusPesanan; judul: string; catatan: string }[] = [
  { status: "PENDING", judul: "Pesanan dibuat", catatan: "Menunggu pembayaran" },
  { status: "PAID", judul: "Pembayaran diterima", catatan: "Pesanan sedang disiapkan" },
  { status: "SHIPPED", judul: "Dikirim", catatan: "Paket sudah diserahkan ke kurir" },
  { status: "DELIVERED", judul: "Selesai", catatan: "Paket diterima" },
];

export const metadata: Metadata = {
  title: "Status Pesanan — Menik Store",
  robots: { index: false, follow: false },
};

const tanggal = (iso: string) =>
  new Date(iso).toLocaleString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });

export default async function StatusPesananPage({ params }: Props) {
  const { orderNo } = await params;
  const pesanan = await ambilPesanan(orderNo);

  if (!pesanan) notFound();

  const batal = pesanan.status === "EXPIRED" || pesanan.status === "CANCELLED";
  const posisi = ALUR.indexOf(pesanan.status);

  return (
    <div className="mx-auto w-full max-w-3xl px-6 pt-32 pb-24">
      <p className="font-mono text-[11px] tracking-[0.28em] text-accent-600 uppercase">
        Status pesanan
      </p>
      <h1 className="mt-3 font-mono text-2xl tracking-[0.1em] text-ink sm:text-3xl">
        {pesanan.order_no}
      </h1>
      <p className="mt-3 text-sm text-stone-500">
        Dibuat {tanggal(pesanan.created_at)} WIB
      </p>

      {batal ? (
        <div className="mt-10 border border-stone-300 bg-stone-100 px-6 py-8">
          <p className="font-mono text-[11px] tracking-[0.2em] text-stone-600 uppercase">
            {statusLabel[pesanan.status]}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-stone-600">
            {pesanan.status === "EXPIRED"
              ? "Batas waktu pembayaran sudah lewat, jadi pesanan ini otomatis dibatalkan. Kamu bisa memesan ulang kapan saja."
              : "Pesanan ini dibatalkan. Kalau ini bukan kamu yang membatalkan, hubungi kami lewat WhatsApp."}
          </p>
          <a
            href="/produk"
            className="mt-6 inline-block border border-ink px-8 py-3.5 font-mono text-[11px] tracking-[0.22em] text-ink uppercase transition-colors hover:bg-ink hover:text-white"
          >
            Pesan lagi
          </a>
        </div>
      ) : (
        <ol className="mt-12 border-l border-ink/15 pl-8">
          {LANGKAH.map((l, i) => {
            const lewat = i <= posisi;
            const sekarang = i === posisi;

            return (
              <li key={l.status} className="relative pb-10 last:pb-0">
                <span
                  aria-hidden="true"
                  className={`absolute top-1 -left-[41px] flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                    lewat ? "border-brand-500 bg-brand-500" : "border-ink/20 bg-white"
                  }`}
                >
                  {lewat && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                </span>

                <p
                  className={`font-mono text-[11px] tracking-[0.2em] uppercase ${
                    sekarang ? "text-brand-600" : lewat ? "text-ink" : "text-stone-400"
                  }`}
                >
                  {l.judul}
                </p>
                <p
                  className={`mt-1.5 text-sm ${lewat ? "text-stone-600" : "text-stone-400"}`}
                >
                  {l.catatan}
                </p>

                {sekarang && l.status === "SHIPPED" && pesanan.tracking_number && (
                  <p className="mt-3 inline-block border border-brand-200 bg-brand-50 px-4 py-2 font-mono text-sm text-brand-700">
                    {pesanan.courier} &middot; {pesanan.tracking_number}
                  </p>
                )}

                {sekarang && l.status === "PENDING" && pesanan.xendit_invoice_url && (
                  <a
                    href={pesanan.xendit_invoice_url}
                    className="mt-4 inline-block border border-brand-500 bg-brand-500 px-8 py-3 font-mono text-[11px] tracking-[0.22em] text-white uppercase transition-colors hover:border-brand-600 hover:bg-brand-600"
                  >
                    Bayar sekarang
                  </a>
                )}
              </li>
            );
          })}
        </ol>
      )}

      <div className="mt-16 grid gap-10 border-t border-ink/10 pt-10 sm:grid-cols-2">
        <div>
          <h2 className="font-mono text-[11px] tracking-[0.28em] text-stone-500 uppercase">
            Dikirim ke
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-ink">
            {pesanan.customer_name}
            <br />
            {pesanan.phone}
            <br />
            {pesanan.address}
            <br />
            {pesanan.dest_label}
          </p>
          {pesanan.payment_method && (
            <p className="mt-3 font-mono text-xs text-stone-500">
              Dibayar lewat {pesanan.payment_method}
            </p>
          )}
          <p className="mt-3 font-mono text-xs text-stone-500">
            {pesanan.courier} {pesanan.service} &middot; {pesanan.weight_g} g
            {pesanan.etd ? ` · estimasi ${pesanan.etd} hari` : ""}
          </p>
          {pesanan.notes && (
            <p className="mt-3 text-sm text-stone-500">Catatan: {pesanan.notes}</p>
          )}
        </div>

        <div>
          <h2 className="font-mono text-[11px] tracking-[0.28em] text-stone-500 uppercase">
            Rincian
          </h2>
          <ul className="mt-4 space-y-2">
            {pesanan.items.map((it) => (
              <li key={it.slug} className="flex justify-between gap-4 text-sm">
                <span className="text-stone-700">
                  {it.qty}&times; {it.name_snapshot}
                </span>
                <span className="font-mono whitespace-nowrap text-stone-500">
                  {rupiah(it.price_snapshot * it.qty)}
                </span>
              </li>
            ))}
          </ul>

          <dl className="mt-4 space-y-1.5 border-t border-ink/10 pt-4 font-mono text-sm">
            <div className="flex justify-between text-stone-500">
              <dt>Subtotal</dt>
              <dd>{rupiah(pesanan.subtotal)}</dd>
            </div>
            <div className="flex justify-between text-stone-500">
              <dt>Ongkir</dt>
              <dd>{rupiah(pesanan.shipping_cost)}</dd>
            </div>
            <div className="flex justify-between pt-1.5 text-base font-semibold text-brand-600">
              <dt>Total</dt>
              <dd>{rupiah(pesanan.total)}</dd>
            </div>
          </dl>
        </div>
      </div>

      <p className="mt-12 border-t border-ink/10 pt-8 text-sm leading-relaxed text-stone-500">
        Ada yang perlu ditanyakan soal pesanan ini?{" "}
        <a
          href="https://wa.me/6281234567890"
          className="border-b border-stone-400 pb-0.5 text-ink transition-colors hover:border-brand-600 hover:text-brand-600"
        >
          Chat WhatsApp
        </a>
        , sebutkan nomor pesanannya.
      </p>
    </div>
  );
}
