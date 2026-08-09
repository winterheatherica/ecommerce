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
        <a href="/" className="font-mono text-sm tracking-[0.35em] text-ink uppercase">
          Menik Store
        </a>

        <nav className="flex items-center gap-8 font-mono text-[11px] tracking-[0.22em] text-ink/70 uppercase">
          <a href="#produk" className="transition-colors hover:text-brand-600">
            Produk
          </a>
          <a href="#tentang" className="hidden transition-colors hover:text-brand-600 sm:block">
            Tentang
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
