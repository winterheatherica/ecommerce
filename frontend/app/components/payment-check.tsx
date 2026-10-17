"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { cekPembayaran } from "@/app/lib/api-client";

export default function PaymentCheck({ orderNo }: { orderNo: string }) {
  const router = useRouter();
  const [memeriksa, setMemeriksa] = useState(false);
  const [pesan, setPesan] = useState<string | null>(null);

  useEffect(() => {
    let batal = false;

    cekPembayaran(orderNo)
      .then((hasil) => {
        if (!batal && hasil.status !== "PENDING") router.refresh();
      })
      .catch(() => {});

    return () => {
      batal = true;
    };
  }, [orderNo, router]);

  const periksa = async () => {
    setMemeriksa(true);
    setPesan(null);

    try {
      const hasil = await cekPembayaran(orderNo);

      if (hasil.status !== "PENDING") {
        router.refresh();
        return;
      }

      setPesan(
        "Pembayaran belum kami terima. Kalau baru saja bayar, tunggu sebentar lalu cek lagi.",
      );
    } catch (err) {
      setPesan(err instanceof Error ? err.message : "Status pembayaran tidak bisa dicek");
    } finally {
      setMemeriksa(false);
    }
  };

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => void periksa()}
        disabled={memeriksa}
        className="font-mono text-[12px] tracking-[0.16em] text-stone-500 uppercase transition-colors hover:text-brand-600 disabled:cursor-wait"
      >
        {memeriksa ? "Mengecek pembayaran..." : "Sudah bayar? Cek status"}
      </button>
      {pesan && (
        <p role="status" className="mt-2 max-w-sm text-sm leading-relaxed text-stone-600">
          {pesan}
        </p>
      )}
    </div>
  );
}
