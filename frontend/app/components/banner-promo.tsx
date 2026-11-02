"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

import type { BannerPromo } from "@/app/lib/situs";

const JEDA_MS = 5000;
const KUERI_GERAK = "(prefers-reduced-motion: reduce)";

function ikutiGerakMinim(ubah: () => void) {
  const mq = window.matchMedia(KUERI_GERAK);
  mq.addEventListener("change", ubah);
  return () => mq.removeEventListener("change", ubah);
}

const tombolKontrol =
  "flex h-9 w-9 items-center justify-center rounded-full border-2 border-ink/15 bg-white text-ink transition-colors hover:border-brand-400 hover:text-brand-600";

export default function BannerPromoSlider({
  banner,
  lebar = false,
  prioritas = false,
}: {
  banner: BannerPromo[];
  lebar?: boolean;
  prioritas?: boolean;
}) {
  const akar = useRef<HTMLElement>(null);
  const jalur = useRef<HTMLDivElement>(null);
  const awalSentuh = useRef<{ x: number; y: number } | null>(null);
  const [aktif, setAktif] = useState(0);
  const [diputar, setDiputar] = useState(true);
  const [ditahan, setDitahan] = useState(false);
  const [terlihat, setTerlihat] = useState(false);
  const [perLayar, setPerLayar] = useState(lebar ? 2 : 1);
  const gerakMinim = useSyncExternalStore(
    ikutiGerakMinim,
    () => window.matchMedia(KUERI_GERAK).matches,
    () => false,
  );

  const posisi = Math.max(1, banner.length - perLayar + 1);
  const bisaGeser = posisi > 1;
  const aktifTampil = Math.min(aktif, posisi - 1);

  const keIndeks = useCallback(
    (i: number) => {
      const el = jalur.current;
      const tujuan = el?.children[i] as HTMLElement | undefined;
      if (!el || !tujuan) return;
      el.scrollTo({ left: tujuan.offsetLeft, behavior: gerakMinim ? "auto" : "smooth" });
    },
    [gerakMinim],
  );

  useEffect(() => {
    const el = jalur.current;
    if (!el) return;

    const ukur = () => {
      const [a, b] = el.children as unknown as HTMLElement[];
      const langkah = b ? b.offsetLeft - a.offsetLeft : el.clientWidth;
      if (langkah > 0) setAktif(Math.min(posisi - 1, Math.round(el.scrollLeft / langkah)));
    };

    el.addEventListener("scroll", ukur, { passive: true });
    return () => el.removeEventListener("scroll", ukur);
  }, [posisi]);

  useEffect(() => {
    const el = jalur.current;
    if (!el) return;

    const pengamat = new ResizeObserver(() => {
      const pertama = el.children[0] as HTMLElement | undefined;
      if (pertama && pertama.offsetWidth > 0) {
        setPerLayar(Math.max(1, Math.round((el.clientWidth + 16) / (pertama.offsetWidth + 16))));
      }
    });
    pengamat.observe(el);
    return () => pengamat.disconnect();
  }, []);

  useEffect(() => {
    const el = akar.current;
    if (!el) return;

    const pengamat = new IntersectionObserver(([e]) => setTerlihat(e.isIntersecting), { threshold: 0.5 });
    pengamat.observe(el);
    return () => pengamat.disconnect();
  }, []);

  useEffect(() => {
    if (!bisaGeser || !diputar || ditahan || !terlihat || gerakMinim) return;

    const t = window.setTimeout(() => keIndeks((aktifTampil + 1) % posisi), JEDA_MS);
    return () => window.clearTimeout(t);
  }, [aktifTampil, bisaGeser, diputar, ditahan, terlihat, gerakMinim, posisi, keIndeks]);

  if (banner.length === 0) return null;

  const otomatis = bisaGeser && diputar && !gerakMinim;
  const berhenti = () => setDiputar(false);

  return (
    <section
      ref={akar}
      aria-roledescription="carousel"
      aria-label="Banner promo"
      onMouseEnter={() => setDitahan(true)}
      onMouseLeave={() => setDitahan(false)}
      onFocus={berhenti}
    >
      <div
        ref={jalur}
        onTouchStart={(e) => {
          awalSentuh.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }}
        onTouchMove={(e) => {
          const awal = awalSentuh.current;
          if (!awal) return;
          const dx = Math.abs(e.touches[0].clientX - awal.x);
          if (dx > 12 && dx > Math.abs(e.touches[0].clientY - awal.y)) {
            awalSentuh.current = null;
            berhenti();
          }
        }}
        onWheel={(e) => {
          if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) berhenti();
        }}
        aria-live={otomatis && !ditahan ? "off" : "polite"}
        className={`relative flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
          banner.length === 1 ? "justify-center" : ""
        }`}
      >
        {banner.map((b, i) => {
          const gambar = (
            <Image
              src={b.url}
              alt={b.alt}
              width={b.lebar ?? 1200}
              height={b.tinggi ?? 600}
              sizes={lebar ? "(min-width: 1152px) 560px, 50vw" : "(min-width: 640px) 50vw, 100vw"}
              priority={prioritas && i === 0}
              className="aspect-[2/1] h-auto w-full rounded-2xl bg-brand-50 object-cover"
            />
          );
          const kelasTautan = "block rounded-2xl focus-visible:outline-offset-[-4px]";

          return (
            <div
              key={b.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} dari ${banner.length}`}
              className={`shrink-0 snap-start ${lebar ? "w-[calc((100%-1rem)/2)]" : "w-full sm:w-[calc((100%-1rem)/2)]"}`}
            >
              {b.link === null ? (
                gambar
              ) : b.link.startsWith("/") ? (
                <Link href={b.link} className={kelasTautan}>
                  {gambar}
                </Link>
              ) : (
                <a href={b.link} target="_blank" rel="noopener noreferrer" className={kelasTautan}>
                  {gambar}
                </a>
              )}
            </div>
          );
        })}
      </div>

      {bisaGeser && (
        <div className={`flex items-center justify-center gap-2 ${lebar ? "mt-5" : "mt-2.5 sm:mt-4"}`}>
          <button
            type="button"
            aria-label="Banner sebelumnya"
            onClick={() => {
              berhenti();
              keIndeks(aktifTampil === 0 ? posisi - 1 : aktifTampil - 1);
            }}
            className={`${tombolKontrol} ${lebar ? "" : "max-sm:hidden"}`}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="m15 18-6-6 6-6" />
            </svg>
          </button>

          <div className="flex items-center">
            {Array.from({ length: posisi }, (_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Tampilkan banner ${i + 1}`}
                aria-current={i === aktifTampil ? "true" : undefined}
                onClick={() => {
                  berhenti();
                  keIndeks(i);
                }}
                className="flex h-7 min-w-7 items-center justify-center"
              >
                <span
                  className={`block h-2 rounded-full transition-all duration-300 ${
                    i === aktifTampil ? "w-6 bg-brand-500" : "w-2 bg-ink/25"
                  }`}
                />
              </button>
            ))}
          </div>

          <button
            type="button"
            aria-label="Banner berikutnya"
            onClick={() => {
              berhenti();
              keIndeks((aktifTampil + 1) % posisi);
            }}
            className={`${tombolKontrol} ${lebar ? "" : "max-sm:hidden"}`}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>
      )}
    </section>
  );
}
