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
      <p className="text-[15px] text-oranye-600 font-semibold">
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
              className="group flex flex-col overflow-hidden rounded-2xl border-2 border-ink/10 bg-white transition-colors hover:border-brand-400"
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
                <span className="text-[17px] font-bold tracking-tight text-ink transition-colors group-hover:text-brand-600 lg:text-lg">
                  {m.label}
                </span>
                <span className="mt-1 text-sm leading-snug text-stone-600">
                  {m.keluhan}
                </span>
                <span className="mt-auto pt-3 text-[14px] font-bold text-brand-600">
                  {m.jumlah} produk
                </span>
              </div>
            </Link>
          ))}

        {grupMasalah && (
          <Link
            href={`/produk?grup=${grupMasalah}`}
            className="group flex flex-col items-start justify-center rounded-2xl border-2 border-dashed border-brand-200 p-5 transition-colors hover:border-brand-400 hover:bg-brand-50"
          >
            <span className="text-[17px] font-bold tracking-tight text-ink transition-colors group-hover:text-brand-600 lg:text-lg">
              Lihat semua
            </span>
            <span className="mt-1 text-sm leading-snug text-stone-600">
              Seluruh pengusir hama dalam satu halaman
            </span>
            <span aria-hidden="true" className="mt-3 text-xl font-bold text-brand-600">
              &rarr;
            </span>
          </Link>
        )}
      </div>

      {lainnya.length > 0 && (
        <div className="mt-12 border-t border-ink/10 pt-8">
          <p className="text-[15px] text-stone-500 font-semibold">
            Bukan soal hama?
          </p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {lainnya.map((g) => (
              <li key={g.slug}>
                <Link
                  href={`/produk?grup=${g.slug}`}
                  className="chip"
                >
                  {g.judul}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
