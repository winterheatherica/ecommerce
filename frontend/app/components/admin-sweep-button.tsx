"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { sapuPesanan } from "@/app/lib/api-client";

export default function AdminSweepButton() {
  const router = useRouter();
  const [memproses, setMemproses] = useState(false);
  const [pesan, setPesan] = useState<string | null>(null);

  const sapu = async () => {
    setMemproses(true);
    setPesan(null);

    try {
      const jumlah = await sapuPesanan();
      setPesan(
        jumlah === 0
          ? "Tidak ada pesanan yang kedaluwarsa."
          : `${jumlah} pesanan dibatalkan, stoknya dikembalikan.`,
      );
      router.refresh();
    } catch (err) {
      setPesan(err instanceof Error ? err.message : "Gagal menyapu");
    } finally {
      setMemproses(false);
    }
  };

  return (
    <div className="mt-10 border border-ink/10 bg-white p-6">
      <h2 className="text-sm font-medium text-ink">Pesanan kedaluwarsa</h2>
      <p className="mt-2 max-w-lg text-sm leading-relaxed text-stone-500">
        Pesanan yang tidak dibayar sampai batas waktunya dibatalkan otomatis dan
        stoknya dikembalikan. Ini berjalan sendiri saat daftar pesanan dibuka —
        tombol ini hanya untuk menjalankannya sekarang juga.
      </p>

      <button
        type="button"
        onClick={sapu}
        disabled={memproses}
        className="mt-5 border border-ink/15 px-6 py-2.5 font-mono text-[11px] tracking-[0.18em] text-stone-600 uppercase transition-colors hover:border-brand-500 hover:text-brand-600 disabled:cursor-not-allowed disabled:text-stone-300"
      >
        {memproses ? "Menyapu..." : "Sapu sekarang"}
      </button>

      {pesan && (
        <p role="status" className="mt-4 text-sm text-stone-600">
          {pesan}
        </p>
      )}
    </div>
  );
}
