"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  ambilChannel,
  bayarPesanan,
  type ChannelBayar,
} from "@/app/lib/api-client";
import { rupiah } from "@/app/data/produk";

type Props = {
  orderNo: string;
  total: number;
};

type Muatan =
  | { keadaan: "memuat" }
  | { keadaan: "siap"; channel: ChannelBayar[]; sandbox: boolean }
  | { keadaan: "gagal"; pesan: string };

export default function PaymentPicker({ orderNo, total }: Props) {
  const [muatan, setMuatan] = useState<Muatan>({ keadaan: "memuat" });
  const [dipilih, setDipilih] = useState<string | null>(null);
  const [memproses, setMemproses] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);

  useEffect(() => {
    const kendali = new AbortController();

    ambilChannel(kendali.signal)
      .then((isi) => {
        if (kendali.signal.aborted) return;
        setMuatan({
          keadaan: "siap",
          channel: isi.data,
          sandbox: isi.sandbox,
        });
      })
      .catch((err: unknown) => {
        if (kendali.signal.aborted) return;
        setMuatan({
          keadaan: "gagal",
          pesan:
            err instanceof Error ? err.message : "Metode bayar tidak bisa dimuat",
        });
      });

    return () => kendali.abort();
  }, []);

  const bayar = async () => {
    if (!dipilih) return;

    setMemproses(true);
    setGalat(null);

    try {
      const { checkout_url } = await bayarPesanan(orderNo, dipilih);
      window.location.href = checkout_url;
    } catch (err) {
      setGalat(err instanceof Error ? err.message : "Pembayaran gagal dibuat");
      setMemproses(false);
    }
  };

  if (muatan.keadaan === "memuat") {
    return (
      <p className="mt-10 font-mono text-[10px] tracking-[0.18em] text-stone-400 uppercase">
        Memuat metode pembayaran...
      </p>
    );
  }

  if (muatan.keadaan === "gagal") {
    return (
      <div className="mt-10">
        <p
          role="alert"
          className="border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-800"
        >
          {muatan.pesan}
        </p>
        <Link
          href={`/order/${orderNo}`}
          className="mt-6 inline-block font-mono text-[10px] tracking-[0.18em] text-stone-500 uppercase transition-colors hover:text-brand-600"
        >
          Lihat status pesanan
        </Link>
      </div>
    );
  }

  const kelompok = [...new Set(muatan.channel.map((c) => c.group))];
  const cocok = muatan.channel.filter(
    (c) => total >= c.minimum_amount && (c.maximum_amount === 0 || total <= c.maximum_amount),
  );

  return (
    <div className="mt-10">
      {muatan.sandbox && (
        <p className="mb-8 border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-800">
          Mode uji coba. Tidak ada uang yang berpindah.
        </p>
      )}

      <fieldset disabled={memproses}>
        <legend className="font-mono text-[10px] tracking-[0.2em] text-stone-500 uppercase">
          Pilih metode
        </legend>

        {kelompok.map((g) => {
          const isi = cocok.filter((c) => c.group === g);
          if (isi.length === 0) return null;

          return (
            <div key={g} className="mt-6">
              <p className="font-mono text-[10px] tracking-[0.18em] text-stone-400 uppercase">
                {g}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {isi.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => setDipilih(c.code)}
                    aria-pressed={dipilih === c.code}
                    className={`border px-4 py-2 text-sm transition-colors ${
                      dipilih === c.code
                        ? "border-brand-500 bg-brand-50 text-brand-700"
                        : "border-ink/15 text-stone-600 hover:border-brand-400 hover:text-brand-600"
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </fieldset>

      {cocok.length === 0 && (
        <p className="mt-6 border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Tidak ada metode pembayaran yang cocok untuk nominal ini. Hubungi kami
          lewat WhatsApp.
        </p>
      )}

      <button
        type="button"
        onClick={bayar}
        disabled={memproses || !dipilih}
        className="mt-10 w-full border border-brand-500 bg-brand-500 px-8 py-4 font-mono text-[11px] tracking-[0.22em] text-white uppercase transition-colors hover:border-brand-600 hover:bg-brand-600 disabled:cursor-not-allowed disabled:border-stone-300 disabled:bg-stone-300 sm:w-auto"
      >
        {memproses ? "Menyiapkan..." : `Bayar ${rupiah(total)}`}
      </button>

      <Link
        href={`/order/${orderNo}`}
        className="mt-4 block font-mono text-[10px] tracking-[0.18em] text-stone-500 uppercase transition-colors hover:text-brand-600 sm:mt-6"
      >
        Bayar nanti
      </Link>

      {galat && (
        <p
          role="alert"
          className="mt-6 border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {galat}
        </p>
      )}
    </div>
  );
}
