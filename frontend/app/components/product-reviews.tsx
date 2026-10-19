"use client";

import { useState } from "react";

import type { Ulasan } from "@/app/data/produk";
import { tanggalRating } from "@/app/lib/rating";

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
  return sumber === "shopee" ? (
    <span className="border border-orange-300 bg-orange-50 px-2 py-0.5 font-mono text-[11px] tracking-[0.14em] text-orange-700 uppercase">
      Dari Shopee
    </span>
  ) : (
    <span className="border border-brand-200 bg-brand-50 px-2 py-0.5 font-mono text-[11px] tracking-[0.14em] text-brand-700 uppercase">
      Pembeli website
    </span>
  );
}

type Props = {
  ulasan: Ulasan[];
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

export default function ProductReviews({ ulasan, tampilkanUkuran, linkShopee, linkPerUkuran }: Props) {
  const [semua, setSemua] = useState(false);
  const tampil = semua ? ulasan : ulasan.slice(0, AWAL);
  const dariShopee = ulasan.filter((u) => u.sumber === "shopee").length;

  return (
    <section className="mt-24 border-t border-ink/10 pt-16">
      <p className="font-mono text-[13px] tracking-[0.28em] text-accent-600 uppercase">Ulasan</p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-ink">Kata pembeli</h2>
      {dariShopee > 0 && (
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-600">
          Ulasan berlabel{" "}
          <span className="font-medium text-orange-700">dari Shopee</span> disalin apa adanya
          dari toko kami di Shopee, dengan nama pembeli disamarkan.
          {linkShopee && (
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
      )}

      <ul className="mt-10 divide-y divide-ink/10 border-y border-ink/10">
        {tampil.map((u) => (
          <li key={u.id} className="py-6">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <Bintang nilai={u.bintang} />
              <span className="text-sm font-medium text-ink">{u.nama}</span>
              <span className="font-mono text-[12px] text-stone-400">{tanggalRating(u.pada)}</span>
              {tampilkanUkuran && u.sumber !== "shopee" && (
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
                  Update penilaian{u.susulanPada ? ` · ${tanggalRating(u.susulanPada)}` : ""}
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
          </li>
        ))}
      </ul>

      {ulasan.length > AWAL && (
        <button
          type="button"
          onClick={() => setSemua((s) => !s)}
          className="mt-8 border border-ink/15 px-6 py-2.5 font-mono text-[13px] tracking-[0.2em] indent-[0.2em] text-stone-600 uppercase transition-colors hover:border-brand-400 hover:text-brand-600"
        >
          {semua ? "Tampilkan lebih sedikit" : `Lihat semua ${ulasan.length} ulasan`}
        </button>
      )}
    </section>
  );
}
