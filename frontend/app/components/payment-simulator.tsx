"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { bayarSimulasi } from "@/app/lib/api-client";
import { rupiah } from "@/app/data/produk";

const METODE = ["BCA", "Mandiri", "BNI", "QRIS", "GoPay", "OVO", "DANA"];

type Props = {
  orderNo: string;
  total: number;
};

export default function PaymentSimulator({ orderNo, total }: Props) {
  const router = useRouter();
  const [metode, setMetode] = useState(METODE[0]);
  const [memproses, setMemproses] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);

  const bayar = async () => {
    setMemproses(true);
    setGalat(null);

    try {
      await bayarSimulasi(orderNo, metode);
      router.push(`/order/${orderNo}`);
    } catch (err) {
      setGalat(err instanceof Error ? err.message : "Pembayaran gagal");
      setMemproses(false);
    }
  };

  return (
    <div className="mt-10">
      <fieldset disabled={memproses}>
        <legend className="font-mono text-[10px] tracking-[0.2em] text-stone-500 uppercase">
          Pilih metode
        </legend>

        <div className="mt-4 flex flex-wrap gap-2">
          {METODE.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMetode(m)}
              aria-pressed={metode === m}
              className={`border px-4 py-2 font-mono text-[11px] tracking-[0.16em] uppercase transition-colors ${
                metode === m
                  ? "border-brand-500 bg-brand-500 text-white"
                  : "border-ink/15 text-stone-600 hover:border-brand-400 hover:text-brand-600"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </fieldset>

      <button
        type="button"
        onClick={bayar}
        disabled={memproses}
        className="mt-8 w-full border border-brand-500 bg-brand-500 px-8 py-4 font-mono text-[11px] tracking-[0.22em] text-white uppercase transition-colors hover:border-brand-600 hover:bg-brand-600 disabled:cursor-not-allowed disabled:border-stone-300 disabled:bg-stone-300 sm:w-auto"
      >
        {memproses ? "Memproses..." : `Bayar ${rupiah(total)}`}
      </button>

      <a
        href={`/order/${orderNo}`}
        className="mt-4 block font-mono text-[10px] tracking-[0.18em] text-stone-500 uppercase transition-colors hover:text-brand-600 sm:mt-6"
      >
        Bayar nanti
      </a>

      {galat && (
        <p role="alert" className="mt-6 border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {galat}
        </p>
      )}
    </div>
  );
}
