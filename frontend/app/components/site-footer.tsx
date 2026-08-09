import Image from "next/image";

const produk = [
  "Pengusir Kucing",
  "Pengusir Tikus",
  "Pengusir Kecoa",
  "Pengusir Cicak",
  "Pengusir Nyamuk",
  "Perawatan Kulit",
];

const bantuan = [
  "Cara Pemesanan",
  "Lacak Pesanan",
  "Ongkos Kirim",
  "Pengembalian Barang",
  "Pertanyaan Umum",
];

const sosial = ["WhatsApp", "Instagram", "TikTok", "Shopee"];

const pembayaran = ["BCA", "Mandiri", "BNI", "QRIS", "GoPay", "OVO", "DANA"];

export default function SiteFooter() {
  return (
    <footer id="kontak">
      <section className="relative isolate overflow-hidden">
        <Image
          src="/footer-cropped.jpg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-center"
        />

        <div className="absolute inset-0 bg-linear-to-r from-white/90 via-white/55 to-transparent" />
        <div className="absolute inset-x-0 top-0 h-44 bg-linear-to-b from-brand-500/35 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-44 bg-linear-to-t from-accent-950 from-0% via-accent-950/55 via-42% to-transparent" />

        <div className="relative mx-auto max-w-6xl px-6 pt-28 pb-56">
          <div className="max-w-lg">
            <p className="font-mono text-[11px] tracking-[0.28em] text-brand-700 uppercase">
              Butuh bantuan?
            </p>
            <h2 className="mt-5 text-3xl leading-tight font-semibold tracking-tight text-ink sm:text-4xl">
              Bingung pilih yang mana?
            </h2>
            <p className="mt-4 max-w-md leading-relaxed text-stone-600">
              Ceritakan masalahnya, kami bantu pilihkan. Dibalas rata-rata dalam
              satu jam pada hari kerja.
            </p>
            <a
              href="https://wa.me/6281234567890"
              className="mt-8 inline-block border border-ink px-8 py-3.5 font-mono text-[11px] tracking-[0.22em] text-ink uppercase transition-colors hover:bg-ink hover:text-white"
            >
              Chat WhatsApp
            </a>
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
                Pengusir hama berbahan dasar tumbuhan. Aman untuk keluarga dan
                hewan peliharaan, tanpa bahan sintetis.
              </p>
              <p className="mt-5 font-mono text-[11px] tracking-[0.18em] text-white/40 uppercase">
                Terdaftar Kemenkes RI PKD
                <br />
                20601321378
              </p>
              <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2">
                {sosial.map((s) => (
                  <li key={s}>
                    <a
                      href="#"
                      className="font-mono text-[11px] tracking-[0.18em] text-white/60 uppercase transition-colors hover:text-brand-400"
                    >
                      {s}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid flex-1 gap-x-8 gap-y-12 sm:grid-cols-3">
              <div>
                <p className="font-mono text-[11px] tracking-[0.28em] text-white/40 uppercase">
                  Produk
                </p>
                <ul className="mt-6 space-y-3">
                  {produk.map((p) => (
                    <li key={p}>
                      <a
                        href="#produk"
                        className="text-sm text-white/70 transition-colors hover:text-white"
                      >
                        {p}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="font-mono text-[11px] tracking-[0.28em] text-white/40 uppercase">
                  Bantuan
                </p>
                <ul className="mt-6 space-y-3">
                  {bantuan.map((b) => (
                    <li key={b}>
                      <a
                        href="#"
                        className="text-sm text-white/70 transition-colors hover:text-white"
                      >
                        {b}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="font-mono text-[11px] tracking-[0.28em] text-white/40 uppercase">
                  Kontak
                </p>
                <ul className="mt-6 space-y-4 text-sm text-white/70">
                  <li>
                    <a href="https://wa.me/6281234567890" className="transition-colors hover:text-white">
                      0812&#8209;3456&#8209;7890
                    </a>
                  </li>
                  <li>
                    <a href="mailto:halo@menikstore.id" className="transition-colors hover:text-white">
                      halo@menikstore.id
                    </a>
                  </li>
                  <li className="leading-relaxed text-white/55">
                    Jl. Contoh Alamat No. 12
                    <br />
                    Bandung, Jawa Barat 40123
                  </li>
                  <li className="leading-relaxed text-white/55">
                    Senin&ndash;Sabtu, 08.00&ndash;17.00 WIB
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-mono text-[11px] tracking-[0.18em] text-white/40 uppercase">
              &copy; 2026 Menik Store &middot; Kebijakan Privasi &middot; Syarat &amp; Ketentuan
            </p>
            <ul className="flex flex-wrap gap-2">
              {pembayaran.map((p) => (
                <li
                  key={p}
                  className="border border-white/15 px-2.5 py-1 font-mono text-[10px] tracking-[0.12em] text-white/50 uppercase"
                >
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
