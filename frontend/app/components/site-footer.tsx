import Image from "next/image";
import Link from "next/link";

import { KELOMPOK_FAQ } from "@/app/data/faq";
import { KONTAK, SOSIAL, WA_URL } from "@/app/data/kontak";
import { LOGO } from "@/app/data/logo-bayar";
import {
  GRUP,
  KATEGORI,
  SEMUA_GRUP,
  kategoriDalamGrup,
} from "@/app/data/produk";

const produk = [
  ...SEMUA_GRUP.map((g) => ({
    label: GRUP[g].judul,
    href: `/produk?grup=${g}`,
  })),
  ...kategoriDalamGrup("hama")
    .slice(0, 3)
    .map((k) => ({
      label: KATEGORI[k].judul,
      href: `/produk?kategori=${k}`,
    })),
];

const bantuan = [
  { label: "Pertanyaan Umum", href: "/faq" },
  ...KELOMPOK_FAQ.map((k) => ({ label: k.judul, href: `/faq#${k.id}` })),
  { label: "Lacak Pesanan", href: "/order" },
];

const pembayaran = [
  LOGO.bni,
  LOGO.bri,
  LOGO.mandiri,
  LOGO.bsi,
  LOGO.cimb,
  LOGO.permata,
  LOGO.danamon,
  LOGO.btn,
  LOGO.indomaret,
  LOGO.alfamart,
];

const skalaLogo = 0.65;

export default function SiteFooter() {
  return (
    <footer id="kontak">
      <section className="relative isolate overflow-hidden">
        <Image
          src="/footer.webp"
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-center"
        />

        <div className="absolute inset-0 bg-linear-to-r from-white/90 via-white/55 to-transparent" />
        <div className="absolute inset-x-0 top-0 h-40 bg-linear-to-b from-white/45 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(to_top,#012241_0%,#012241db_7%,#012241ba_13%,#0122419c_20%,#01224181_27%,#01224169_33%,#01224154_40%,#01224141_47%,#01224130_53%,#01224123_60%,#01224117_67%,#0122410e_73%,#01224108_80%,#01224103_87%,#01224101_93%,#01224100_100%)]" />

        <div className="relative mx-auto max-w-6xl px-6 pt-28 pb-56">
          <div className="max-w-lg">
            <p className="font-mono text-[13px] tracking-[0.28em] text-brand-700 uppercase">
              Butuh bantuan?
            </p>
            <h2 className="mt-5 text-3xl leading-tight font-semibold tracking-tight text-ink sm:text-4xl">
              Bingung pilih yang mana?
            </h2>
            <p className="mt-4 max-w-md leading-relaxed text-stone-600">
              Ceritakan masalahnya, kami bantu pilihkan. Dibalas rata-rata dalam
              satu jam pada hari kerja.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-6">
              <a
                href={WA_URL}
                className="inline-block border border-ink px-8 py-3.5 font-mono text-[13px] tracking-[0.22em] indent-[0.22em] text-ink uppercase transition-colors hover:bg-ink hover:text-white"
              >
                Chat WhatsApp
              </a>

              <div className="hidden items-center gap-4 lg:flex">
                <Image
                  src="/wa-qr.png"
                  alt="Kode QR untuk chat WhatsApp Menik Store"
                  width={144}
                  height={144}
                  unoptimized
                  className="h-36 w-36 border border-ink/10 bg-white p-1.5"
                />
                <p className="max-w-36 text-sm leading-relaxed text-stone-600">
                  Atau pindai pakai kamera HP untuk langsung chat.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="bg-accent-950">
        <div className="mx-auto max-w-6xl px-6 pt-16 pb-16">
          <div className="flex flex-col gap-14 lg:flex-row lg:gap-20">
            <div className="lg:w-72 lg:shrink-0">
              <p className="font-mono text-sm tracking-[0.35em] text-white uppercase">
                Menik Store
              </p>
              <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/55">
                Pengusir hama berbahan dasar alami. Bekerja dengan aroma yang
                dihindari hama, bukan dengan racun.
              </p>
              <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2">
                {SOSIAL.map((s) => (
                  <li key={s.label}>
                    <a
                      href={s.href}
                      className="font-mono text-[13px] tracking-[0.18em] text-white/60 uppercase transition-colors hover:text-brand-400"
                    >
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid flex-1 gap-x-8 gap-y-12 sm:grid-cols-3">
              <div>
                <p className="font-mono text-[13px] tracking-[0.28em] text-white/40 uppercase">
                  Produk
                </p>
                <ul className="mt-6 space-y-3">
                  {produk.map((p) => (
                    <li key={p.href}>
                      <Link
                        href={p.href}
                        className="text-sm text-white/70 transition-colors hover:text-white"
                      >
                        {p.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="font-mono text-[13px] tracking-[0.28em] text-white/40 uppercase">
                  Bantuan
                </p>
                <ul className="mt-6 space-y-3">
                  {bantuan.map((b) => (
                    <li key={b.label}>
                      <Link
                        href={b.href}
                        className="text-sm text-white/70 transition-colors hover:text-white"
                      >
                        {b.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="font-mono text-[13px] tracking-[0.28em] text-white/40 uppercase">
                  Kontak
                </p>
                <ul className="mt-6 space-y-4 text-sm text-white/70">
                  <li>
                    <a href={WA_URL} className="transition-colors hover:text-white">
                      {KONTAK.waTampil}
                    </a>
                  </li>
                  <li className="leading-relaxed text-white/55">
                    {KONTAK.alamatBaris.map((baris) => (
                      <span key={baris} className="block">
                        {baris}
                      </span>
                    ))}
                  </li>
                  <li className="leading-relaxed text-white/55">
                    <span className="block">{KONTAK.hari}</span>
                    <span className="block">{KONTAK.jam}</span>
                    <span className="block">Libur {KONTAK.libur}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-mono text-[13px] tracking-[0.18em] text-white/40 uppercase">
              &copy; 2026 Menik Store &middot;{" "}
              <Link
                href="/privasi"
                className="transition-colors hover:text-white"
              >
                Kebijakan Privasi
              </Link>
            </p>
            <ul aria-label="Metode pembayaran" className="flex flex-wrap gap-2">
              {pembayaran.map((l) => (
                <li key={l.src} className="flex h-8 items-center bg-white px-2">
                  <Image
                    src={l.src}
                    alt={l.nama}
                    title={l.nama}
                    width={Math.round(l.lebar * skalaLogo)}
                    height={Math.round(l.tinggi * skalaLogo)}
                    unoptimized
                  />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
