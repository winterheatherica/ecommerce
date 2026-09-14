"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menu = [
  { href: "/admin", label: "Ringkasan" },
  { href: "/admin/pesanan", label: "Pesanan" },
  { href: "/admin/produk", label: "Produk" },
];

export default function AdminNav() {
  const pathname = usePathname();

  const aktif = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <aside className="border-b border-ink/10 bg-white lg:w-60 lg:shrink-0 lg:border-r lg:border-b-0">
      <div className="flex items-center justify-between gap-4 px-6 py-6 lg:block">
        <div>
          <p className="font-mono text-xs tracking-[0.28em] text-ink uppercase">
            Menik Store
          </p>
          <p className="mt-1 font-mono text-[10px] tracking-[0.2em] text-brand-600 uppercase">
            Admin
          </p>
        </div>

        <nav className="flex gap-1 lg:mt-8 lg:flex-col">
          {menu.map((m) => (
            <a
              key={m.href}
              href={m.href}
              aria-current={aktif(m.href) ? "page" : undefined}
              className={`px-3 py-2 text-sm transition-colors lg:-mx-3 ${
                aktif(m.href)
                  ? "bg-brand-50 font-medium text-brand-700"
                  : "text-stone-600 hover:bg-stone-100 hover:text-ink"
              }`}
            >
              {m.label}
            </a>
          ))}
        </nav>
      </div>

      <div className="hidden px-6 pb-6 lg:block">
        <Link
          href="/"
          className="font-mono text-[10px] tracking-[0.2em] text-stone-400 uppercase transition-colors hover:text-brand-600"
        >
          &larr; Lihat toko
        </Link>
      </div>
    </aside>
  );
}
