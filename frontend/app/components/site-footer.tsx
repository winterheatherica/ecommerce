import Image from "next/image";
import Link from "next/link";

import { renderSVG } from "uqr";

import { LOGO } from "@/app/data/logo-bayar";
import { ambilSitus } from "@/app/lib/api";
import { NAMA_SITUS } from "@/app/lib/seo";
import { kategoriDalamGrup } from "@/app/lib/situs";

const pembayaran = [
  LOGO.qris,
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

export default async function SiteFooter() {
  const situs = await ambilSitus();
  const { toko } = situs;

  const produk = [
    ...situs.grup.map((g) => ({ label: g.judul, href: `/produk?grup=${g.slug}` })),
    ...kategoriDalamGrup(situs, situs.grup[0]?.slug ?? "")
      .slice(0, 3)
      .map((k) => ({ label: k.judul, href: `/produk?kategori=${k.slug}` })),
  ];

  const bantuan = [
    { label: "Pertanyaan Umum", href: "/faq" },
    ...situs.faq.map((k) => ({ label: k.judul, href: `/faq#${k.id}` })),
    { label: "Lacak Pesanan", href: "/order" },
  ];

  const qr = `data:image/svg+xml,${encodeURIComponent(renderSVG(toko.waUrl, { border: 1 }))}`;

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
            <p className="text-[15px] font-bold text-oranye-700">
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
                href={toko.waUrl}
                className="tombol"
              >
                Chat WhatsApp
              </a>

              <div className="hidden items-center gap-4 lg:flex">
                <Image
                  src={qr}
                  alt={`Kode QR untuk chat WhatsApp ${NAMA_SITUS}`}
                  width={144}
                  height={144}
                  unoptimized
                  className="h-36 w-36 rounded-2xl border border-ink/10 bg-white p-2"
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
              <p className="flex items-center gap-3 text-[19px] font-extrabold tracking-tight text-white">
                <Image src="/logo-96.webp" alt="" width={44} height={44} className="h-11 w-11" />
                {NAMA_SITUS}
              </p>
              <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/55">
                Pengusir hama berbahan dasar alami. Bekerja dengan aroma yang
                dihindari hama, bukan dengan racun.
              </p>
              <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2">
                {toko.sosial.map((s) => (
                  <li key={s.label}>
                    <a
                      href={s.href}
                      className="text-[15px] font-bold text-white/80 transition-colors hover:text-white"
                    >
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid flex-1 gap-x-8 gap-y-12 sm:grid-cols-3">
              <div>
                <p className="text-[15px] font-bold text-white/60">
                  Produk
                </p>
                <ul className="mt-6 space-y-3">
                  {produk.map((p) => (
                    <li key={p.href}>
                      <Link
                        href={p.href}
                        className="text-[15px] text-white/80 transition-colors hover:text-white"
                      >
                        {p.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-[15px] font-bold text-white/60">
                  Bantuan
                </p>
                <ul className="mt-6 space-y-3">
                  {bantuan.map((b) => (
                    <li key={b.label}>
                      <Link
                        href={b.href}
                        className="text-[15px] text-white/80 transition-colors hover:text-white"
                      >
                        {b.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-[15px] font-bold text-white/60">
                  Kontak
                </p>
                <ul className="mt-6 space-y-4 text-[15px] text-white/80">
                  <li>
                    <a href={toko.waUrl} className="transition-colors hover:text-white">
                      {toko.waTampil}
                    </a>
                  </li>
                  <li className="leading-relaxed text-white/70">
                    {toko.alamatBaris.map((baris) => (
                      <span key={baris} className="block">
                        {baris}
                      </span>
                    ))}
                  </li>
                  <li className="leading-relaxed text-white/70">
                    <span className="block">{toko.hari}</span>
                    <span className="block">{toko.jam}</span>
                    {toko.libur && (
                      <span className="block">
                        {toko.libur.startsWith("libur") ? `Tutup saat ${toko.libur}` : `Libur ${toko.libur}`}
                      </span>
                    )}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[15px] font-bold text-white/60">
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
                <li key={l.src} className="flex h-8 items-center rounded-md bg-white px-1.5">
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
