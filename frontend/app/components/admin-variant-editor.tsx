"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import AdminDimensionBox from "@/app/components/admin-dimension-box";
import AdminNumberBox from "@/app/components/admin-number-box";
import AdminTextBox from "@/app/components/admin-text-box";
import { tambahVarian, ubahVarian } from "@/app/lib/api-client";
import { rupiah, type Produk, type Varian } from "@/app/data/produk";

const label = "block font-mono text-[12px] tracking-[0.2em] text-stone-500 uppercase";
const kotak =
  "mt-2 w-full border border-ink/15 bg-white px-4 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-stone-400 focus:border-brand-500 disabled:bg-stone-100";

function keSlug(teks: string) {
  return teks
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AdminVariantEditor({ produk }: { produk: Produk }) {
  const router = useRouter();

  const [varian, setVarian] = useState<Varian[]>(produk.varian);
  const [menyimpan, setMenyimpan] = useState<string | null>(null);
  const [galat, setGalat] = useState<string | null>(null);

  const [bukaTambah, setBukaTambah] = useState(false);
  const [labelBaru, setLabelBaru] = useState("");
  const [slugBaru, setSlugBaru] = useState("");
  const [slugDisentuh, setSlugDisentuh] = useState(false);
  const [skuBaru, setSkuBaru] = useState("");
  const [hargaBaru, setHargaBaru] = useState("");
  const [beratBaru, setBeratBaru] = useState("");
  const [stokBaru, setStokBaru] = useState("0");
  const [menambah, setMenambah] = useState(false);

  const aktif = varian.filter((v) => v.aktif !== false);

  const simpan = async (
    slug: string,
    lokal: Partial<Varian>,
    jauh: Parameters<typeof ubahVarian>[1],
  ) => {
    const sebelumnya = varian;

    setMenyimpan(slug);
    setGalat(null);
    setVarian((lama) =>
      lama.map((v) => (v.slug === slug ? { ...v, ...lokal } : v)),
    );

    try {
      await ubahVarian(slug, jauh);
      router.refresh();
    } catch (err) {
      setVarian(sebelumnya);
      setGalat(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setMenyimpan(null);
    }
  };

  const ubahAktif = (v: Varian) => {
    const berikut = v.aktif === false;

    if (!berikut && aktif.length === 1) {
      setGalat(
        `${v.label} adalah satu-satunya ukuran yang aktif. Kalau dinonaktifkan, produk ini tidak bisa dibeli lagi.`,
      );
    }

    void simpan(v.slug, { aktif: berikut }, { is_active: berikut });
  };


  const ubahLabelBaru = (nilai: string) => {
    setLabelBaru(nilai);
    if (!slugDisentuh) {
      const padat = nilai.replace(/\s+/g, "");
      setSlugBaru(padat ? `${produk.slug}-${keSlug(padat)}` : "");
    }
  };

  const kirimTambah = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!labelBaru.trim()) {
      setGalat("Label ukuran belum diisi.");
      return;
    }
    if (!(Number(hargaBaru) > 0)) {
      setGalat("Harga ukuran baru harus lebih dari 0.");
      return;
    }
    if (!(Number(beratBaru) > 0)) {
      setGalat("Berat ukuran baru harus lebih dari 0 gram.");
      return;
    }

    setMenambah(true);
    setGalat(null);

    try {
      await tambahVarian(produk.slug, {
        slug: slugBaru.trim(),
        sku: skuBaru.trim() || undefined,
        label: labelBaru.trim(),
        price: Number(hargaBaru),
        weight_g: Number(beratBaru),
        stock: Math.max(0, Number(stokBaru) || 0),
      });

      setVarian((lama) => [
        ...lama,
        {
          slug: slugBaru.trim(),
          sku: skuBaru.trim() || undefined,
          label: labelBaru.trim(),
          harga: Number(hargaBaru),
          beratG: Number(beratBaru),
          stok: Math.max(0, Number(stokBaru) || 0),
          aktif: true,
        },
      ]);

      setBukaTambah(false);
      setLabelBaru("");
      setSlugBaru("");
      setSlugDisentuh(false);
      setSkuBaru("");
      setHargaBaru("");
      setBeratBaru("");
      setStokBaru("0");
      router.refresh();
    } catch (err) {
      setGalat(err instanceof Error ? err.message : "Gagal menambah ukuran");
    } finally {
      setMenambah(false);
    }
  };

  const kepala =
    "px-3 py-2 font-mono text-[12px] tracking-[0.18em] font-normal text-stone-500 uppercase";

  return (
    <section className="mt-12 border-t border-ink/10 pt-10">
      <h2 className="text-lg font-semibold tracking-tight text-ink">
        Ukuran dan stok
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-stone-600">
        Harga, berat, dan stok produk dihitung dari ukuran di bawah ini. Harga
        yang tampil di katalog adalah yang termurah, dan stok produk adalah
        jumlah semua ukuran yang aktif.
      </p>

      {galat && (
        <p role="alert" className="mt-6 border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {galat}
        </p>
      )}

      <div className="mt-6 overflow-x-auto border border-ink/10 bg-white">
        <table className="w-full min-w-200 text-sm">
          <thead>
            <tr className="border-b border-ink/10 text-left">
              <th className={kepala}>Ukuran</th>
              <th className={kepala}>SKU</th>
              <th className={`${kepala} text-right`}>Harga</th>
              <th className={`${kepala} text-right`}>Berat (g)</th>
              <th className={`${kepala} text-right`}>Berat paket (g)</th>
              <th className={`${kepala} text-right`}>Dimensi paket (cm)</th>
              <th className={`${kepala} text-right`}>Stok</th>
              <th className={`${kepala} text-right`}>Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/5">
            {varian.map((v) => (
              <tr key={v.slug} className={v.aktif === false ? "bg-stone-50" : ""}>
                <td className="px-3 py-3">
                  <AdminTextBox
                    nilai={v.label}
                    label={`Label ukuran ${v.label}`}
                    kelas="w-28 border-ink/15"
                    mati={menyimpan === v.slug}
                    onSimpan={(teks) => void simpan(v.slug, { label: teks }, { label: teks })}
                  />
                  <span className="mt-1 block font-mono text-[12px] text-stone-400">
                    {v.slug}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <AdminTextBox
                    nilai={v.sku ?? ""}
                    label={`SKU ukuran ${v.label}`}
                    kelas="w-24 border-ink/15 font-mono"
                    mati={menyimpan === v.slug}
                    onSimpan={(teks) => void simpan(v.slug, { sku: teks }, { sku: teks })}
                  />
                </td>
                <td className="px-3 py-3 text-right">
                  <AdminNumberBox
                    nilai={v.harga}
                    min={1}
                    label={`Harga ukuran ${v.label}`}
                    kelas="w-28 border-ink/15 bg-white text-ink"
                    mati={menyimpan === v.slug}
                    onSimpan={(angka) =>
                      void simpan(v.slug, { harga: angka }, { price: angka })
                    }
                  />
                </td>
                <td className="px-3 py-3 text-right">
                  <AdminNumberBox
                    nilai={v.beratG}
                    min={1}
                    label={`Berat ukuran ${v.label}`}
                    kelas="w-24 border-ink/15 bg-white text-ink"
                    mati={menyimpan === v.slug}
                    onSimpan={(angka) =>
                      void simpan(v.slug, { beratG: angka }, { weight_g: angka })
                    }
                  />
                </td>
                <td className="px-3 py-3 text-right">
                  <AdminNumberBox
                    nilai={v.paketBeratG ?? null}
                    min={1}
                    label={`Berat paket ukuran ${v.label}`}
                    placeholder="belum"
                    kelas={
                      v.paketBeratG
                        ? "w-24 border-ink/15 bg-white text-ink"
                        : "w-24 border-amber-300 bg-amber-50 text-ink"
                    }
                    mati={menyimpan === v.slug}
                    onSimpan={(angka) =>
                      void simpan(v.slug, { paketBeratG: angka }, { package_weight_g: angka })
                    }
                  />
                </td>
                <td className="px-3 py-3 text-right">
                  <AdminDimensionBox
                    nilai={v.paketDimensi ?? null}
                    label={`Dimensi paket ukuran ${v.label}`}
                    kelas={v.paketDimensi ? "w-28 border-ink/15" : "w-28 border-amber-300 bg-amber-50"}
                    mati={menyimpan === v.slug}
                    onSimpan={(d) =>
                      void simpan(
                        v.slug,
                        { paketDimensi: d },
                        { package_length_cm: d.p, package_width_cm: d.l, package_height_cm: d.t },
                      )
                    }
                  />
                </td>
                <td className="px-3 py-3 text-right">
                  <AdminNumberBox
                    nilai={v.stok}
                    min={0}
                    label={`Stok ukuran ${v.label}`}
                    kelas={
                      v.stok === 0
                        ? "w-20 border-red-300 bg-red-50 text-red-700"
                        : "w-20 border-ink/15 bg-white text-ink"
                    }
                    mati={menyimpan === v.slug}
                    onSimpan={(angka) =>
                      void simpan(v.slug, { stok: angka }, { stock: angka })
                    }
                  />
                </td>
                <td className="px-3 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => ubahAktif(v)}
                    disabled={menyimpan === v.slug}
                    className={`border px-3 py-1.5 font-mono text-[12px] tracking-[0.16em] uppercase transition-colors ${
                      v.aktif === false
                        ? "border-ink/15 text-stone-500 hover:border-brand-400 hover:text-brand-600"
                        : "border-brand-500 bg-brand-500 text-white"
                    }`}
                  >
                    {v.aktif === false ? "Nonaktif" : "Aktif"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-sm text-stone-500">
        Termurah sekarang {aktif.length > 0 ? rupiah(Math.min(...aktif.map((v) => v.harga))) : "belum ada"}
        , total stok aktif {aktif.reduce((s, v) => s + v.stok, 0)}.
      </p>
      <p className="mt-2 text-sm leading-relaxed text-stone-500">
        Berat dan dimensi paket dicetak di label kirim dan dijumlahkan sesuai
        banyaknya barang. Kolom kuning artinya belum diisi, jadi di label nanti
        dikosongkan untuk ditulis tangan.
      </p>

      {bukaTambah ? (
        <form onSubmit={kirimTambah} className="mt-8 border border-ink/10 bg-stone-50 p-6">
          <h3 className="font-mono text-[13px] tracking-[0.2em] text-stone-500 uppercase">
            Ukuran baru
          </h3>

          <fieldset disabled={menambah} className="mt-6 space-y-6">
            <div className="grid gap-6 sm:grid-cols-3">
              <div>
                <label className={label} htmlFor="label-baru">
                  Label
                </label>
                <input
                  id="label-baru"
                  value={labelBaru}
                  onChange={(e) => ubahLabelBaru(e.target.value)}
                  placeholder="120 g"
                  className={kotak}
                />
              </div>
              <div>
                <label className={label} htmlFor="slug-baru">
                  Slug <span className="normal-case">(alamat keranjang)</span>
                </label>
                <input
                  id="slug-baru"
                  value={slugBaru}
                  onChange={(e) => {
                    setSlugBaru(e.target.value);
                    setSlugDisentuh(true);
                  }}
                  placeholder={`${produk.slug}-120g`}
                  className={`${kotak} font-mono`}
                />
              </div>
              <div>
                <label className={label} htmlFor="sku-baru">
                  SKU
                </label>
                <input
                  id="sku-baru"
                  value={skuBaru}
                  onChange={(e) => setSkuBaru(e.target.value)}
                  placeholder="Otomatis"
                  className={`${kotak} font-mono`}
                />
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
              <div>
                <label className={label} htmlFor="harga-baru">
                  Harga (Rp)
                </label>
                <input
                  id="harga-baru"
                  type="number"
                  min={1}
                  value={hargaBaru}
                  onChange={(e) => setHargaBaru(e.target.value)}
                  className={`${kotak} font-mono`}
                />
              </div>
              <div>
                <label className={label} htmlFor="berat-baru">
                  Berat (gram)
                </label>
                <input
                  id="berat-baru"
                  type="number"
                  min={1}
                  value={beratBaru}
                  onChange={(e) => setBeratBaru(e.target.value)}
                  className={`${kotak} font-mono`}
                />
              </div>
              <div>
                <label className={label} htmlFor="stok-baru">
                  Stok
                </label>
                <input
                  id="stok-baru"
                  type="number"
                  min={0}
                  value={stokBaru}
                  onChange={(e) => setStokBaru(e.target.value)}
                  className={`${kotak} font-mono`}
                />
              </div>
            </div>
          </fieldset>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={menambah}
              className="border border-brand-500 bg-brand-500 px-6 py-2.5 font-mono text-[13px] tracking-[0.2em] text-white uppercase transition-colors hover:border-brand-600 hover:bg-brand-600 disabled:cursor-not-allowed disabled:border-stone-300 disabled:bg-stone-300"
            >
              {menambah ? "Menambah..." : "Tambah ukuran"}
            </button>
            <button
              type="button"
              onClick={() => setBukaTambah(false)}
              className="border border-ink/15 px-6 py-2.5 font-mono text-[13px] tracking-[0.2em] text-stone-600 uppercase transition-colors hover:border-ink hover:text-ink"
            >
              Batal
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setBukaTambah(true)}
          className="mt-8 border border-ink/15 px-6 py-2.5 font-mono text-[13px] tracking-[0.2em] text-stone-600 uppercase transition-colors hover:border-brand-400 hover:text-brand-600"
        >
          + Tambah ukuran
        </button>
      )}
    </section>
  );
}
