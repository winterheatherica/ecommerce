const masalah = [
  { nomor: "01", nama: "Kucing", keluhan: "Berak di teras & motor", slug: "kucing" },
  { nomor: "02", nama: "Tikus", keluhan: "Gerogoti kabel, bau plafon", slug: "tikus" },
  { nomor: "03", nama: "Kecoa", keluhan: "Muncul malam di dapur", slug: "kecoa" },
  { nomor: "04", nama: "Cicak", keluhan: "Kotoran di dinding", slug: "cicak" },
  { nomor: "05", nama: "Nyamuk", keluhan: "Gigitan malam di kamar", slug: "nyamuk" },
];

export default function ProblemPicker() {
  return (
    <section id="produk" className="mx-auto w-full max-w-6xl px-6 py-24">
      <p className="font-mono text-[11px] tracking-[0.28em] text-accent-600 uppercase">
        Cari berdasarkan masalah
      </p>
      <h2 className="mt-3 max-w-xl text-3xl leading-tight font-semibold tracking-tight text-ink sm:text-4xl">
        Hama apa yang lagi mengganggu?
      </h2>

      <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {masalah.map((m) => (
          <a
            key={m.slug}
            href={`/produk?kategori=${m.slug}`}
            className="group flex flex-col border border-ink/12 p-6 transition-colors hover:border-brand-500 hover:bg-brand-50"
          >
            <span className="font-mono text-[11px] tracking-[0.2em] text-accent-600">
              {m.nomor}
            </span>
            <span className="mt-12 text-xl font-semibold tracking-tight text-ink">
              {m.nama}
            </span>
            <span className="mt-2 text-sm leading-relaxed text-stone-500">
              {m.keluhan}
            </span>
            <span className="mt-6 font-mono text-sm text-stone-400 transition-colors group-hover:text-brand-600">
              &rarr;
            </span>
          </a>
        ))}
      </div>

      <p className="mt-10 font-mono text-[11px] tracking-[0.2em] text-stone-500 uppercase">
        Bukan soal hama?{" "}
        <a
          href="/produk?kategori=perawatan-kulit"
          className="border-b border-stone-300 pb-0.5 text-ink transition-colors hover:border-brand-600 hover:text-brand-600"
        >
          Lihat perawatan kulit &rarr;
        </a>
      </p>
    </section>
  );
}
