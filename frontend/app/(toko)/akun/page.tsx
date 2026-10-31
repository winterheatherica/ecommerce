import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ambilAkun, ambilRiwayat, urlKeluar } from "@/app/lib/akun";
import { rupiah } from "@/app/data/produk";
import { statusWarna, type StatusPesanan } from "@/app/data/status-pesanan";

export const metadata: Metadata = {
  title: "Akun",
  robots: { index: false, follow: false },
};

const LABEL_PEMBELI: Record<StatusPesanan, string> = {
  PENDING: "Menunggu pembayaran",
  PAID: "Dibayar",
  SHIPPED: "Dikirim",
  DELIVERED: "Selesai",
  EXPIRED: "Kedaluwarsa",
  CANCELLED: "Dibatalkan",
};

const tanggal = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });

export default async function AkunPage() {
  const akun = await ambilAkun();
  if (!akun) redirect("/masuk?next=/akun");

  const riwayat = (await ambilRiwayat()) ?? [];
  const namaDepan = akun.user.name.split(" ")[0];

  return (
    <div className="mx-auto w-full max-w-3xl px-6 pt-32 pb-24">
      <p className="text-[15px] text-oranye-600 font-semibold">
        Akun
      </p>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Halo, {namaDepan}
          </h1>
          <p className="mt-2 text-sm text-stone-500">{akun.user.email}</p>
        </div>

        <form method="post" action={urlKeluar()}>
          <button
            type="submit"
            className="tombol-garis tombol-kecil"
          >
            Keluar
          </button>
        </form>
      </div>

      <h2 className="mt-14 text-[15px] text-stone-500 font-semibold">
        Riwayat pesanan
      </h2>

      {riwayat.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-ink/10 bg-stone-50 px-6 py-10">
          <p className="text-sm leading-relaxed text-stone-600">
            Belum ada pesanan. Pesanan yang kamu buat sambil masuk akan muncul
            di sini, begitu juga pesanan lama yang dulu dibuat dengan email{" "}
            <span className="text-ink">{akun.user.email}</span>.
          </p>
          <Link
            href="/produk"
            className="mt-6 tombol"
          >
            Lihat produk
          </Link>
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-ink/10 border-y border-ink/10">
          {riwayat.map((p) => (
            <li key={p.order_no}>
              <Link
                href={`/order/${p.order_no}`}
                className="flex flex-wrap items-center gap-x-6 gap-y-2 py-5 transition-colors hover:bg-stone-50"
              >
                <span className="min-w-40 flex-1">
                  <span className="block font-mono text-sm tracking-[0.08em] text-ink">
                    {p.order_no}
                  </span>
                  <span className="mt-1 block text-xs text-stone-500">
                    {tanggal(p.created_at)} &middot; {p.item_count} barang
                  </span>
                </span>
                <span className="text-base font-bold text-ink">{rupiah(p.total)}</span>
                <span
                  className={`rounded-full border px-3 py-1 text-[14px] font-bold ${
                    p.status === "SHIPPED" && p.delivered_at
                      ? statusWarna.DELIVERED
                      : statusWarna[p.status]
                  }`}
                >
                  {p.status === "SHIPPED" && p.delivered_at ? "Sudah sampai" : LABEL_PEMBELI[p.status]}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
