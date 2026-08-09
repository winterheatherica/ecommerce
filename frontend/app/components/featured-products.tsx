import Image from "next/image";

type Produk = {
  slug: string;
  nama: string;
  harga: number;
  terjualPerBulan: number;
  gambar?: string;
};

const produk: Produk[] = [
  {
    slug: "bye-bye-cat-50g",
    nama: "Alat pengusir kucing Bye Bye Cat 50g",
    harga: 49000,
    terjualPerBulan: 27,
  },
  {
    slug: "bye-bye-cat-80g",
    nama: "Alat pengusir kucing Bye Bye Cat 80g",
    harga: 59000,
    terjualPerBulan: 18,
  },
  {
    slug: "goito-gel-nyamuk",
    nama: "Goito Gel — Pengusir Nyamuk Alami",
    harga: 33000,
    terjualPerBulan: 17,
  },
  {
    slug: "sangreat-leather-jacket-cleaner",
    nama: "SanGreat Leather Jacket Cleaner and Polish",
    harga: 97000,
    terjualPerBulan: 10,
  },
  {
    slug: "bye-bye-kecoa-50gr",
    nama: "Bye Bye Kecoa Gel 50gr — Pengusir Kecoa Natural",
    harga: 54000,
    terjualPerBulan: 9,
  },
  {
    slug: "cicago-gel-cicak-70g",
    nama: "Cicago Gel Pengusir Cicak Alami 70g",
    harga: 35000,
    terjualPerBulan: 8,
  },
];

const angka = new Intl.NumberFormat("id-ID");

const rupiah = (n: number) => `Rp${angka.format(n)}`;

export default function FeaturedProducts() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 pb-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] tracking-[0.28em] text-accent-600 uppercase">
            Paling dicari
          </p>
          <h2 className="mt-3 text-3xl leading-tight font-semibold tracking-tight text-ink sm:text-4xl">
            Yang sering diambil orang
          </h2>
        </div>

        <a
          href="/produk"
          className="border-b border-ink/30 pb-1 font-mono text-[11px] tracking-[0.22em] text-ink uppercase transition-colors hover:border-brand-600 hover:text-brand-600"
        >
          Lihat semua &rarr;
        </a>
      </div>

      <div className="mt-12 grid grid-cols-2 gap-6 lg:grid-cols-3">
        {produk.map((p) => (
          <a key={p.slug} href={`/produk/${p.slug}`} className="group flex flex-col">
            <div className="relative aspect-square overflow-hidden bg-stone-100">
              {p.gambar ? (
                <Image
                  src={p.gambar}
                  alt={p.nama}
                  fill
                  sizes="(max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <span className="absolute inset-0 flex items-center justify-center font-mono text-[10px] tracking-[0.2em] text-stone-400 uppercase">
                  Foto produk
                </span>
              )}
            </div>

            <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-ink transition-colors group-hover:text-brand-600">
              {p.nama}
            </p>

            <div className="mt-auto flex flex-col gap-1 pt-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
              <span className="text-lg font-semibold tracking-tight text-ink">
                {rupiah(p.harga)}
              </span>
              <span className="font-mono text-[10px] tracking-[0.14em] text-stone-400 uppercase">
                {p.terjualPerBulan} terjual/bln
              </span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
