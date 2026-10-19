"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menu = [
  { href: "/admin", label: "Ringkasan" },
  { href: "/admin/pesanan", label: "Pesanan" },
  { href: "/admin/produk", label: "Produk" },
];

export default function AdminNav({ urlKeluar }: { urlKeluar: string }) {
  const pathname = usePathname();

  const aktif = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <aside className="border-b border-ink/10 bg-white lg:w-60 lg:shrink-0 lg:border-r lg:border-b-0">
      <div className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-4 px-6 py-6 lg:block">
        <div>
          <p className="font-mono text-xs tracking-[0.28em] text-ink uppercase">
            Menik Store
          </p>
          <p className="mt-1 font-mono text-[12px] tracking-[0.2em] text-brand-600 uppercase">
            Admin
          </p>
        </div>

        <nav className="col-span-2 -mx-3 flex gap-1 lg:mx-0 lg:mt-8 lg:flex-col">
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

        <form method="post" action={urlKeluar} className="col-start-2 row-start-1 lg:mt-6">
          <button
            type="submit"
            className="-mr-3 px-3 py-2 text-left text-sm text-stone-500 transition-colors hover:bg-red-50 hover:text-red-700 lg:-mx-3 lg:w-[calc(100%+1.5rem)]"
          >
            Keluar
          </button>
        </form>
      </div>

      <div className="hidden px-6 pb-6 lg:block">
        <Link
          href="/"
          className="font-mono text-[12px] tracking-[0.2em] text-stone-400 uppercase transition-colors hover:text-brand-600"
        >
          &larr; Lihat toko
        </Link>
      </div>
    </aside>
  );
}
