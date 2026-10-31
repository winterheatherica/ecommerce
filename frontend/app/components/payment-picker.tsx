"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import {
  ambilChannel,
  bayarPesanan,
  type InfoPembayaran,
} from "@/app/lib/api-client";
import { LOGO_BAYAR } from "@/app/data/logo-bayar";
import { rupiah } from "@/app/data/produk";
import { useSitus } from "@/app/components/situs-konteks";
import { waPesan } from "@/app/lib/situs";

type Props = {
  orderNo: string;
  total: number;
};

type Muatan =
  | { keadaan: "memuat" }
  | { keadaan: "siap"; info: InfoPembayaran }
  | { keadaan: "gagal"; pesan: string };

export default function PaymentPicker({ orderNo, total }: Props) {
  const { toko } = useSitus();
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
      <p className="mt-10 text-[14px] text-stone-400 font-semibold">
        Memuat metode pembayaran...
      </p>
    );
  }

  if (muatan.keadaan === "gagal") {
    return (
      <div className="mt-10">
        <p
          role="alert"
          className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-800"
        >
          {muatan.pesan}
        </p>
        <Link
          href={`/order/${orderNo}`}
          className="tautan mt-6 inline-block"
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
        <div className="rounded-2xl border border-brand-200 bg-brand-50 px-6 py-7">
          <p className="text-[15px] font-bold text-brand-700">
            Pembayaran otomatis belum aktif
          </p>
          <p className="mt-4 text-sm leading-relaxed text-ink">
            Pesanan kamu sudah tercatat dengan nomor{" "}
            <span className="font-mono">{orderNo}</span> dan barangnya sudah
            kami sisihkan. Pembayaran untuk sementara diselesaikan lewat
            WhatsApp, dan nomor rekening akan kami kirimkan di sana.
          </p>
          <a
            href={waPesan(toko, pesan)}
            className="mt-7 tombol"
          >
            Lanjutkan di WhatsApp
          </a>
        </div>

        <Link
          href={`/order/${orderNo}`}
          className="tautan mt-6 inline-block"
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
        <p className="mb-8 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-800">
          <span className="font-semibold">Mode uji.</span> Halaman berikutnya
          memakai sandbox DOKU dan tidak menagih uang sungguhan.
        </p>
      )}

      <p className="text-[15px] font-bold text-ink">
        Bisa dibayar dengan
      </p>
      <dl className="mt-4 space-y-5">
        {kelompok.map((g) => (
          <div key={g}>
            <dt className="text-[14px] font-semibold text-stone-600">
              {g}
            </dt>
            <dd className="mt-2">
              <ul className="grid grid-cols-3 gap-2">
                {info.data
                  .filter((c) => c.group === g)
                  .map((c) => {
                    const logo = LOGO_BAYAR[c.code];

                    return (
                      <li
                        key={c.code}
                        className="flex h-12 min-w-0 items-center justify-center rounded-xl border border-ink/10 bg-white px-1.5"
                      >
                        {logo ? (
                          <Image
                            src={logo.src}
                            alt={c.name}
                            title={c.name}
                            width={logo.lebar}
                            height={logo.tinggi}
                            unoptimized
                            className="h-auto max-w-full min-w-0"
                          />
                        ) : (
                          <span className="truncate text-sm text-stone-700">
                            {c.name}
                          </span>
                        )}
                      </li>
                    );
                  })}
              </ul>
            </dd>
          </div>
        ))}
      </dl>

      <button
        type="button"
        onClick={bayar}
        disabled={memproses}
        className="mt-10 w-full tombol-oranye sm:w-auto"
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
        className="tautan mt-6 inline-block"
      >
        Bayar nanti
      </Link>

      {galat && (
        <p
          role="alert"
          className="mt-6 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {galat}
        </p>
      )}
    </div>
  );
}
