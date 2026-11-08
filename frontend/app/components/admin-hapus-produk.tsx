"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { hapusProdukPermanen } from "@/app/lib/api-client";
import type { Produk } from "@/app/data/produk";

const daftar = new Intl.ListFormat("id-ID", { type: "conjunction" });

function isiIkutTerhapus(p: Produk): string {
  const ulasan = p.jumlahUlasan ?? 0;

  return daftar.format(
    [
      `${p.varian.length} ukuran`,
      p.foto.length > 0 ? `${p.foto.length} foto` : null,
      ulasan > 0 ? `${ulasan} ulasan` : null,
    ].filter((x): x is string => x !== null),
  );
}

export default function ZonaHapusProduk({ produk, kembali }: { produk: Produk; kembali: string }) {
  const router = useRouter();
  const [proses, setProses] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const pesanan = produk.jumlahPesanan ?? 0;
  const bisa = produk.aktif === false && pesanan === 0;

  const hapus = async () => {
    const yakin = window.confirm(
      `Hapus permanen "${produk.nama}"?\n\nIkut terhapus selamanya: ${isiIkutTerhapus(produk)}. Tindakan ini tidak bisa dibatalkan.`,
    );
    if (!yakin) return;

    setProses(true);
    setGalat(null);

    try {
      await hapusProdukPermanen(produk.slug);
      router.push(kembali);
      router.refresh();
    } catch (err) {
      setGalat(err instanceof Error ? err.message : "Gagal menghapus produk");
      setProses(false);
    }
  };

  return (
    <section className="mt-12 border-t border-ink/10 pt-10">
      <h2 className="text-lg font-semibold tracking-tight text-ink">Hapus permanen</h2>
      <p className="mt-2 text-sm leading-relaxed text-stone-600">
        {produk.aktif !== false
          ? "Hanya produk nonaktif yang bisa dihapus permanen. Hilangkan centang “Tampilkan di toko” di atas lalu simpan dulu."
          : pesanan > 0
            ? `Produk ini ada di ${pesanan} pesanan, jadi tidak bisa dihapus permanen supaya riwayat pesanan dan laporan penjualan tetap utuh. Biarkan nonaktif saja, pembeli tidak akan melihatnya.`
            : `Produk ini beserta ${isiIkutTerhapus(produk)} akan hilang selamanya dan tidak bisa dikembalikan.`}
      </p>

      {galat && (
        <p role="alert" className="mt-4 border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {galat}
        </p>
      )}

      <button
        type="button"
        onClick={() => void hapus()}
        disabled={proses || !bisa}
        className="mt-6 border border-red-300 px-8 py-3 font-mono text-[13px] tracking-[0.2em] indent-[0.2em] text-red-700 uppercase transition-colors hover:border-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:border-stone-200 disabled:bg-transparent disabled:text-stone-400"
      >
        {proses ? "Menghapus..." : "Hapus permanen"}
      </button>
    </section>
  );
}
