import type { Metadata } from "next";
import Image from "next/image";
import BannerPromoSlider from "@/app/components/banner-promo";
import ProblemPicker from "@/app/components/problem-picker";
import FeaturedProducts from "@/app/components/featured-products";
import JsonLd from "@/app/components/json-ld";
import { ambilSemuaProduk, ambilSitus } from "@/app/lib/api";
import { NAMA_SITUS, RINGKASAN, metaHalaman, skemaToko } from "@/app/lib/seo";

const ALASAN = [
  "Toko kami sejak 2018 (rating bagus di marketplace Shopee, TikTok dan Tokopedia)",
  "Pembayaran aman bermitra DOKU (QRIS dan Virtual Account)",
  "Packing aman dan pengiriman bisa dilacak/dimonitor setiap saat",
  "Harga lebih murah dibanding harga marketplace",
];

export function generateMetadata(): Metadata {
  return metaHalaman({
    judul: "Beranda",
    judulUtuh: `${NAMA_SITUS} | Pengusir Hama Berbahan Dasar Alami`,
    ringkasan: RINGKASAN,
    path: "/",
  });
}

export default async function Home() {
  const [produk, { toko, banner }] = await Promise.all([ambilSemuaProduk(), ambilSitus()]);

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

        <div className="absolute inset-0 bg-linear-to-b from-white/90 via-white/75 to-white/85 lg:hidden" />

        <div className="absolute inset-y-0 left-0 hidden w-[56%] bg-brand-600 lg:block" />

        <div className="relative z-10 mx-auto flex min-h-[min(100svh,1080px)] max-w-6xl flex-col px-6 pt-[5.5rem] pb-8 sm:pt-24 lg:justify-center lg:pt-[calc(4.8rem+2rem)]">
          {banner.length > 0 && (
            <div className="mb-7 w-full lg:hidden">
              <BannerPromoSlider banner={banner} prioritas />
            </div>
          )}

          <div className="w-full max-w-xl md:max-w-3xl lg:max-w-lg xl:max-w-[38rem]">
            <p className="text-sm font-bold tracking-[0.18em] text-brand-600 uppercase lg:text-[length:clamp(0.9375rem,2.1svh,1.125rem)] lg:text-brand-100">
              Pengusir hama alami
            </p>

            <h1 className="mt-3 text-[2.125rem] leading-[1.08] font-bold tracking-tight text-balance text-ink max-[359px]:text-[1.875rem] sm:text-5xl lg:mt-4 lg:text-[length:clamp(2.5rem,6.6svh,3.375rem)] lg:text-white xl:text-[length:clamp(2.75rem,6.4svh,3.875rem)]">
              Rumah Nyaman, Bersih, dan{" "}
              <span className="text-brand-600 lg:text-brand-200">Bebas Gangguan Hama</span>
            </h1>

            <p className="mt-4 text-[16px] leading-relaxed font-medium text-stone-700 sm:text-[18px] md:max-w-2xl lg:mt-5 lg:text-[length:clamp(1rem,2.45svh,1.25rem)] lg:text-white/90">
              Solusi pengusir hama berbahan dasar alami yang bekerja melalui aroma yang tidak disukai hama. Membantu
              menjaga kenyamanan rumah tanpa mengandalkan racun pembasmi.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:gap-4 lg:mt-7">
              <a
                href="#produk"
                className="tombol-oranye px-3 py-3 text-[15px] max-[359px]:px-2 max-[359px]:text-[14px] sm:px-8 sm:text-[17px] lg:px-10 lg:py-3.5 lg:text-[19px]"
              >
                Lihat Produk
              </a>
              <a
                href="#kontak"
                className="tombol-garis px-3 py-3 text-[15px] max-[359px]:px-2 max-[359px]:text-[14px] sm:px-8 sm:text-[17px] lg:border-white lg:bg-transparent lg:px-10 lg:py-3.5 lg:text-[19px] lg:text-white lg:hover:bg-white/10"
              >
                Chat WhatsApp
              </a>
            </div>

            <div className="mt-8 lg:mt-[clamp(1.5rem,4svh,2.5rem)]">
              <h2 className="text-[19px] font-extrabold tracking-tight text-brand-700 lg:text-[length:clamp(1.125rem,2.7svh,1.4375rem)] lg:text-white">
                Mengapa memilih toko kami?
              </h2>
              <ul className="mt-3 space-y-2.5 text-[16px] leading-snug font-semibold text-brand-700 sm:text-[17px] md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-3 md:space-y-0 lg:block lg:space-y-[clamp(0.375rem,1.1svh,0.625rem)] lg:text-[length:clamp(1rem,2.35svh,1.1875rem)] lg:font-medium lg:text-white/90">
                {ALASAN.map((a) => (
                  <li key={a} className="flex gap-2.5">
                    <svg
                      className="mt-[0.1em] h-[1.2em] w-[1.2em] shrink-0 text-oranye-600 lg:text-brand-200"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.75}
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="m5 12.5 4.5 4.5L19 7.5" />
                    </svg>
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {banner.length > 0 && (
        <div className="mx-auto hidden w-full max-w-6xl px-6 pt-14 lg:block">
          <BannerPromoSlider banner={banner} lebar />
        </div>
      )}

      <ProblemPicker produk={produk} />
      <FeaturedProducts produk={produk} />
    </>
  );
}
