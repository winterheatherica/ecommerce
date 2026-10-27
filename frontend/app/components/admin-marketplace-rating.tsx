"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { ubahVarian, type PerubahanVarian } from "@/app/lib/api-client";
import {
  angkaRating,
  jumlahLengkap,
  NAMA_MARKETPLACE,
  SATUAN_RATING,
  tanggalRating,
  type Marketplace,
} from "@/app/lib/rating";
import type { Produk, Varian } from "@/app/data/produk";

type Isian = { url: string; rata: string; jumlah: string };

type Kabar = { slug: string; ok: boolean; pesan: string };

type Aturan = {
  pola: RegExp;
  awalan: string;
  petunjuk: string;
  kirim: (url: string | null, rata: number | null, jumlah: number | null) => PerubahanVarian;
};

const ATURAN: Record<Marketplace, Aturan> = {
  shopee: {
    pola: /^https:\/\/shopee\.co\.id\/\S+$/,
    awalan: "https://shopee.co.id/",
    petunjuk:
      "Salin dari halaman listing tiap ukuran di Shopee. Untuk 1.000 penilaian ke atas Shopee menyingkat angkanya (misalnya 1,8RB), jadi isi perkiraan terdekat. Tanggal update terisi sendiri setiap rating atau jumlahnya disimpan.",
    kirim: (url, rata, jumlah) => ({ shopee_url: url, shopee_rating: rata, shopee_rating_count: jumlah }),
  },
  tokopedia: {
    pola: /^https:\/\/(www\.)?tokopedia\.com\/\S+$/,
    awalan: "https://www.tokopedia.com/",
    petunjuk:
      "Salin dari halaman listing tiap ukuran di Tokopedia: angka rating dan jumlah rating, bukan jumlah ulasan. Kalau angkanya disingkat (misalnya 4,8 rb), isi perkiraan terdekat. Tanggal update terisi sendiri setiap rating atau jumlahnya disimpan.",
    kirim: (url, rata, jumlah) => ({
      tokopedia_url: url,
      tokopedia_rating: rata,
      tokopedia_rating_count: jumlah,
    }),
  },
};

const kotak =
  "w-full border border-ink/15 bg-white px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-stone-400 focus:border-brand-500 disabled:bg-stone-100";

function isianAwal(v: Varian, m: Marketplace): Isian {
  const r = v[m];
  return {
    url: r?.url ?? "",
    rata: r?.rata != null ? String(r.rata) : "",
    jumlah: r?.jumlah != null ? String(r.jumlah) : "",
  };
}

function periksa(
  isi: Isian,
  m: Marketplace,
): { ok: true; data: PerubahanVarian } | { ok: false; pesan: string } {
  const aturan = ATURAN[m];
  const satuan = SATUAN_RATING[m];

  const url = isi.url.trim();
  if (url && (url.length > 300 || !aturan.pola.test(url))) {
    return { ok: false, pesan: `Link harus diawali ${aturan.awalan}` };
  }

  const jumlahTeks = isi.jumlah.trim().replace(/\./g, "");
  const jumlah = jumlahTeks === "" ? null : Number(jumlahTeks);
  if (jumlah !== null && !(Number.isInteger(jumlah) && jumlah >= 0)) {
    return { ok: false, pesan: `Jumlah ${satuan} harus bilangan bulat, 0 atau lebih` };
  }

  const rataTeks = isi.rata.trim().replace(",", ".");
  const rata = rataTeks === "" ? null : Number(rataTeks);
  if (rata !== null && !(rata >= 1 && rata <= 5)) {
    return { ok: false, pesan: "Rating harus antara 1 dan 5" };
  }

  if ((jumlah ?? 0) > 0 && rata === null) {
    return { ok: false, pesan: `Isi ratingnya, karena jumlah ${satuan} lebih dari 0` };
  }
  if ((jumlah ?? 0) === 0 && rata !== null) {
    return { ok: false, pesan: `Kosongkan rating kalau belum ada ${satuan}` };
  }

  return { ok: true, data: aturan.kirim(url || null, rata, jumlah) };
}

export default function AdminMarketplaceRating({
  produk,
  marketplace,
}: {
  produk: Produk;
  marketplace: Marketplace;
}) {
  const router = useRouter();
  const nama = NAMA_MARKETPLACE[marketplace];
  const satuan = SATUAN_RATING[marketplace];

  const [isian, setIsian] = useState<Record<string, Isian>>(() =>
    Object.fromEntries(produk.varian.map((v) => [v.slug, isianAwal(v, marketplace)])),
  );
  const [menyimpan, setMenyimpan] = useState<string | null>(null);
  const [kabar, setKabar] = useState<Kabar | null>(null);

  const ubah = (slug: string, kolom: keyof Isian, nilai: string) => {
    setIsian((lama) => ({ ...lama, [slug]: { ...lama[slug], [kolom]: nilai } }));
    setKabar((k) => (k?.slug === slug ? null : k));
  };

  const simpan = async (slug: string) => {
    const hasil = periksa(isian[slug], marketplace);

    if (!hasil.ok) {
      setKabar({ slug, ok: false, pesan: hasil.pesan });
      return;
    }

    setMenyimpan(slug);
    setKabar(null);

    try {
      await ubahVarian(slug, hasil.data);
      setKabar({ slug, ok: true, pesan: "Tersimpan" });
      router.refresh();
    } catch (err) {
      setKabar({ slug, ok: false, pesan: err instanceof Error ? err.message : "Gagal menyimpan" });
    } finally {
      setMenyimpan(null);
    }
  };

  const kepala =
    "px-3 py-2 font-mono text-[12px] tracking-[0.18em] font-normal text-stone-500 uppercase";
  const ringkas = marketplace === "shopee" ? produk.ratingShopee : produk.ratingTokopedia;

  return (
    <section className="mt-12 border-t border-ink/10 pt-10">
      <h2 className="text-lg font-semibold tracking-tight text-ink">Rating {nama}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600">
        {ATURAN[marketplace].petunjuk}
      </p>

      <div className="mt-6 overflow-x-auto border border-ink/10 bg-white">
        <table className="w-full min-w-160 text-sm">
          <thead>
            <tr className="border-b border-ink/10 text-left">
              <th className={kepala}>Ukuran</th>
              <th className={kepala}>Link {nama}</th>
              <th className={kepala}>Rating</th>
              <th className={kepala}>{marketplace === "shopee" ? "Penilaian" : "Jumlah rating"}</th>
              <th className={kepala}>Diperbarui</th>
              <th className={kepala}>
                <span className="sr-only">Simpan</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/5">
            {produk.varian.map((v) => {
              const isi = isian[v.slug];
              const mati = menyimpan === v.slug;
              const per = v[marketplace]?.per;

              return (
                <tr key={v.slug} className={v.aktif === false ? "bg-stone-50" : ""}>
                  <td className="px-3 py-3 align-top">
                    <span className="block text-ink">{v.label}</span>
                    {v.aktif === false && (
                      <span className="mt-1 block font-mono text-[12px] text-stone-400 uppercase">
                        Nonaktif
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 align-top">
                    <input
                      value={isi.url}
                      onChange={(e) => ubah(v.slug, "url", e.target.value)}
                      placeholder={`${ATURAN[marketplace].awalan}...`}
                      aria-label={`Link ${nama} ukuran ${v.label}`}
                      disabled={mati}
                      className={`${kotak} min-w-48 font-mono text-[12px]`}
                    />
                  </td>
                  <td className="px-3 py-3 align-top">
                    <input
                      value={isi.rata}
                      onChange={(e) => ubah(v.slug, "rata", e.target.value)}
                      inputMode="decimal"
                      placeholder="4,8"
                      aria-label={`Rating ${nama} ukuran ${v.label}`}
                      disabled={mati}
                      className={`${kotak} w-20 font-mono`}
                    />
                  </td>
                  <td className="px-3 py-3 align-top">
                    <input
                      value={isi.jumlah}
                      onChange={(e) => ubah(v.slug, "jumlah", e.target.value)}
                      inputMode="numeric"
                      placeholder="0"
                      aria-label={`Jumlah ${satuan} ${nama} ukuran ${v.label}`}
                      disabled={mati}
                      className={`${kotak} w-24 font-mono`}
                    />
                  </td>
                  <td className="px-3 py-3 align-top font-mono text-[12px] whitespace-nowrap text-stone-500">
                    {per ? tanggalRating(per) : "-"}
                  </td>
                  <td className="px-3 py-3 align-top">
                    <button
                      type="button"
                      onClick={() => void simpan(v.slug)}
                      disabled={mati}
                      className="border border-ink/15 px-3 py-2 font-mono text-[12px] tracking-[0.16em] indent-[0.16em] text-stone-600 uppercase transition-colors hover:border-brand-500 hover:text-brand-600 disabled:cursor-not-allowed disabled:text-stone-300"
                    >
                      {mati ? "Menyimpan..." : "Simpan"}
                    </button>
                    {kabar?.slug === v.slug && (
                      <span
                        role={kabar.ok ? "status" : "alert"}
                        className={`mt-2 block max-w-48 text-xs leading-relaxed ${
                          kabar.ok ? "text-emerald-700" : "text-red-700"
                        }`}
                      >
                        {kabar.pesan}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-sm text-stone-500">
        {ringkas
          ? `Total ${nama} di toko: ${angkaRating(ringkas.rata)} dari ${jumlahLengkap(ringkas.jumlah)} ${satuan}, rata-rata tertimbang dari ukuran yang aktif. Di halaman produk angka ini digabung dengan marketplace lain.`
          : `Belum ada rating ${nama} yang tampil di toko untuk produk ini.`}
      </p>
    </section>
  );
}
