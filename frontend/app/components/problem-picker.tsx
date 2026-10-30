import Image from "next/image";
import Link from "next/link";

import IkonHama from "./ikon-hama";
import type { Produk } from "../data/produk";
import { ambilSitus } from "../lib/api";

export default async function ProblemPicker({ produk }: { produk: Produk[] }) {
  const situs = await ambilSitus();
  const masalah = situs.kategori.filter((k) => k.keluhan);
  const grupMasalah = masalah[0]?.grup;
  const lainnya = situs.grup.filter((g) => !masalah.some((k) => k.grup === g.slug));

  return (
    <section id="produk" className="mx-auto w-full max-w-6xl px-6 py-24">
      <p className="font-mono text-[13px] tracking-[0.28em] text-accent-600 uppercase">
        Cari berdasarkan masalah
      </p>
      <h2 className="mt-3 max-w-xl text-3xl leading-tight font-semibold tracking-tight text-ink sm:text-4xl">
        Hama apa yang lagi mengganggu?
      </h2>

      <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {masalah
          .map((m) => {
            const isi = produk.filter((p) => p.kategori === m.slug);
            const wakil = isi
              .filter((p) => p.gambar)
              .sort((a, b) => b.terjualPerBulan - a.terjualPerBulan)[0];

            return { ...m, jumlah: isi.length, wakil };
          })
          .filter((m) => m.jumlah > 0)
          .map((m) => (
            <Link
              key={m.slug}
              href={`/produk?kategori=${m.slug}`}
              className="group flex flex-col border border-ink/12 transition-colors hover:border-brand-500"
            >
              <div className="relative aspect-square overflow-hidden bg-brand-50">
                {m.wakil?.gambar ? (
                  <Image
                    src={m.wakil.gambar}
                    alt={m.wakil.nama}
                    fill
                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center text-ink/70 transition-colors group-hover:text-brand-700">
                    <IkonHama kategori={m.slug} />
                  </span>
                )}
              </div>

              <div className="flex flex-1 flex-col p-4">
                <span className="text-base font-semibold tracking-tight text-ink transition-colors group-hover:text-brand-600">
                  {m.label}
                </span>
                <span className="mt-1 text-xs leading-relaxed text-stone-500">
                  {m.keluhan}
                </span>
                <span className="mt-auto pt-3 font-mono text-[12px] tracking-[0.16em] text-stone-400 uppercase">
                  {m.jumlah} produk
                </span>
              </div>
            </Link>
          ))}

        {grupMasalah && (
          <Link
            href={`/produk?grup=${grupMasalah}`}
            className="group flex flex-col items-start justify-center border border-dashed border-ink/20 p-5 transition-colors hover:border-brand-500 hover:bg-brand-50"
          >
            <span className="text-base font-semibold tracking-tight text-ink transition-colors group-hover:text-brand-600">
              Lihat semua
            </span>
            <span className="mt-1 text-xs leading-relaxed text-stone-500">
              Seluruh pengusir hama dalam satu halaman
            </span>
            <span className="mt-3 font-mono text-sm text-stone-400 transition-colors group-hover:text-brand-600">
              &rarr;
            </span>
          </Link>
        )}
      </div>

      {lainnya.length > 0 && (
        <div className="mt-12 border-t border-ink/10 pt-8">
          <p className="font-mono text-[13px] tracking-[0.2em] text-stone-500 uppercase">
            Bukan soal hama?
          </p>
          <ul className="mt-4 flex flex-wrap gap-x-8 gap-y-3">
            {lainnya.map((g) => (
              <li key={g.slug}>
                <Link
                  href={`/produk?grup=${g.slug}`}
                  className="border-b border-stone-300 pb-0.5 text-sm text-ink transition-colors hover:border-brand-600 hover:text-brand-600"
                >
                  {g.judul} &rarr;
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
