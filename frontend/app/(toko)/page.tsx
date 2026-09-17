import type { Metadata } from "next";
import Image from "next/image";
import ProblemPicker from "@/app/components/problem-picker";
import FeaturedProducts from "@/app/components/featured-products";
import JsonLd from "@/app/components/json-ld";
import { NAMA_SITUS, RINGKASAN, metaHalaman, skemaToko } from "@/app/lib/seo";

export function generateMetadata(): Metadata {
  return metaHalaman({
    judul: "Beranda",
    judulUtuh: `${NAMA_SITUS} | Pengusir Hama Alami Berbahan Tumbuhan`,
    ringkasan: RINGKASAN,
    path: "/",
  });
}

export default function Home() {
  return (
    <>
      <JsonLd data={skemaToko()} />
      <section className="relative h-svh w-full overflow-hidden">
        <Image
          src="/banner.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />

        <div className="absolute inset-0 bg-linear-to-r from-white/90 via-white/60 to-white/15" />

        <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col justify-center px-6">
          <div className="max-w-xl">
            <p className="font-mono text-[11px] tracking-[0.28em] text-brand-600 uppercase">
              Pengusir hama alami
            </p>

            <h1 className="mt-6 text-5xl leading-[1.05] font-semibold tracking-tight text-ink sm:text-7xl">
              Rumah bersih,
              <br />
              <span className="text-brand-600">bebas hama.</span>
            </h1>

            <p className="mt-6 max-w-md leading-relaxed text-stone-600 sm:text-lg">
              Pengusir kucing, tikus, kecoa, dan cicak berbahan dasar tumbuhan.
              Bekerja dengan aroma yang dihindari hama, bukan dengan racun.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
              <a
                href="#produk"
                className="border border-ink px-8 py-3.5 font-mono text-[11px] tracking-[0.22em] text-ink uppercase transition-colors hover:bg-ink hover:text-white"
              >
                Lihat Produk
              </a>
              <a
                href="#kontak"
                className="font-mono text-[11px] tracking-[0.22em] text-stone-600 uppercase transition-colors hover:text-brand-600"
              >
                Chat WhatsApp &rarr;
              </a>
            </div>

            <div className="mt-14 space-y-2 font-mono text-[11px] tracking-[0.18em] text-stone-500 uppercase">
              <p>Berbahan dasar tumbuhan</p>
              <p>Mengusir, bukan membunuh</p>
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-48 bg-linear-to-t from-accent-950/60 via-accent-900/20 to-transparent" />
      </section>

      <ProblemPicker />
      <FeaturedProducts />
    </>
  );
}
