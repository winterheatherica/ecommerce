"use client";

import { useEffect, useRef, useState } from "react";

const THRESHOLD = 8;
const TOP_ZONE = 80;

export default function SiteHeader() {
  const [hidden, setHidden] = useState(false);
  const [atTop, setAtTop] = useState(true);
  const lastY = useRef(0);

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
        <a
          href="/"
          className="shrink-0 font-mono text-xs tracking-[0.12em] whitespace-nowrap text-ink uppercase sm:text-sm sm:tracking-[0.35em]"
        >
          Menik Store
        </a>

        <nav className="flex shrink-0 items-center gap-4 font-mono text-[11px] tracking-[0.16em] text-ink/70 uppercase sm:gap-8 sm:tracking-[0.22em]">
          <a
            href="/"
            aria-label="Beranda"
            title="Beranda"
            className="transition-colors hover:text-brand-600"
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
          </a>
          <a href="/produk" className="transition-colors hover:text-brand-600">
            Produk
          </a>
          <a href="/faq" className="transition-colors hover:text-brand-600">
            FAQ
          </a>
          <a
            href="#kontak"
            className="border-b border-ink/40 pb-1 text-ink transition-colors hover:border-brand-600 hover:text-brand-600"
          >
            WhatsApp
          </a>
        </nav>
      </div>
    </header>
  );
}
