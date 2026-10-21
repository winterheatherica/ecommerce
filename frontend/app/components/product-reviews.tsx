"use client";

import { useState } from "react";

import type { RingkasanUlasan, Ulasan } from "@/app/data/produk";
import { ambilUlasanLanjutan, tanggalUlasan } from "@/app/lib/ulasan";

const AWAL = 5;

function Bintang({ nilai }: { nilai: number }) {
  return (
    <span className="flex gap-0.5 text-sm leading-none" aria-label={`${nilai} dari 5 bintang`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} aria-hidden="true" className={i <= nilai ? "text-amber-500" : "text-stone-300"}>
          &#9733;
        </span>
      ))}
    </span>
  );
}

function LabelSumber({ sumber }: { sumber: Ulasan["sumber"] }) {
  if (sumber === "shopee") {
    return (
      <span className="border border-orange-300 bg-orange-50 px-2 py-0.5 font-mono text-[11px] tracking-[0.14em] text-orange-700 uppercase">
        Dari Shopee
      </span>
    );
  }

  if (sumber === "tokopedia") {
    return (
      <span className="border border-emerald-300 bg-emerald-50 px-2 py-0.5 font-mono text-[11px] tracking-[0.14em] text-emerald-700 uppercase">
        Dari Tokopedia
      </span>
    );
  }

  return (
    <span className="border border-brand-200 bg-brand-50 px-2 py-0.5 font-mono text-[11px] tracking-[0.14em] text-brand-700 uppercase">
      Pembeli website
    </span>
  );
}

type Props = {
  produkSlug: string;
  ulasan: Ulasan[];
  ringkasan?: RingkasanUlasan;
  tampilkanUkuran: boolean;
  linkShopee: string | null;
  linkPerUkuran: Record<string, string | null>;
};

function AsalShopee({
  ulasan,
  tampilkanUkuran,
  link,
}: {
  ulasan: Ulasan;
  tampilkanUkuran: boolean;
  link: string | null;
}) {
  const tujuan = tampilkanUkuran ? `ukuran ${ulasan.ukuran}` : "produk ini";

  return (
    <p className="mt-3 font-mono text-[12px] text-stone-500">
      {link ? (
        <a
          href={link}
          target="_blank"
          rel="noopener nofollow"
          className="border-b border-stone-300 transition-colors hover:border-orange-600 hover:text-orange-700"
        >
          Ditulis di halaman Shopee {tujuan} &#8599;
        </a>
      ) : (
        <>Ditulis di halaman Shopee {tujuan}</>
      )}
    </p>
  );
}

function AsalTokopedia({ ulasan }: { ulasan: Ulasan }) {
  const teks = `Ulasan Tokopedia & TikTok Shop${ulasan.produkAsal ? ` untuk ${ulasan.produkAsal}` : ""}`;

  return (
    <p className="mt-3 font-mono text-[12px] break-words text-stone-500">
      {ulasan.urlAsal ? (
        <a
          href={ulasan.urlAsal}
          target="_blank"
          rel="noopener nofollow"
          className="border-b border-stone-300 transition-colors hover:border-emerald-600 hover:text-emerald-700"
        >
          {teks} &#8599;
        </a>
      ) : (
        teks
      )}
    </p>
  );
}

function Pengantar({ ringkasan, linkShopee }: { ringkasan?: RingkasanUlasan; linkShopee: string | null }) {
  const shopee = (ringkasan?.shopee ?? 0) > 0;
  const tokopedia = (ringkasan?.tokopedia ?? 0) > 0;

  if (!shopee && !tokopedia) return null;

  const label = (
    <>
      {shopee && <span className="font-medium text-orange-700">dari Shopee</span>}
      {shopee && tokopedia && " dan "}
      {tokopedia && <span className="font-medium text-emerald-700">dari Tokopedia</span>}
    </>
  );

  return (
    <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-600">
      Ulasan berlabel {label} disalin apa adanya dari toko kami di platform tersebut, dengan nama
      pembeli disamarkan.
      {tokopedia && " Ulasan Tokopedia sudah termasuk pembelian lewat TikTok Shop."}
      {shopee && linkShopee && (
        <>
          {" "}
          <a
            href={linkShopee}
            target="_blank"
            rel="noopener nofollow"
            className="border-b border-stone-400 text-ink transition-colors hover:border-brand-600 hover:text-brand-600"
          >
            Baca semua ulasannya di Shopee
          </a>
          .
        </>
      )}
    </p>
  );
}

export default function ProductReviews({
  produkSlug,
  ulasan,
  ringkasan,
  tampilkanUkuran,
  linkShopee,
  linkPerUkuran,
}: Props) {
  const [daftar, setDaftar] = useState(ulasan);
  const [semua, setSemua] = useState(false);
  const [memuat, setMemuat] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);

  const total = Math.max(ringkasan?.total ?? 0, daftar.length);
  const tampil = semua ? daftar : daftar.slice(0, AWAL);
  const sisa = total - daftar.length;

  const muatLagi = async () => {
    setMemuat(true);
    setGalat(null);

    try {
      const baru = await ambilUlasanLanjutan(
        `/api/products/${encodeURIComponent(produkSlug)}/reviews`,
        daftar.length,
      );
      const sudah = new Set(daftar.map((u) => u.id));
      setDaftar([...daftar, ...baru.filter((u) => !sudah.has(u.id))]);
    } catch {
      setGalat("Ulasan berikutnya gagal dimuat. Coba lagi sebentar.");
    } finally {
      setMemuat(false);
    }
  };

  return (
    <section className="mt-24 border-t border-ink/10 pt-16">
      <p className="font-mono text-[13px] tracking-[0.28em] text-accent-600 uppercase">Ulasan</p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-ink">Kata pembeli</h2>
      <Pengantar ringkasan={ringkasan} linkShopee={linkShopee} />

      <ul className="mt-10 divide-y divide-ink/10 border-y border-ink/10">
        {tampil.map((u) => (
          <li key={u.id} className="py-6">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <Bintang nilai={u.bintang} />
              <span className="text-sm font-medium text-ink">{u.nama}</span>
              <span className="font-mono text-[12px] text-stone-400">{tanggalUlasan(u.pada, u.presisi)}</span>
              {tampilkanUkuran && u.sumber === "web" && (
                <span className="font-mono text-[12px] text-stone-500">Ukuran {u.ukuran}</span>
              )}
              <LabelSumber sumber={u.sumber} />
            </div>

            {u.teks && (
              <p className="mt-3 max-w-3xl text-sm leading-relaxed whitespace-pre-line break-words text-stone-700">
                {u.teks}
              </p>
            )}

            {u.susulan && (
              <div className="mt-3 max-w-3xl border-l-2 border-orange-200 pl-4">
                <p className="font-mono text-[11px] tracking-[0.14em] text-stone-500 uppercase">
                  Update penilaian{u.susulanPada ? ` · ${tanggalUlasan(u.susulanPada, "day")}` : ""}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-line break-words text-stone-700">
                  {u.susulan}
                </p>
              </div>
            )}

            {u.sumber === "shopee" && (
              <AsalShopee
                ulasan={u}
                tampilkanUkuran={tampilkanUkuran}
                link={linkPerUkuran[u.ukuranSlug] ?? null}
              />
            )}

            {u.sumber === "tokopedia" && <AsalTokopedia ulasan={u} />}
          </li>
        ))}
      </ul>

      {galat && (
        <p role="alert" className="mt-6 text-sm text-red-700">
          {galat}
        </p>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-4">
        {!semua && daftar.length > AWAL && (
          <button
            type="button"
            onClick={() => setSemua(true)}
            className="border border-ink/15 px-6 py-2.5 font-mono text-[13px] tracking-[0.2em] indent-[0.2em] text-stone-600 uppercase transition-colors hover:border-brand-400 hover:text-brand-600"
          >
            Lihat semua {total.toLocaleString("id-ID")} ulasan
          </button>
        )}

        {semua && sisa > 0 && (
          <button
            type="button"
            onClick={() => void muatLagi()}
            disabled={memuat}
            className="border border-ink/15 px-6 py-2.5 font-mono text-[13px] tracking-[0.2em] indent-[0.2em] text-stone-600 uppercase transition-colors hover:border-brand-400 hover:text-brand-600 disabled:cursor-wait disabled:text-stone-300"
          >
            {memuat ? "Memuat..." : "Muat ulasan lainnya"}
          </button>
        )}

        {semua && (
          <p className="font-mono text-[12px] text-stone-400">
            Menampilkan {daftar.length.toLocaleString("id-ID")} dari {total.toLocaleString("id-ID")} ulasan
          </p>
        )}

        {semua && (
          <button
            type="button"
            onClick={() => setSemua(false)}
            className="font-mono text-[12px] tracking-[0.14em] text-stone-500 uppercase transition-colors hover:text-brand-600"
          >
            Tampilkan lebih sedikit
          </button>
        )}
      </div>
    </section>
  );
}
