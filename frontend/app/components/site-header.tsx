"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import { useKeranjang } from "@/app/lib/keranjang";

const THRESHOLD = 8;
const TOP_ZONE = 80;

const ikon = "h-[22px] w-[22px]";

export default function SiteHeader({ masuk = false }: { masuk?: boolean }) {
  const [hidden, setHidden] = useState(false);
  const [atTop, setAtTop] = useState(true);
  const lastY = useRef(0);
  const pathname = usePathname();
  const keranjang = useKeranjang();

  const jumlahItem = keranjang.reduce((n, i) => n + i.qty, 0);

  const aktif = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const sentuh = "flex min-h-11 min-w-11 items-center justify-center";

  const kelasNav = (href: string) =>
    `${sentuh} ${aktif(href) ? "text-brand-600" : "text-ink transition-colors hover:text-brand-600"}`;

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastY.current;

      setAtTop(y < TOP_ZONE);

      if (Math.abs(delta) > THRESHOLD) {
        setHidden(delta > 0 && y > TOP_ZONE);
        lastY.current = y;
      }
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={[
        "fixed inset-x-0 top-0 z-50 border-b",
        "transition-[translate,background-color,border-color,box-shadow] duration-300 ease-out",
        hidden ? "-translate-y-full" : "translate-y-0",
        "lg:border-ink/10 lg:bg-white/95",
        atTop ? "border-transparent shadow-none" : "border-ink/10 bg-white/95 shadow-sm",
      ].join(" ")}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
        <Link href="/" aria-label="Menik Store, ke beranda" className="flex min-h-11 shrink-0 items-center gap-2.5 text-ink">
          <Image src="/logo-96.webp" alt="" width={40} height={40} className="h-9 w-9 sm:h-10 sm:w-10" priority />
          <span className="hidden text-[17px] font-extrabold tracking-tight whitespace-nowrap min-[460px]:inline sm:text-[19px]">Menik Store</span>
        </Link>

        <nav className="flex shrink-0 items-center gap-0.5 text-[16px] font-bold sm:gap-2 sm:text-[17px]">
          <Link
            href="/"
            aria-label="Beranda"
            title="Beranda"
            aria-current={aktif("/") ? "page" : undefined}
            className={`hidden sm:flex ${kelasNav("/")}`}
          >
            <svg className={ikon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 10.5 12 3l9 7.5M5.25 9.75v9a1.5 1.5 0 0 0 1.5 1.5H9.75v-5.25a1.5 1.5 0 0 1 1.5-1.5h1.5a1.5 1.5 0 0 1 1.5 1.5v5.25h3a1.5 1.5 0 0 0 1.5-1.5v-9"
              />
            </svg>
          </Link>
          <Link
            href="/produk"
            aria-current={aktif("/produk") ? "page" : undefined}
            className={`${kelasNav("/produk")} px-2 sm:px-3`}
          >
            Produk
          </Link>
          <Link
            href="/faq"
            aria-current={aktif("/faq") ? "page" : undefined}
            className={`hidden min-[340px]:flex ${kelasNav("/faq")} px-2 sm:px-3`}
          >
            FAQ
          </Link>
          <Link
            href={masuk ? "/akun" : "/masuk"}
            aria-label={masuk ? "Akun" : "Masuk"}
            title={masuk ? "Akun" : "Masuk"}
            aria-current={aktif(masuk ? "/akun" : "/masuk") ? "page" : undefined}
            className={kelasNav(masuk ? "/akun" : "/masuk")}
          >
            <svg className={ikon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 20.12a7.5 7.5 0 0 1 15 0A17.93 17.93 0 0 1 12 21.75c-2.68 0-5.22-.58-7.5-1.63Z"
              />
            </svg>
          </Link>
          <Link
            href="/keranjang"
            aria-label={jumlahItem > 0 ? `Keranjang, ${jumlahItem} item` : "Keranjang"}
            title="Keranjang"
            aria-current={aktif("/keranjang") ? "page" : undefined}
            className={`relative ${sentuh} text-brand-400 transition-colors hover:text-brand-600`}
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 3h1.5l2.1 11.2a1.5 1.5 0 0 0 1.48 1.22h8.9a1.5 1.5 0 0 0 1.47-1.18l1.6-7.24H5.1"
              />
              <circle cx="9" cy="19.5" r="1.25" />
              <circle cx="16.5" cy="19.5" r="1.25" />
            </svg>
            {jumlahItem > 0 && (
              <span className="absolute top-0.5 right-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-oranye-600 px-1 text-[12px] leading-none font-bold text-white">
                {jumlahItem}
              </span>
            )}
          </Link>
          <a
            href="#kontak"
            aria-label="WhatsApp"
            title="WhatsApp"
            className={`${sentuh} text-ink transition-colors hover:text-brand-600 sm:hidden`}
          >
            <svg className={ikon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 20.25c4.97 0 9-3.69 9-8.25s-4.03-8.25-9-8.25S3 7.44 3 12c0 2.1.86 4.02 2.27 5.48.43.45.74 1.04.59 1.64a4.48 4.48 0 0 1-.92 1.79A5.97 5.97 0 0 0 6 21c1.28 0 2.47-.4 3.45-1.09.81.22 1.67.34 2.55.34Z"
              />
            </svg>
          </a>
          <a href="#kontak" className="tombol tombol-kecil ml-2 hidden sm:inline-flex">
            WhatsApp
          </a>
        </nav>
      </div>
    </header>
  );
}
