import AdminSweepButton from "@/app/components/admin-sweep-button";
import Link from "next/link";
import { rupiah } from "@/app/data/produk";
import { statusLabel, statusWarna } from "@/app/data/status-pesanan";
import { ambilDaftarPesanan, ambilProdukAdmin } from "@/app/lib/api";

const AMBANG_STOK_MENIPIS = 10;
const TAMPIL_STOK = 12;

export default async function AdminRingkasanPage() {
  const [daftarProduk, daftarPesanan] = await Promise.all([
    ambilProdukAdmin(),
    ambilDaftarPesanan(),
  ]);

  const perluDikirim = daftarPesanan.filter((p) => p.status === "PAID");
  const menungguBayar = daftarPesanan.filter((p) => p.status === "PENDING");
  const stokMenipis = daftarProduk
    .filter((p) => p.stok <= AMBANG_STOK_MENIPIS)
    .sort((a, b) => a.stok - b.stok);

  const terbaru = [...daftarPesanan]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 5);

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Ringkasan</h1>
      <p className="mt-1 text-sm text-stone-500">
        Dua hal yang biasanya perlu diurus hari ini.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/pesanan?status=PAID"
          className="border border-ink/10 bg-white p-6 transition-colors hover:border-brand-400"
        >
          <p className="font-mono text-[11px] tracking-[0.2em] text-stone-500 uppercase">
            Perlu dikirim
          </p>
          <p className="mt-3 text-4xl font-semibold tracking-tight text-brand-600">
            {perluDikirim.length}
          </p>
          <p className="mt-2 text-sm text-stone-500">
            Sudah dibayar, belum ada resi.
          </p>
        </Link>

        <Link
          href="/admin/produk"
          className="border border-ink/10 bg-white p-6 transition-colors hover:border-brand-400"
        >
          <p className="font-mono text-[11px] tracking-[0.2em] text-stone-500 uppercase">
            Stok menipis
          </p>
          <p className="mt-3 text-4xl font-semibold tracking-tight text-ink">
            {stokMenipis.length}
          </p>
          <p className="mt-2 text-sm text-stone-500">
            Sisa {AMBANG_STOK_MENIPIS} unit atau kurang.
          </p>
        </Link>
      </div>

      {stokMenipis.length > 0 && (
        <div className="mt-10 border border-ink/10 bg-white">
          <div className="border-b border-ink/10 px-6 py-4">
            <h2 className="text-sm font-medium text-ink">Stok yang perlu diisi</h2>
          </div>
          <ul className="divide-y divide-ink/5">
            {stokMenipis.slice(0, TAMPIL_STOK).map((p) => (
              <li key={p.slug} className="flex items-center justify-between gap-4 px-6 py-3">
                <span className="text-sm text-stone-700">{p.nama}</span>
                <span
                  className={`font-mono text-sm ${
                    p.stok === 0 ? "text-red-600" : "text-amber-600"
                  }`}
                >
                  {p.stok}
                </span>
              </li>
            ))}
          </ul>
          {stokMenipis.length > TAMPIL_STOK && (
            <div className="border-t border-ink/10 px-6 py-3">
              <Link
                href="/admin/produk"
                className="font-mono text-[11px] tracking-[0.18em] text-stone-500 uppercase transition-colors hover:text-brand-600"
              >
                {stokMenipis.length - TAMPIL_STOK} produk lainnya &rarr;
              </Link>
            </div>
          )}
        </div>
      )}

      <div className="mt-10 border border-ink/10 bg-white">
        <div className="flex items-center justify-between border-b border-ink/10 px-6 py-4">
          <h2 className="text-sm font-medium text-ink">Pesanan terbaru</h2>
          <Link
            href="/admin/pesanan"
            className="font-mono text-[11px] tracking-[0.2em] text-brand-600 uppercase"
          >
            Semua &rarr;
          </Link>
        </div>
        <ul className="divide-y divide-ink/5">
          {terbaru.map((p) => (
            <li key={p.order_no} className="flex flex-wrap items-center gap-3 px-6 py-4">
              <span className="font-mono text-xs text-stone-500">{p.order_no}</span>
              <span className="flex-1 text-sm text-ink">{p.customer_name}</span>
              <span className="font-mono text-sm text-ink">{rupiah(p.total)}</span>
              <span
                className={`border px-2 py-0.5 font-mono text-[10px] tracking-[0.14em] uppercase ${statusWarna[p.status]}`}
              >
                {statusLabel[p.status]}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <AdminSweepButton />

      {menungguBayar.length > 0 && (
        <p className="mt-6 text-sm text-stone-500">
          {menungguBayar.length} pesanan masih menunggu pembayaran. Biarkan
          saja, nanti kedaluwarsa sendiri.
        </p>
      )}
    </div>
  );
}
