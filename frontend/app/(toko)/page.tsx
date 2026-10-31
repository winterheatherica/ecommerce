import type { Metadata } from "next";
import Image from "next/image";
import ProblemPicker from "@/app/components/problem-picker";
import FeaturedProducts from "@/app/components/featured-products";
import JsonLd from "@/app/components/json-ld";
import { ambilSemuaProduk, ambilSitus } from "@/app/lib/api";
import { NAMA_SITUS, RINGKASAN, metaHalaman, skemaToko } from "@/app/lib/seo";

export function generateMetadata(): Metadata {
  return metaHalaman({
    judul: "Beranda",
    judulUtuh: `${NAMA_SITUS} | Pengusir Hama Berbahan Dasar Alami`,
    ringkasan: RINGKASAN,
    path: "/",
  });
}

export default async function Home() {
  const [produk, { toko }] = await Promise.all([ambilSemuaProduk(), ambilSitus()]);

  return (
    <>
      <JsonLd data={skemaToko(toko)} />
      <section className="relative w-full overflow-hidden">
        <div className="absolute inset-0 lg:left-[56%]">
          <Image
            src="/banner.webp"
            alt=""
            fill
            priority
            sizes="(min-width: 1024px) 44vw, 100vw"
            className="object-cover object-center lg:object-right"
          />
        </div>

        <div className="absolute inset-0 bg-linear-to-r from-white/90 via-white/60 to-white/15 lg:hidden" />

        <div className="absolute inset-y-0 left-0 hidden w-[56%] bg-brand-600 lg:block" />

        <div className="relative z-10 mx-auto flex min-h-svh max-w-6xl flex-col justify-center px-6 pt-28 pb-14 lg:pt-[calc(4.8rem+2rem)] lg:pb-8">
          <div className="w-full max-w-xl lg:max-w-lg xl:max-w-[38rem]">
            <p className="text-sm font-bold tracking-[0.18em] text-brand-600 uppercase lg:text-[length:clamp(0.9375rem,2.1svh,1.125rem)] lg:text-brand-100">
              Pengusir hama alami
            </p>

            <h1 className="mt-4 text-5xl leading-[1.05] font-bold tracking-tight text-ink sm:text-7xl lg:text-[length:clamp(3.25rem,9.5svh,4.5rem)] lg:text-white xl:text-[length:clamp(3.5rem,10.5svh,5.5rem)] xl:whitespace-nowrap">
              Rumah bersih,
              <br />
              <span className="text-brand-600 lg:text-brand-200">
                bebas hama.
              </span>
            </h1>

            <p className="mt-5 max-w-md text-[17px] leading-relaxed font-medium text-stone-700 sm:text-[19px] lg:max-w-lg lg:text-[length:clamp(1.0625rem,2.6svh,1.4375rem)] lg:text-white/90">
              Pengusir hama berbahan dasar alami. Bekerja dengan aroma yang
              dihindari hama, bukan dengan racun.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3 sm:gap-4">
              <a href="#produk" className="tombol-oranye px-8 py-3 text-[17px] lg:px-10 lg:py-3.5 lg:text-[19px]">
                Lihat Produk
              </a>
              <a
                href="#kontak"
                className="tombol-garis px-8 py-3 text-[17px] lg:border-white lg:bg-transparent lg:px-10 lg:py-3.5 lg:text-[19px] lg:text-white lg:hover:bg-white/10"
              >
                Chat WhatsApp
              </a>
            </div>

            <ul className="mt-8 space-y-1.5 text-[15px] font-semibold text-stone-700 lg:text-[length:clamp(1rem,2.2svh,1.1875rem)] lg:text-white/85">
              <li>Berbahan dasar alami</li>
              <li>Mengusir, bukan membunuh</li>
            </ul>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-48 bg-linear-to-t from-accent-950/55 via-accent-900/20 to-transparent lg:hidden" />
      </section>

      <ProblemPicker produk={produk} />
      <FeaturedProducts produk={produk} />
    </>
  );
}
