"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  batalkanPesanan,
  tandaiDikirim,
  tandaiSelesai,
} from "@/app/lib/api-client";
import type { Pesanan } from "@/app/lib/api";
import { rupiah } from "@/app/data/produk";
import { statusLabel, statusWarna } from "@/app/data/status-pesanan";

const saringan: { nilai: string; label: string }[] = [
  { nilai: "", label: "Semua" },
  { nilai: "PAID", label: "Perlu dikirim" },
  { nilai: "PENDING", label: "Menunggu bayar" },
  { nilai: "SHIPPED", label: "Dikirim" },
  { nilai: "DELIVERED", label: "Selesai" },
  { nilai: "CANCELLED", label: "Dibatalkan" },
];

const tanggal = (iso: string) =>
  new Date(iso).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });

type Props = {
  pesanan: Pesanan[];
  status: string;
};

export default function AdminOrders({ pesanan, status }: Props) {
  const router = useRouter();
  const [dibuka, setDibuka] = useState<string | null>(null);
  const [resi, setResi] = useState("");
  const [memproses, setMemproses] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);

  const jalankan = async (aksi: () => Promise<void>, pesanGagal: string) => {
    setMemproses(true);
    setGalat(null);

    try {
      await aksi();
      setDibuka(null);
      router.refresh();
    } catch (err) {
      setGalat(err instanceof Error ? err.message : pesanGagal);
    } finally {
      setMemproses(false);
    }
  };

  const selesai = (orderNo: string) =>
    jalankan(() => tandaiSelesai(orderNo), "Gagal menandai selesai");

  const batal = (orderNo: string) => {
    const yakin = window.confirm(
      `Batalkan pesanan ${orderNo}? Stoknya akan dikembalikan ke katalog.`,
    );

    if (!yakin) return;

    return jalankan(() => batalkanPesanan(orderNo), "Gagal membatalkan");
  };

  const kirim = async (orderNo: string) => {
    const nomor = resi.trim();
    if (!nomor) return;

    setMemproses(true);
    setGalat(null);

    try {
      await tandaiDikirim(orderNo, nomor);
      setResi("");
      setDibuka(null);
      router.refresh();
    } catch (err) {
      setGalat(err instanceof Error ? err.message : "Gagal menandai dikirim");
    } finally {
      setMemproses(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Pesanan</h1>

      <div className="mt-6 flex flex-wrap gap-2">
        {saringan.map((s) => (
          <a
            key={s.nilai}
            href={s.nilai ? `/admin/pesanan?status=${s.nilai}` : "/admin/pesanan"}
            className={`border px-3 py-1.5 font-mono text-[11px] tracking-[0.16em] uppercase transition-colors ${
              status === s.nilai
                ? "border-brand-500 bg-brand-500 text-white"
                : "border-ink/15 bg-white text-stone-600 hover:border-brand-400 hover:text-brand-600"
            }`}
          >
            {s.label}
          </a>
        ))}
      </div>

      <p className="mt-6 font-mono text-[11px] tracking-[0.16em] text-stone-500 uppercase">
        {pesanan.length} pesanan
      </p>

      {galat && (
        <p role="alert" className="mt-4 border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {galat}
        </p>
      )}

      <div className="mt-4 divide-y divide-ink/5 border border-ink/10 bg-white">
        {pesanan.length === 0 && (
          <p className="px-6 py-16 text-center text-sm text-stone-500">
            Tidak ada pesanan dengan status ini.
          </p>
        )}

        {pesanan.map((p) => {
          const terbuka = dibuka === p.order_no;

          return (
            <div key={p.order_no}>
              <button
                type="button"
                onClick={() => {
                  setDibuka(terbuka ? null : p.order_no);
                  setResi("");
                  setGalat(null);
                }}
                aria-expanded={terbuka}
                className="flex w-full flex-wrap items-center gap-3 px-6 py-4 text-left transition-colors hover:bg-stone-50"
              >
                <span className="font-mono text-xs text-stone-500">{p.order_no}</span>
                <span className="min-w-40 flex-1 text-sm text-ink">
                  {p.customer_name}
                </span>
                <span className="font-mono text-xs text-stone-400">
                  {tanggal(p.created_at)}
                </span>
                <span className="font-mono text-sm text-ink">{rupiah(p.total)}</span>
                <span
                  className={`border px-2 py-0.5 font-mono text-[10px] tracking-[0.14em] uppercase ${statusWarna[p.status]}`}
                >
                  {statusLabel[p.status]}
                </span>
              </button>

              {terbuka && (
                <div className="border-t border-ink/5 bg-stone-50 px-6 py-6">
                  <div className="grid gap-8 sm:grid-cols-2">
                    <div>
                      <p className="font-mono text-[10px] tracking-[0.2em] text-stone-500 uppercase">
                        Alamat kirim
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-ink">
                        {p.customer_name}
                        <br />
                        {p.phone}
                        <br />
                        {p.address}
                        <br />
                        {p.dest_label}
                      </p>
                      <p className="mt-3 font-mono text-xs text-stone-500">
                        {p.courier} {p.service} &middot; {p.weight_g} g
                      </p>
                      {p.notes && (
                        <p className="mt-3 text-sm text-stone-600">
                          Catatan: {p.notes}
                        </p>
                      )}
                    </div>

                    <div>
                      <p className="font-mono text-[10px] tracking-[0.2em] text-stone-500 uppercase">
                        Isi pesanan
                      </p>
                      <ul className="mt-2 space-y-1.5">
                        {p.items.map((it) => (
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
                      <div className="mt-3 space-y-1 border-t border-ink/10 pt-3 font-mono text-sm">
                        <p className="flex justify-between text-stone-500">
                          <span>Ongkir</span>
                          <span>{rupiah(p.shipping_cost)}</span>
                        </p>
                        <p className="flex justify-between font-semibold text-ink">
                          <span>Total</span>
                          <span>{rupiah(p.total)}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {p.status === "PAID" && (
                    <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-ink/10 pt-6">
                      <input
                        value={resi}
                        onChange={(e) => setResi(e.target.value)}
                        placeholder="Nomor resi"
                        aria-label="Nomor resi"
                        disabled={memproses}
                        className="border border-ink/15 bg-white px-4 py-2.5 font-mono text-sm text-ink outline-none transition-colors placeholder:font-sans placeholder:text-stone-400 focus:border-brand-500 disabled:bg-stone-100"
                      />
                      <button
                        type="button"
                        onClick={() => kirim(p.order_no)}
                        disabled={!resi.trim() || memproses}
                        className="border border-ink bg-ink px-6 py-2.5 font-mono text-[11px] tracking-[0.18em] text-white uppercase transition-colors hover:border-brand-600 hover:bg-brand-600 disabled:cursor-not-allowed disabled:border-stone-300 disabled:bg-stone-300"
                      >
                        {memproses ? "Menyimpan..." : "Tandai dikirim"}
                      </button>
                    </div>
                  )}

                  {p.status === "SHIPPED" && (
                    <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-ink/10 pt-6">
                      <button
                        type="button"
                        onClick={() => selesai(p.order_no)}
                        disabled={memproses}
                        className="border border-emerald-600 bg-emerald-600 px-6 py-2.5 font-mono text-[11px] tracking-[0.18em] text-white uppercase transition-colors hover:border-emerald-700 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:border-stone-300 disabled:bg-stone-300"
                      >
                        {memproses ? "Menyimpan..." : "Tandai selesai"}
                      </button>
                      <span className="text-xs text-stone-500">
                        Tekan setelah paket diterima pembeli.
                      </span>
                    </div>
                  )}

                  {p.status === "PENDING" && (
                    <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-ink/10 pt-6">
                      <button
                        type="button"
                        onClick={() => batal(p.order_no)}
                        disabled={memproses}
                        className="border border-ink/20 px-6 py-2.5 font-mono text-[11px] tracking-[0.18em] text-stone-600 uppercase transition-colors hover:border-red-400 hover:text-red-600 disabled:cursor-not-allowed disabled:border-stone-200 disabled:text-stone-300"
                      >
                        {memproses ? "Membatalkan..." : "Batalkan pesanan"}
                      </button>
                      <span className="text-xs text-stone-500">
                        Stok kembali ke katalog.
                      </span>
                    </div>
                  )}

                  {p.tracking_number && (
                    <p className="mt-8 border-t border-ink/10 pt-6 font-mono text-sm text-stone-600">
                      Resi: <span className="text-ink">{p.tracking_number}</span>
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
