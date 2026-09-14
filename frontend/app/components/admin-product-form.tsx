"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { buatProdukBaru, simpanProduk } from "@/app/lib/api-client";
import { kategoriLabel, type Kategori, type Produk } from "@/app/data/produk";

const KATEGORI = Object.keys(kategoriLabel) as Kategori[];

const label = "block font-mono text-[10px] tracking-[0.2em] text-stone-500 uppercase";
const kotak =
  "mt-2 w-full border border-ink/15 bg-white px-4 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-stone-400 focus:border-brand-500 disabled:bg-stone-100";

function keSlug(teks: string) {
  return teks
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

type Props = {
  awal?: Produk;
};

export default function AdminProductForm({ awal }: Props) {
  const router = useRouter();
  const ubahMode = Boolean(awal);

  const [slug, setSlug] = useState(awal?.slug ?? "");
  const [slugDisentuh, setSlugDisentuh] = useState(ubahMode);
  const [nama, setNama] = useState(awal?.nama ?? "");
  const [deskripsi, setDeskripsi] = useState(awal?.deskripsi ?? "");
  const [harga, setHarga] = useState(String(awal?.harga ?? ""));
  const [berat, setBerat] = useState(String(awal?.beratG ?? ""));
  const [stok, setStok] = useState(String(awal?.stok ?? 0));
  const [kategori, setKategori] = useState<Kategori>(awal?.kategori ?? "kucing");
  const [terjual, setTerjual] = useState(String(awal?.terjualPerBulan ?? 0));
  const [unggulan, setUnggulan] = useState(awal?.unggulan ?? false);

  const [galat, setGalat] = useState<string | null>(null);
  const [menyimpan, setMenyimpan] = useState(false);

  const ubahNama = (nilai: string) => {
    setNama(nilai);
    if (!ubahMode && !slugDisentuh) setSlug(keSlug(nilai));
  };

  const periksa = () => {
    if (nama.trim().length < 3) return "Nama produk minimal 3 huruf.";
    if (!ubahMode && !slug.trim()) return "Slug belum diisi.";
    if (!(Number(harga) > 0)) return "Harga harus lebih dari 0.";
    if (!(Number(berat) > 0)) return "Berat harus lebih dari 0 gram.";
    if (Number(stok) < 0) return "Stok tidak boleh minus.";
    return null;
  };

  const kirim = async (e: React.FormEvent) => {
    e.preventDefault();

    const pesan = periksa();
    if (pesan) {
      setGalat(pesan);
      return;
    }

    setMenyimpan(true);
    setGalat(null);

    const isi = {
      name: nama.trim(),
      description: deskripsi.trim(),
      price: Number(harga),
      weight_g: Number(berat),
      stock: Number(stok),
      category: kategori,
      sold_per_month: Number(terjual),
      is_featured: unggulan,
    };

    try {
      if (ubahMode && awal) {
        await simpanProduk(awal.slug, isi);
      } else {
        await buatProdukBaru({ slug: slug.trim(), ...isi });
      }

      router.push("/admin/produk");
      router.refresh();
    } catch (err) {
      setGalat(err instanceof Error ? err.message : "Gagal menyimpan");
      setMenyimpan(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/admin/produk"
        className="font-mono text-[10px] tracking-[0.2em] text-stone-500 uppercase transition-colors hover:text-brand-600"
      >
        &larr; Kembali ke daftar
      </Link>

      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-ink">
        {ubahMode ? "Ubah produk" : "Tambah produk"}
      </h1>

      <form onSubmit={kirim} className="mt-8">
        <fieldset disabled={menyimpan} className="space-y-6">
          <div>
            <label className={label} htmlFor="nama">
              Nama produk
            </label>
            <input
              id="nama"
              value={nama}
              onChange={(e) => ubahNama(e.target.value)}
              placeholder="Alat pengusir kucing Bye Bye Cat 50g"
              className={kotak}
            />
          </div>

          <div>
            <label className={label} htmlFor="slug">
              Slug <span className="normal-case">(alamat halaman)</span>
            </label>
            <input
              id="slug"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugDisentuh(true);
              }}
              disabled={ubahMode}
              placeholder="bye-bye-cat-50g"
              className={`${kotak} font-mono`}
            />
            <p className="mt-2 text-xs text-stone-500">
              {ubahMode
                ? "Slug tidak bisa diubah — tautan yang sudah tersebar akan rusak."
                : `Halaman produknya nanti: /produk/${slug || "..."}`}
            </p>
          </div>

          <div>
            <label className={label} htmlFor="deskripsi">
              Deskripsi
            </label>
            <textarea
              id="deskripsi"
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              rows={5}
              placeholder="Untuk apa, ditaruh di mana, dan kenapa aman."
              className={`${kotak} resize-none leading-relaxed`}
            />
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            <div>
              <label className={label} htmlFor="harga">
                Harga (Rp)
              </label>
              <input
                id="harga"
                type="number"
                min={1}
                value={harga}
                onChange={(e) => setHarga(e.target.value)}
                className={`${kotak} font-mono`}
              />
            </div>
            <div>
              <label className={label} htmlFor="berat">
                Berat (gram)
              </label>
              <input
                id="berat"
                type="number"
                min={1}
                value={berat}
                onChange={(e) => setBerat(e.target.value)}
                className={`${kotak} font-mono`}
              />
            </div>
            <div>
              <label className={label} htmlFor="stok">
                Stok
              </label>
              <input
                id="stok"
                type="number"
                min={0}
                value={stok}
                onChange={(e) => setStok(e.target.value)}
                className={`${kotak} font-mono`}
              />
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className={label} htmlFor="kategori">
                Kategori
              </label>
              <select
                id="kategori"
                value={kategori}
                onChange={(e) => setKategori(e.target.value as Kategori)}
                className={kotak}
              >
                {KATEGORI.map((k) => (
                  <option key={k} value={k}>
                    {kategoriLabel[k]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={label} htmlFor="terjual">
                Terjual per bulan
              </label>
              <input
                id="terjual"
                type="number"
                min={0}
                value={terjual}
                onChange={(e) => setTerjual(e.target.value)}
                className={`${kotak} font-mono`}
              />
              <p className="mt-2 text-xs text-stone-500">
                Diisi manual. Ditampilkan di kartu produk.
              </p>
            </div>
          </div>

          <label className="flex items-center gap-3 text-sm text-ink">
            <input
              type="checkbox"
              checked={unggulan}
              onChange={(e) => setUnggulan(e.target.checked)}
              className="h-4 w-4 accent-brand-500"
            />
            Tampilkan di &ldquo;Paling dicari&rdquo; pada beranda
          </label>
        </fieldset>

        {galat && (
          <p role="alert" className="mt-6 border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {galat}
          </p>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={menyimpan}
            className="border border-brand-500 bg-brand-500 px-8 py-3 font-mono text-[11px] tracking-[0.2em] text-white uppercase transition-colors hover:border-brand-600 hover:bg-brand-600 disabled:cursor-not-allowed disabled:border-stone-300 disabled:bg-stone-300"
          >
            {menyimpan ? "Menyimpan..." : ubahMode ? "Simpan perubahan" : "Tambah produk"}
          </button>

          <Link
            href="/admin/produk"
            className="border border-ink/15 px-8 py-3 font-mono text-[11px] tracking-[0.2em] text-stone-600 uppercase transition-colors hover:border-ink hover:text-ink"
          >
            Batal
          </Link>
        </div>
      </form>
    </div>
  );
}
