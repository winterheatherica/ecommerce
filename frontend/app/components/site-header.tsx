"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import { useKeranjang } from "@/app/lib/keranjang";

const THRESHOLD = 8;
const TOP_ZONE = 80;

export default function SiteHeader() {
  const [hidden, setHidden] = useState(false);
  const [atTop, setAtTop] = useState(true);
  const lastY = useRef(0);
  const pathname = usePathname();
  const keranjang = useKeranjang();

  const jumlahItem = keranjang.reduce((n, i) => n + i.qty, 0);

  const aktif = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const sentuh = "py-3 -my-3";

  const kelasNav = (href: string) =>
    `${sentuh} ${
      aktif(href) ? "text-brand-600" : "transition-colors hover:text-brand-600"
    }`;

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
        atTop
          ? "border-transparent hover:border-ink/10 hover:bg-white/80 hover:shadow-sm hover:backdrop-blur-md"
          : "border-ink/10 bg-white/85 shadow-sm backdrop-blur-md",
      ].join(" ")}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link
          href="/"
          className={`${sentuh} shrink-0 font-mono text-xs tracking-[0.12em] whitespace-nowrap text-ink uppercase sm:text-sm sm:tracking-[0.35em]`}
        >
          Menik Store
        </Link>

        <nav className="flex shrink-0 items-center gap-4 font-mono text-[11px] tracking-[0.16em] text-ink/70 uppercase sm:gap-8 sm:tracking-[0.22em]">
          <Link
            href="/"
            aria-label="Beranda"
            title="Beranda"
            aria-current={aktif("/") ? "page" : undefined}
            className={`hidden sm:block ${kelasNav("/")}`}
          >
            <svg
              className="h-[18px] w-[18px]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.6}
              aria-hidden="true"
            >
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
            className={kelasNav("/produk")}
          >
            Produk
          </Link>
          <Link
            href="/faq"
            aria-current={aktif("/faq") ? "page" : undefined}
            className={kelasNav("/faq")}
          >
            FAQ
          </Link>
          <Link
            href="/keranjang"
            aria-label={
              jumlahItem > 0 ? `Keranjang, ${jumlahItem} item` : "Keranjang"
            }
            title="Keranjang"
            aria-current={aktif("/keranjang") ? "page" : undefined}
            className={`relative ${kelasNav("/keranjang")}`}
          >
            <svg
              className="h-[18px] w-[18px]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.6}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 3h1.5l2.1 11.2a1.5 1.5 0 0 0 1.48 1.22h8.9a1.5 1.5 0 0 0 1.47-1.18l1.6-7.24H5.1"
              />
              <circle cx="9" cy="19.5" r="1.25" />
              <circle cx="16.5" cy="19.5" r="1.25" />
            </svg>
            {jumlahItem > 0 && (
              <span className="absolute -top-2 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 font-mono text-[9px] leading-none text-white">
                {jumlahItem}
              </span>
            )}
          </Link>
          <a
            href="#kontak"
            className={`${sentuh} font-semibold text-ink transition-colors hover:text-brand-600`}
          >
            WhatsApp
          </a>
        </nav>
      </div>
    </header>
  );
}
