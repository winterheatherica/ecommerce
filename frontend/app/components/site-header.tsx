export default function SiteHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-transparent transition-[background-color,backdrop-filter,border-color,box-shadow] duration-300 hover:border-ink/10 hover:bg-white/80 hover:shadow-sm hover:backdrop-blur-md">
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
