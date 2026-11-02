"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import { useKeranjang } from "@/app/lib/keranjang";

const THRESHOLD = 8;
const TOP_ZONE = 80;

const ikon = "h-[22px] w-[22px]";
const sentuh = "flex min-h-11 min-w-11 items-center justify-center";

export default function SiteHeader({ masuk = false }: { masuk?: boolean }) {
  const [hidden, setHidden] = useState(false);
  const [atTop, setAtTop] = useState(true);
  const [menuBuka, setMenuBuka] = useState(false);
  const lastY = useRef(0);
  const kepala = useRef<HTMLElement>(null);
  const tombolMenu = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const keranjang = useKeranjang();

  const jumlahItem = keranjang.reduce((n, i) => n + i.qty, 0);
  const hrefAkun = masuk ? "/akun" : "/masuk";

  const aktif = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const kelasNav = (href: string) =>
    `${sentuh} ${aktif(href) ? "text-brand-600" : "text-ink transition-colors hover:text-brand-600"}`;

  const tutupMenu = () => setMenuBuka(false);

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

  useEffect(() => {
    if (!menuBuka) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setMenuBuka(false);
      tombolMenu.current?.focus();
    };
    const onLuar = (e: PointerEvent) => {
      if (!kepala.current?.contains(e.target as Node)) setMenuBuka(false);
    };
    const onLebar = () => {
      if (window.matchMedia("(min-width: 1024px)").matches) setMenuBuka(false);
    };

    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onLuar);
    window.addEventListener("resize", onLebar);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onLuar);
      window.removeEventListener("resize", onLebar);
    };
  }, [menuBuka]);

  const tautanKeranjang = (
    <Link
      href="/keranjang"
      onClick={tutupMenu}
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
  );

  const menuHp = [
    { href: "/", label: "Beranda" },
    { href: "/produk", label: "Produk" },
    { href: "/faq", label: "FAQ" },
    { href: "/order", label: "Lacak pesanan" },
    { href: hrefAkun, label: masuk ? "Akun saya" : "Masuk" },
  ];

  return (
    <header
      ref={kepala}
      className={[
        "fixed inset-x-0 top-0 z-50 border-b",
        "transition-[translate,background-color,border-color,box-shadow] duration-300 ease-out",
        hidden && !menuBuka ? "-translate-y-full" : "translate-y-0",
        "lg:border-ink/10 lg:bg-white/95",
        menuBuka
          ? "border-ink/10 bg-white shadow-sm"
          : atTop
            ? "border-transparent shadow-none"
            : "border-ink/10 bg-white/95 shadow-sm",
      ].join(" ")}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6 lg:py-4">
        <Link
          href="/"
          onClick={tutupMenu}
          aria-label="Menik Store, ke beranda"
          className="flex min-h-11 min-w-0 items-center gap-2.5 text-ink"
        >
          <Image src="/logo-96.webp" alt="" width={40} height={40} className="h-10 w-10 shrink-0" priority />
          <span className="flex min-w-0 flex-col">
            <span className="text-[17px] leading-tight font-extrabold tracking-tight whitespace-nowrap sm:text-[19px]">
              Menik Store
            </span>
            <span className="text-[11px] leading-snug font-semibold text-balance text-stone-500 sm:text-[12px]">
              We deliver your needs&nbsp;- Trusted online store
            </span>
          </span>
        </Link>

        <nav aria-label="Menu utama" className="hidden shrink-0 items-center gap-2 text-[17px] font-bold lg:flex">
          <Link
            href="/"
            aria-label="Beranda"
            title="Beranda"
            aria-current={aktif("/") ? "page" : undefined}
            className={kelasNav("/")}
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
            className={`${kelasNav("/produk")} px-3`}
          >
            Produk
          </Link>
          <Link href="/faq" aria-current={aktif("/faq") ? "page" : undefined} className={`${kelasNav("/faq")} px-3`}>
            FAQ
          </Link>
          <Link
            href={hrefAkun}
            aria-label={masuk ? "Akun" : "Masuk"}
            title={masuk ? "Akun" : "Masuk"}
            aria-current={aktif(hrefAkun) ? "page" : undefined}
            className={kelasNav(hrefAkun)}
          >
            <svg className={ikon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 20.12a7.5 7.5 0 0 1 15 0A17.93 17.93 0 0 1 12 21.75c-2.68 0-5.22-.58-7.5-1.63Z"
              />
            </svg>
          </Link>
          {tautanKeranjang}
          <a href="#kontak" className="tombol tombol-kecil ml-2">
            WhatsApp
          </a>
        </nav>

        <div className="flex shrink-0 items-center lg:hidden">
          {tautanKeranjang}
          <button
            ref={tombolMenu}
            type="button"
            aria-expanded={menuBuka}
            aria-controls="menu-hp"
            aria-label={menuBuka ? "Tutup menu" : "Buka menu"}
            onClick={() => setMenuBuka((v) => !v)}
            className={`${sentuh} text-ink transition-colors hover:text-brand-600`}
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              {menuBuka ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6 6 18" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {menuBuka && (
        <nav id="menu-hp" aria-label="Menu utama" className="border-t border-ink/10 bg-white lg:hidden">
          <ul className="mx-auto max-w-6xl px-2 py-2 sm:px-4">
            {menuHp.map((m) => (
              <li key={m.href}>
                <Link
                  href={m.href}
                  onClick={tutupMenu}
                  aria-current={aktif(m.href) ? "page" : undefined}
                  className={`flex min-h-12 items-center justify-between rounded-xl px-3 text-[17px] font-bold transition-colors hover:bg-brand-50 ${
                    aktif(m.href) ? "text-brand-600" : "text-ink"
                  }`}
                >
                  {m.label}
                  <svg className="h-4 w-4 text-stone-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6" />
                  </svg>
                </Link>
              </li>
            ))}
          </ul>
          <div className="mx-auto max-w-6xl px-4 pb-4 sm:px-6">
            <a href="#kontak" onClick={tutupMenu} className="tombol w-full">
              Chat WhatsApp
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}
