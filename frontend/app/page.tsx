import Image from "next/image";
import ProblemPicker from "./components/problem-picker";
import FeaturedProducts from "./components/featured-products";

export default function Home() {
  return (
    <>
      <section className="relative h-svh w-full overflow-hidden">
        <Image
          src="/banner.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />

        <div className="absolute inset-0 bg-linear-to-r from-white/90 via-white/60 to-white/15" />

        <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col justify-center px-6">
          <div className="max-w-xl">
            <p className="font-mono text-[11px] tracking-[0.28em] text-brand-600 uppercase">
              Pengusir hama alami
            </p>

            <h1 className="mt-6 text-5xl leading-[1.05] font-semibold tracking-tight text-ink sm:text-7xl">
              Rumah bersih,
              <br />
              <span className="text-brand-600">bebas hama.</span>
            </h1>

            <p className="mt-6 max-w-md leading-relaxed text-stone-600 sm:text-lg">
              Pengusir kucing, tikus, kecoa, dan cicak berbahan alami. Aman untuk
              keluarga dan hewan peliharaan.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
              <a
                href="#produk"
                className="border border-ink px-8 py-3.5 font-mono text-[11px] tracking-[0.22em] text-ink uppercase transition-colors hover:bg-ink hover:text-white"
              >
                Lihat Produk
              </a>
              <a
                href="#kontak"
                className="font-mono text-[11px] tracking-[0.22em] text-stone-600 uppercase transition-colors hover:text-brand-600"
              >
                Chat WhatsApp &rarr;
              </a>
            </div>

            <div className="mt-14 space-y-2 font-mono text-[11px] tracking-[0.18em] text-stone-500 uppercase">
              <p>Terdaftar Kemenkes RI PKD</p>
              <p>Non-toksik &middot; Berbahan alami</p>
              <p>
                Efektivitas <span className="text-brand-600">&gt; 95%</span>
              </p>
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-48 bg-linear-to-t from-accent-950/60 via-accent-900/20 to-transparent" />
      </section>

      <ProblemPicker />
      <FeaturedProducts />
    </>
  );
}
