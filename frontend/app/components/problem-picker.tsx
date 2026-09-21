import Image from "next/image";
import Link from "next/link";

import { type Kategori, type Produk } from "../data/produk";

const masalah: { nama: string; keluhan: string; slug: Kategori }[] = [
  { nama: "Kucing", keluhan: "Berak di teras & motor", slug: "kucing" },
  { nama: "Tikus", keluhan: "Gerogoti kabel, bau plafon", slug: "tikus" },
  { nama: "Kecoa", keluhan: "Muncul malam di dapur", slug: "kecoa" },
  { nama: "Cicak", keluhan: "Kotoran di dinding", slug: "cicak" },
  { nama: "Nyamuk", keluhan: "Gigitan malam di kamar", slug: "nyamuk" },
  { nama: "Semut", keluhan: "Antri di lemari makanan", slug: "semut" },
  { nama: "Lalat", keluhan: "Kerumunan dekat tempat sampah", slug: "lalat" },
  { nama: "Ular", keluhan: "Masuk lewat kebun & selokan", slug: "ular" },
  { nama: "Musang", keluhan: "Berisik di plafon malam hari", slug: "musang" },
  { nama: "Laba-laba", keluhan: "Sarang di sudut plafon", slug: "laba-laba" },
  { nama: "Rayap", keluhan: "Kusen dan perabot kayu", slug: "rayap" },
  { nama: "Siput", keluhan: "Merusak tanaman di kebun", slug: "siput" },
  { nama: "Kutu kasur", keluhan: "Gatal di kasur dan sofa", slug: "kutu-kasur" },
];

const lainnya = [
  { label: "Kebutuhan hewan peliharaan", href: "/produk?grup=hewan" },
  { label: "Perawatan rumah & barang", href: "/produk?grup=rumah" },
  { label: "Paket hemat", href: "/produk?grup=paket" },
];

function wajah(produk: Produk[], kategori: Kategori): Produk | undefined {
  const sekategori = produk.filter((p) => p.kategori === kategori);

  return (
    [...sekategori]
      .filter((p) => p.gambar)
      .sort((a, b) => b.terjualPerBulan - a.terjualPerBulan)[0] ?? sekategori[0]
  );
}

export default function ProblemPicker({ produk }: { produk: Produk[] }) {
  return (
    <section id="produk" className="mx-auto w-full max-w-6xl px-6 py-24">
      <p className="font-mono text-[11px] tracking-[0.28em] text-accent-600 uppercase">
        Cari berdasarkan masalah
      </p>
      <h2 className="mt-3 max-w-xl text-3xl leading-tight font-semibold tracking-tight text-ink sm:text-4xl">
        Hama apa yang lagi mengganggu?
      </h2>

      <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {masalah.map((m) => {
          const contoh = wajah(produk, m.slug);
          const jumlah = produk.filter((p) => p.kategori === m.slug).length;

          return (
            <Link
              key={m.slug}
              href={`/produk?kategori=${m.slug}`}
              className="group flex flex-col border border-ink/12 transition-colors hover:border-brand-500"
            >
              <div className="relative aspect-square overflow-hidden bg-brand-50">
                {contoh?.gambar ? (
                  <Image
                    src={contoh.gambar}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center font-mono text-[10px] tracking-[0.2em] text-brand-300 uppercase">
                    {m.nama}
                  </span>
                )}
              </div>

              <div className="flex flex-1 flex-col p-4">
                <span className="text-base font-semibold tracking-tight text-ink transition-colors group-hover:text-brand-600">
                  {m.nama}
                </span>
                <span className="mt-1 text-xs leading-relaxed text-stone-500">
                  {m.keluhan}
                </span>
                {jumlah > 0 && (
                  <span className="mt-3 font-mono text-[10px] tracking-[0.16em] text-stone-400 uppercase">
                    {jumlah} produk
                  </span>
                )}
              </div>
            </Link>
          );
        })}

        <Link
          href="/produk?grup=hama"
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
      </div>

      <div className="mt-12 border-t border-ink/10 pt-8">
        <p className="font-mono text-[11px] tracking-[0.2em] text-stone-500 uppercase">
          Bukan soal hama?
        </p>
        <ul className="mt-4 flex flex-wrap gap-x-8 gap-y-3">
          {lainnya.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="border-b border-stone-300 pb-0.5 text-sm text-ink transition-colors hover:border-brand-600 hover:text-brand-600"
              >
                {l.label} &rarr;
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
