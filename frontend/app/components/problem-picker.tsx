import Link from "next/link";
const masalah = [
  { nomor: "01", nama: "Kucing", keluhan: "Berak di teras & motor", slug: "kucing" },
  { nomor: "02", nama: "Tikus", keluhan: "Gerogoti kabel, bau plafon", slug: "tikus" },
  { nomor: "03", nama: "Kecoa", keluhan: "Muncul malam di dapur", slug: "kecoa" },
  { nomor: "04", nama: "Cicak", keluhan: "Kotoran di dinding", slug: "cicak" },
  { nomor: "05", nama: "Nyamuk", keluhan: "Gigitan malam di kamar", slug: "nyamuk" },
  { nomor: "06", nama: "Semut", keluhan: "Antri di lemari makanan", slug: "semut" },
  { nomor: "07", nama: "Lalat", keluhan: "Kerumunan dekat tempat sampah", slug: "lalat" },
  { nomor: "08", nama: "Ular", keluhan: "Masuk lewat kebun & selokan", slug: "ular" },
  { nomor: "09", nama: "Musang", keluhan: "Berisik di plafon malam hari", slug: "musang" },
  { nomor: "10", nama: "Laba-laba", keluhan: "Sarang di sudut plafon", slug: "laba-laba" },
  { nomor: "11", nama: "Rayap", keluhan: "Kusen dan perabot kayu", slug: "rayap" },
  { nomor: "12", nama: "Siput", keluhan: "Merusak tanaman di kebun", slug: "siput" },
  { nomor: "13", nama: "Kutu kasur", keluhan: "Gatal di kasur dan sofa", slug: "kutu-kasur" },
];

const lainnya = [
  { label: "Kebutuhan hewan peliharaan", href: "/produk?grup=hewan" },
  { label: "Perawatan rumah & barang", href: "/produk?grup=rumah" },
  { label: "Paket hemat", href: "/produk?grup=paket" },
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
          <Link
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
          </Link>
        ))}
      </div>

      <div className="mt-12 border-t border-ink/10 pt-8">
        <p className="font-mono text-[11px] tracking-[0.2em] text-stone-500 uppercase">
          Bukan soal hama?
        </p>
        <ul className="mt-4 flex flex-wrap gap-x-8 gap-y-3">
          {lainnya.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="border-b border-stone-300 pb-0.5 text-sm text-ink transition-colors hover:border-brand-600 hover:text-brand-600"
              >
                {l.label} &rarr;
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
