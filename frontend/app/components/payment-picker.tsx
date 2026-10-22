"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  ambilChannel,
  bayarPesanan,
  type InfoPembayaran,
} from "@/app/lib/api-client";
import { rupiah } from "@/app/data/produk";
import { waPesan } from "@/app/data/kontak";

type Props = {
  orderNo: string;
  total: number;
};

type Muatan =
  | { keadaan: "memuat" }
  | { keadaan: "siap"; info: InfoPembayaran }
  | { keadaan: "gagal"; pesan: string };

export default function PaymentPicker({ orderNo, total }: Props) {
  const [muatan, setMuatan] = useState<Muatan>({ keadaan: "memuat" });
  const [memproses, setMemproses] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);

  useEffect(() => {
    const kendali = new AbortController();

    ambilChannel(kendali.signal)
      .then((info) => {
        if (kendali.signal.aborted) return;
        setMuatan({ keadaan: "siap", info });
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
    setMemproses(true);
    setGalat(null);

    try {
      const { checkout_url } = await bayarPesanan(orderNo);
      window.location.href = checkout_url;
    } catch (err) {
      setGalat(err instanceof Error ? err.message : "Pembayaran gagal dibuat");
      setMemproses(false);
    }
  };

  if (muatan.keadaan === "memuat") {
    return (
      <p className="mt-10 font-mono text-[12px] tracking-[0.18em] text-stone-400 uppercase">
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
          className="mt-6 inline-block font-mono text-[12px] tracking-[0.18em] text-stone-500 uppercase transition-colors hover:text-brand-600"
        >
          Lihat status pesanan
        </Link>
      </div>
    );
  }

  const { info } = muatan;

  if (!info.configured) {
    const pesan = `Halo Menik Store, saya mau menyelesaikan pembayaran pesanan ${orderNo} senilai ${rupiah(total)}.`;

    return (
      <div className="mt-10">
        <div className="border border-brand-200 bg-brand-50 px-6 py-7">
          <p className="font-mono text-[12px] tracking-[0.2em] text-brand-700 uppercase">
            Pembayaran otomatis belum aktif
          </p>
          <p className="mt-4 text-sm leading-relaxed text-ink">
            Pesanan kamu sudah tercatat dengan nomor{" "}
            <span className="font-mono">{orderNo}</span> dan barangnya sudah
            kami sisihkan. Pembayaran untuk sementara diselesaikan lewat
            WhatsApp, dan nomor rekening akan kami kirimkan di sana.
          </p>
          <a
            href={waPesan(pesan)}
            className="mt-7 inline-block border border-brand-500 bg-brand-500 px-8 py-4 font-mono text-[13px] tracking-[0.22em] indent-[0.22em] text-white uppercase transition-colors hover:border-brand-600 hover:bg-brand-600"
          >
            Lanjutkan di WhatsApp
          </a>
        </div>

        <Link
          href={`/order/${orderNo}`}
          className="mt-6 inline-block font-mono text-[12px] tracking-[0.18em] text-stone-500 uppercase transition-colors hover:text-brand-600"
        >
          Lihat status dan batas waktu pesanan
        </Link>
      </div>
    );
  }

  const kelompok = [...new Set(info.data.map((c) => c.group))];
  const satu = info.data.length === 1 ? info.data[0] : null;
  const namaSatu = satu && (satu.group === satu.name ? satu.name : `${satu.group} ${satu.name}`);

  return (
    <div className="mt-10">
      {info.sandbox && (
        <p className="mb-8 border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-800">
          <span className="font-semibold">Mode uji.</span> Halaman berikutnya
          memakai sandbox DOKU dan tidak menagih uang sungguhan.
        </p>
      )}

      <p className="font-mono text-[12px] tracking-[0.2em] text-stone-500 uppercase">
        Bisa dibayar dengan
      </p>
      <dl className="mt-4 space-y-3">
        {kelompok.map((g) => (
          <div key={g} className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
            <dt className="w-32 shrink-0 font-mono text-[12px] tracking-[0.16em] text-stone-400 uppercase">
              {g}
            </dt>
            <dd className="flex flex-wrap gap-2">
              {info.data
                .filter((c) => c.group === g)
                .map((c) => (
                  <span
                    key={c.code}
                    className="border border-ink/15 px-3 py-1.5 text-sm text-stone-700"
                  >
                    {c.name}
                  </span>
                ))}
            </dd>
          </div>
        ))}
      </dl>

      <button
        type="button"
        onClick={bayar}
        disabled={memproses}
        className="mt-10 w-full border border-brand-500 bg-brand-500 px-8 py-4 font-mono text-[13px] tracking-[0.22em] indent-[0.22em] text-white uppercase transition-colors hover:border-brand-600 hover:bg-brand-600 disabled:cursor-not-allowed disabled:border-stone-300 disabled:bg-stone-300 sm:w-auto"
      >
        {memproses ? "Menyiapkan..." : `Bayar ${rupiah(total)}`}
      </button>
      <p className="mt-3 text-xs leading-relaxed text-stone-500">
        {satu ? (
          <>
            Kamu akan diarahkan ke halaman DOKU untuk membayar lewat {namaSatu}.
            {satu.group === "Virtual Account" &&
              " Nomor VA-nya juga bisa dibayar dari bank lain lewat transfer antarbank."}
          </>
        ) : (
          "Kamu akan diarahkan ke halaman pembayaran DOKU dan memilih metodenya di sana."
        )}
      </p>

      <Link
        href={`/order/${orderNo}`}
        className="mt-6 block font-mono text-[12px] tracking-[0.18em] text-stone-500 uppercase transition-colors hover:text-brand-600"
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
