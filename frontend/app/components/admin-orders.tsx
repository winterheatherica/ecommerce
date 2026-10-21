"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  batalkanPesanan,
  gantiResi,
  tandaiDikirim,
  tandaiLunas,
  tandaiSelesai,
} from "@/app/lib/api-client";
import CopyButton from "./copy-button";
import RiwayatKurir from "./riwayat-kurir";
import type { Pesanan } from "@/app/lib/api";
import { tautanWa } from "@/app/lib/wa";
import { namaLayanan } from "@/app/lib/kurir";
import {
  barisRiwayat,
  batasKomplain,
  posisiTerakhir,
  sejak,
  tanpaPergerakan,
  waktuKurir,
} from "@/app/lib/lacak";
import { rupiah } from "@/app/data/produk";
import { statusLabel, statusWarna } from "@/app/data/status-pesanan";

function ringkasLacak(p: Pesanan): { teks: string; warna: string } {
  if (p.delivered_at) {
    return {
      teks: `Sampai ${waktuKurir(p.delivered_at)} · otomatis selesai ${waktuKurir(batasKomplain(p.delivered_at))}`,
      warna: "text-emerald-700",
    };
  }

  const posisi = p.tracking ? posisiTerakhir(p.tracking) : null;

  if (tanpaPergerakan(p)) {
    const sejakKapan = posisi?.at ?? p.shipped_at;
    return {
      teks: `Tidak ada pergerakan sejak ${sejakKapan ? waktuKurir(sejakKapan) : "dikirim"}. Cek ke kurir.`,
      warna: "text-amber-700",
    };
  }

  if (posisi) {
    return {
      teks: `Posisi terakhir: ${posisi.teks}${posisi.at ? ` · ${waktuKurir(posisi.at)}` : ""}`,
      warna: "text-stone-500",
    };
  }

  if (p.tracking_error) {
    return { teks: `Lacak gagal: ${p.tracking_error}`, warna: "text-red-600" };
  }

  return { teks: "Belum ada data dari kurir", warna: "text-stone-400" };
}

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

  const kirimResi = (p: Pesanan) => {
    const pesan = [
      `Halo ${p.customer_name}, pesanan ${p.order_no} sudah kami kirim.`,
      "",
      `Kurir: ${namaLayanan(p.courier, p.service)}`,
      `No. resi: ${p.tracking_number}`,
      "",
      `Pantau posisinya di sini: ${window.location.origin}/order/${p.order_no}`,
      "",
      "Terima kasih sudah belanja di Menik Store.",
    ].join("\n");

    const tautan = tautanWa(p.phone, pesan);

    if (!tautan) {
      setGalat(`Nomor ${p.phone} tidak bisa dibuka di WhatsApp.`);
      return;
    }

    setGalat(null);
    window.open(tautan, "_blank", "noopener,noreferrer");
  };

  const batal = (orderNo: string) => {
    const yakin = window.confirm(
      `Batalkan pesanan ${orderNo}? Stoknya akan dikembalikan ke katalog.`,
    );

    if (!yakin) return;

    return jalankan(() => batalkanPesanan(orderNo), "Gagal membatalkan");
  };

  const lunas = (orderNo: string) => {
    const yakin = window.confirm(
      `Tandai pesanan ${orderNo} sudah lunas? Pakai ini hanya kalau uangnya benar-benar sudah masuk ke rekening.`,
    );

    if (!yakin) return;

    return jalankan(
      () => tandaiLunas(orderNo, "TRANSFER MANUAL"),
      "Gagal menandai lunas",
    );
  };

  const simpanResi = async (
    aksi: (nomor: string) => Promise<void>,
    pesanGagal: string,
  ) => {
    const nomor = resi.trim();
    if (!nomor) return;

    setMemproses(true);
    setGalat(null);

    try {
      await aksi(nomor);
      setResi("");
      setDibuka(null);
      router.refresh();
    } catch (err) {
      setGalat(err instanceof Error ? err.message : pesanGagal);
    } finally {
      setMemproses(false);
    }
  };

  const kirim = (orderNo: string) =>
    simpanResi((nomor) => tandaiDikirim(orderNo, nomor), "Gagal menandai dikirim");

  const ganti = (orderNo: string) =>
    simpanResi((nomor) => gantiResi(orderNo, nomor), "Gagal mengganti resi");

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Pesanan</h1>

      <div className="mt-6 flex flex-wrap gap-2">
        {saringan.map((s) => (
          <a
            key={s.nilai}
            href={s.nilai ? `/admin/pesanan?status=${s.nilai}` : "/admin/pesanan"}
            className={`border px-3 py-1.5 font-mono text-[13px] tracking-[0.16em] indent-[0.16em] uppercase transition-colors ${
              status === s.nilai
                ? "border-brand-500 bg-brand-500 text-white"
                : "border-ink/15 bg-white text-stone-600 hover:border-brand-400 hover:text-brand-600"
            }`}
          >
            {s.label}
          </a>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-[13px] tracking-[0.16em] text-stone-500 uppercase">
          {pesanan.length} pesanan
        </p>
        {status === "PAID" && pesanan.length > 0 && (
          <a
            href="/admin/pesanan/label?status=PAID"
            target="_blank"
            rel="noopener"
            className="border border-ink px-4 py-2 font-mono text-[12px] tracking-[0.18em] indent-[0.18em] text-ink uppercase transition-colors hover:bg-ink hover:text-white"
          >
            Cetak semua label ({pesanan.length})
          </a>
        )}
      </div>

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
          const ringkas = p.status === "SHIPPED" ? ringkasLacak(p) : null;

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
                  className={`border px-2 py-0.5 font-mono text-[12px] tracking-[0.14em] uppercase ${statusWarna[p.status]}`}
                >
                  {statusLabel[p.status]}
                </span>
                {ringkas && (
                  <span className={`basis-full font-mono text-[12px] ${ringkas.warna}`}>
                    {ringkas.teks}
                  </span>
                )}
              </button>

              {terbuka && (
                <div className="border-t border-ink/5 bg-stone-50 px-6 py-6">
                  <div className="grid gap-8 sm:grid-cols-2">
                    <div>
                      <p className="font-mono text-[12px] tracking-[0.2em] text-stone-500 uppercase">
                        Nomor pesanan
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                        <p className="min-w-0 flex-1 font-mono text-sm break-all text-ink">
                          {p.order_no}
                        </p>
                        <a
                          href={`/order/${encodeURIComponent(p.order_no)}`}
                          target="_blank"
                          rel="noopener"
                          title={`Buka halaman pesanan ${p.order_no}`}
                          className="shrink-0 border border-ink/15 px-2 py-1 font-mono text-[12px] tracking-[0.14em] indent-[0.14em] text-stone-500 uppercase transition-colors hover:border-brand-500 hover:text-brand-600"
                        >
                          Buka
                        </a>
                        <CopyButton nilai={p.order_no} label="nomor pesanan" />
                      </div>

                      <p className="mt-6 font-mono text-[12px] tracking-[0.2em] text-stone-500 uppercase">
                        Alamat kirim
                      </p>

                      <dl className="mt-3 space-y-2.5">
                        {[
                          { k: "Nama", v: p.customer_name },
                          { k: "No. HP", v: p.phone },
                          { k: "Alamat", v: `${p.address}\n${p.dest_label}` },
                        ].map((b) => (
                          <div key={b.k} className="flex items-start gap-3">
                            <div className="min-w-0 flex-1">
                              <dt className="font-mono text-[12px] tracking-[0.16em] text-stone-400 uppercase">
                                {b.k}
                              </dt>
                              <dd className="mt-0.5 text-sm leading-relaxed whitespace-pre-line text-ink">
                                {b.v}
                              </dd>
                            </div>
                            <CopyButton nilai={b.v} label={b.k} />
                          </div>
                        ))}
                      </dl>

                      <p className="mt-3 font-mono text-xs text-stone-500">
                        {namaLayanan(p.courier, p.service)} ({p.service}) &middot; {p.weight_g} g
                      </p>
                      {p.notes && (
                        <p className="mt-3 text-sm text-stone-600">
                          Catatan: {p.notes}
                        </p>
                      )}
                    </div>

                    <div>
                      <p className="font-mono text-[12px] tracking-[0.2em] text-stone-500 uppercase">
                        Isi pesanan
                      </p>
                      <ul className="mt-2 space-y-1.5">
                        {p.items.map((it, i) => (
                          <li key={`${it.slug}-${i}`} className="flex justify-between gap-4 text-sm">
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
                    <div className="mt-8 border-t border-ink/10 pt-6">
                      <div className="flex flex-wrap items-center gap-3">
                        <a
                          href={`/admin/pesanan/label?no=${encodeURIComponent(p.order_no)}`}
                          target="_blank"
                          rel="noopener"
                          className="border border-ink px-6 py-2.5 font-mono text-[13px] tracking-[0.18em] indent-[0.18em] text-ink uppercase transition-colors hover:bg-ink hover:text-white"
                        >
                          Cetak label
                        </a>
                        <span className="text-xs text-stone-500">
                          Tempel di paket sebelum di-drop ke kurir. Resi diisi setelah dapat struk.
                        </span>
                      </div>
                    </div>
                  )}

                  {p.status === "PAID" && (
                    <div className="mt-4 flex flex-wrap items-center gap-3">
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
                        className="border border-ink bg-ink px-6 py-2.5 font-mono text-[13px] tracking-[0.18em] indent-[0.18em] text-white uppercase transition-colors hover:border-brand-600 hover:bg-brand-600 disabled:cursor-not-allowed disabled:border-stone-300 disabled:bg-stone-300"
                      >
                        {memproses ? "Menyimpan..." : "Tandai dikirim"}
                      </button>
                    </div>
                  )}

                  {p.status === "SHIPPED" && (
                    <div className="mt-8 border-t border-ink/10 pt-6">
                      <p className="font-mono text-[12px] tracking-[0.2em] text-stone-500 uppercase">
                        Lacak kurir
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                        <p className="min-w-0 flex-1 font-mono text-sm break-all text-ink">
                          {namaLayanan(p.courier, p.service)} &middot; {p.tracking_number}
                        </p>
                        {p.tracking_number && (
                          <CopyButton nilai={p.tracking_number} label="nomor resi" />
                        )}
                      </div>
                      {p.delivered_at && p.tracking?.receiver && (
                        <p className="mt-1 text-sm text-stone-600">
                          Diterima oleh {p.tracking.receiver}
                        </p>
                      )}
                      {p.tracking_checked_at && (
                        <p className="mt-1 text-xs text-stone-400">
                          Dicek {sejak(p.tracking_checked_at)}
                          {p.tracking_error && p.tracking ? ` · terakhir gagal: ${p.tracking_error}` : ""}
                        </p>
                      )}
                      {p.tracking && <RiwayatKurir baris={barisRiwayat(p.tracking)} awal={3} />}

                      <div className="mt-5 flex flex-wrap items-center gap-3">
                        <input
                          value={resi}
                          onChange={(e) => setResi(e.target.value)}
                          placeholder="Resi pengganti"
                          aria-label="Resi pengganti"
                          disabled={memproses}
                          className="border border-ink/15 bg-white px-4 py-2.5 font-mono text-sm text-ink outline-none transition-colors placeholder:font-sans placeholder:text-stone-400 focus:border-brand-500 disabled:bg-stone-100"
                        />
                        <button
                          type="button"
                          onClick={() => ganti(p.order_no)}
                          disabled={!resi.trim() || memproses}
                          className="border border-ink px-6 py-2.5 font-mono text-[13px] tracking-[0.18em] indent-[0.18em] text-ink uppercase transition-colors hover:bg-ink hover:text-white disabled:cursor-not-allowed disabled:border-stone-300 disabled:text-stone-300 disabled:hover:bg-transparent"
                        >
                          {memproses ? "Menyimpan..." : "Ganti resi"}
                        </button>
                        <span className="text-xs text-stone-500">
                          Kalau resi tadi salah ketik. Riwayat lacak yang lama ikut dihapus.
                        </span>
                      </div>
                    </div>
                  )}

                  {p.status === "SHIPPED" && (
                    <div className="mt-8 border-t border-ink/10 pt-6">
                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={() => kirimResi(p)}
                          className="border border-ink px-6 py-2.5 font-mono text-[13px] tracking-[0.18em] indent-[0.18em] text-ink uppercase transition-colors hover:bg-ink hover:text-white"
                        >
                          Kirim resi via WhatsApp
                        </button>
                        <span className="text-xs text-stone-500">
                          Membuka chat ke {p.phone} dengan pesan siap kirim.
                        </span>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={() => selesai(p.order_no)}
                          disabled={memproses}
                          className="border border-emerald-600 bg-emerald-600 px-6 py-2.5 font-mono text-[13px] tracking-[0.18em] indent-[0.18em] text-white uppercase transition-colors hover:border-emerald-700 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:border-stone-300 disabled:bg-stone-300"
                        >
                          {memproses ? "Menyimpan..." : "Tandai selesai"}
                        </button>
                        <span className="text-xs text-stone-500">
                          {p.delivered_at
                            ? `Otomatis selesai ${waktuKurir(batasKomplain(p.delivered_at))}, 2 hari setelah paket diterima. Tekan kalau mau selesaikan sekarang.`
                            : "Tekan setelah paket diterima pembeli. Kalau kurir mencatat paket sampai, pesanan selesai sendiri 2 hari kemudian."}
                        </span>
                      </div>
                    </div>
                  )}

                  {p.status === "PENDING" && (
                    <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-ink/10 pt-6">
                      <button
                        type="button"
                        onClick={() => lunas(p.order_no)}
                        disabled={memproses}
                        className="border border-brand-500 bg-brand-500 px-6 py-2.5 font-mono text-[13px] tracking-[0.18em] indent-[0.18em] text-white uppercase transition-colors hover:border-brand-600 hover:bg-brand-600 disabled:cursor-not-allowed disabled:border-stone-300 disabled:bg-stone-300"
                      >
                        {memproses ? "Menyimpan..." : "Tandai lunas"}
                      </button>
                      <button
                        type="button"
                        onClick={() => batal(p.order_no)}
                        disabled={memproses}
                        className="border border-ink/20 px-6 py-2.5 font-mono text-[13px] tracking-[0.18em] indent-[0.18em] text-stone-600 uppercase transition-colors hover:border-red-400 hover:text-red-600 disabled:cursor-not-allowed disabled:border-stone-200 disabled:text-stone-300"
                      >
                        {memproses ? "Membatalkan..." : "Batalkan pesanan"}
                      </button>
                      <span className="text-xs text-stone-500">
                        Tandai lunas untuk transfer manual. Batalkan mengembalikan
                        stok ke katalog.
                      </span>
                    </div>
                  )}

                  {p.tracking_number && p.status !== "SHIPPED" && (
                    <div className="mt-8 border-t border-ink/10 pt-6">
                      <p className="font-mono text-sm text-stone-600">
                        Resi: <span className="text-ink">{p.tracking_number}</span>
                      </p>
                      {p.delivered_at && (
                        <p className="mt-1 text-sm text-stone-600">
                          Diterima {waktuKurir(p.delivered_at)}
                          {p.tracking?.receiver ? ` oleh ${p.tracking.receiver}` : ""}
                        </p>
                      )}
                      {p.tracking && <RiwayatKurir baris={barisRiwayat(p.tracking)} awal={0} />}
                    </div>
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
