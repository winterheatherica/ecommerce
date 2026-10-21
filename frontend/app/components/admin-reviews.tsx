"use client";

import { useState } from "react";

import { tambahUlasanImpor, ubahTampilUlasan } from "@/app/lib/api-client";
import { ambilUlasanLanjutan, tanggalUlasan } from "@/app/lib/ulasan";
import type { Produk, Ulasan } from "@/app/data/produk";

const label = "block font-mono text-[12px] tracking-[0.2em] text-stone-500 uppercase";
const kotak =
  "mt-2 w-full border border-ink/15 bg-white px-4 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-stone-400 focus:border-brand-500 disabled:bg-stone-100";

const LABEL_SUMBER: Record<Ulasan["sumber"], { teks: string; kelas: string }> = {
  shopee: { teks: "Shopee", kelas: "border-orange-300 bg-orange-50 text-orange-700" },
  tokopedia: { teks: "Tokopedia", kelas: "border-emerald-300 bg-emerald-50 text-emerald-700" },
  web: { teks: "Website", kelas: "border-brand-200 bg-brand-50 text-brand-700" },
};

function hariIni(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
}

export default function AdminReviews({ produk }: { produk: Produk }) {
  const [daftar, setDaftar] = useState<Ulasan[]>(produk.ulasan ?? []);
  const [tambahan, setTambahan] = useState(0);
  const total = Math.max((produk.ringkasanUlasan?.total ?? 0) + tambahan, daftar.length);

  const [mengubah, setMengubah] = useState<number | null>(null);
  const [memuat, setMemuat] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);

  const [buka, setBuka] = useState(false);
  const [sumber, setSumber] = useState<"shopee" | "tokopedia">("shopee");
  const [ukuran, setUkuran] = useState(produk.varian[0]?.slug ?? "");
  const [bintang, setBintang] = useState("5");
  const [nama, setNama] = useState("");
  const [tanggal, setTanggal] = useState(hariIni);
  const [teks, setTeks] = useState("");
  const [susulan, setSusulan] = useState("");
  const [produkAsal, setProdukAsal] = useState("");
  const [urlAsal, setUrlAsal] = useState("");
  const [menyimpan, setMenyimpan] = useState(false);

  const tukarTampil = async (u: Ulasan) => {
    setMengubah(u.id);
    setGalat(null);

    try {
      await ubahTampilUlasan(u.id, !u.tersembunyi);
      setDaftar((d) => d.map((x) => (x.id === u.id ? { ...x, tersembunyi: !u.tersembunyi } : x)));
    } catch (err) {
      setGalat(err instanceof Error ? err.message : "Gagal mengubah ulasan");
    } finally {
      setMengubah(null);
    }
  };

  const muatLagi = async () => {
    setMemuat(true);
    setGalat(null);

    try {
      const { data: baru } = await ambilUlasanLanjutan(
        `/api/admin/products/${encodeURIComponent(produk.slug)}/reviews`,
        daftar.length,
        { urut: "terbaru", bintang: null, sumber: null, ukuran: null },
      );
      const sudah = new Set(daftar.map((u) => u.id));
      setDaftar([...daftar, ...baru.filter((u) => !sudah.has(u.id))]);
    } catch (err) {
      setGalat(err instanceof Error ? err.message : "Gagal memuat ulasan");
    } finally {
      setMemuat(false);
    }
  };

  const kirim = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nama.trim()) return setGalat("Nama pengulas belum diisi.");
    if (!teks.trim() && !susulan.trim()) return setGalat("Isi ulasannya belum ada.");

    setMenyimpan(true);
    setGalat(null);

    try {
      const baru = await tambahUlasanImpor(ukuran, {
        source: sumber,
        rating: Number(bintang),
        author_name: nama.trim(),
        body: teks.trim() || null,
        follow_up: susulan.trim() || null,
        reviewed_at: `${tanggal}T12:00:00+07:00`,
        source_product: sumber === "tokopedia" ? produkAsal.trim() || null : null,
        source_url: sumber === "tokopedia" ? urlAsal.trim() || null : null,
      });

      setDaftar((d) => [baru, ...d]);
      setTambahan((n) => n + 1);
      setNama("");
      setTeks("");
      setSusulan("");
      setProdukAsal("");
      setUrlAsal("");
      setBuka(false);
    } catch (err) {
      setGalat(err instanceof Error ? err.message : "Gagal menyimpan ulasan");
    } finally {
      setMenyimpan(false);
    }
  };

  const namaPlatform = sumber === "shopee" ? "Shopee" : "Tokopedia";

  return (
    <section className="mt-12 border-t border-ink/10 pt-10">
      <h2 className="text-lg font-semibold tracking-tight text-ink">Ulasan</h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600">
        Ulasan yang disembunyikan tidak tampil di toko, tapi tetap tersimpan di sini.
        Sembunyikan hanya untuk spam, kata kasar, atau data pribadi, bukan karena
        bintangnya rendah.
      </p>

      {galat && (
        <p role="alert" className="mt-6 border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {galat}
        </p>
      )}

      {daftar.length === 0 ? (
        <p className="mt-6 border border-ink/10 bg-white px-5 py-6 text-sm text-stone-500">
          Belum ada ulasan untuk produk ini.
        </p>
      ) : (
        <>
          <p className="mt-6 font-mono text-[12px] text-stone-400">
            Menampilkan {daftar.length.toLocaleString("id-ID")} dari {total.toLocaleString("id-ID")} ulasan
          </p>
          <ul className="mt-2 divide-y divide-ink/5 border border-ink/10 bg-white">
            {daftar.map((u) => (
              <li key={u.id} className={`flex gap-4 px-5 py-4 ${u.tersembunyi ? "bg-stone-50" : ""}`}>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                    <span className="text-amber-500" aria-label={`${u.bintang} bintang`}>
                      {"★".repeat(u.bintang)}
                      <span className="text-stone-300">{"★".repeat(5 - u.bintang)}</span>
                    </span>
                    <span className="font-medium text-ink">{u.nama}</span>
                    <span className="font-mono text-[12px] text-stone-400">{tanggalUlasan(u.pada, u.presisi)}</span>
                    <span className="font-mono text-[12px] text-stone-500">{u.ukuran}</span>
                    <span className={`border px-1.5 py-0.5 font-mono text-[11px] uppercase ${LABEL_SUMBER[u.sumber].kelas}`}>
                      {LABEL_SUMBER[u.sumber].teks}
                    </span>
                    {u.tersembunyi && (
                      <span className="font-mono text-[11px] text-red-600 uppercase">Disembunyikan</span>
                    )}
                  </p>
                  <p className={`mt-2 line-clamp-3 text-sm whitespace-pre-line ${u.tersembunyi ? "text-stone-400" : "text-stone-700"}`}>
                    {u.teks ?? u.susulan}
                  </p>
                  {u.produkAsal && (
                    <p className="mt-1.5 font-mono text-[11px] break-words text-stone-400">Di Tokopedia: {u.produkAsal}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => void tukarTampil(u)}
                  disabled={mengubah === u.id}
                  className="h-fit shrink-0 border border-ink/15 px-3 py-1.5 font-mono text-[12px] tracking-[0.14em] indent-[0.14em] text-stone-600 uppercase transition-colors hover:border-brand-500 hover:text-brand-600 disabled:text-stone-300"
                >
                  {u.tersembunyi ? "Tampilkan" : "Sembunyikan"}
                </button>
              </li>
            ))}
          </ul>

          {daftar.length < total && (
            <button
              type="button"
              onClick={() => void muatLagi()}
              disabled={memuat}
              className="mt-4 border border-ink/15 px-6 py-2.5 font-mono text-[13px] tracking-[0.2em] indent-[0.2em] text-stone-600 uppercase transition-colors hover:border-brand-400 hover:text-brand-600 disabled:cursor-wait disabled:text-stone-300"
            >
              {memuat ? "Memuat..." : "Muat ulasan lainnya"}
            </button>
          )}
        </>
      )}

      {buka ? (
        <form onSubmit={kirim} className="mt-8 border border-ink/10 bg-stone-50 p-6">
          <h3 className="font-mono text-[13px] tracking-[0.2em] text-stone-500 uppercase">
            Tambah ulasan dari {namaPlatform}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-stone-600">
            Salin apa adanya dari {namaPlatform}. Nama pengulas otomatis disamarkan saat disimpan.
          </p>

          <fieldset disabled={menyimpan} className="mt-6 space-y-6">
            <div className="grid gap-6 sm:grid-cols-5">
              <div>
                <label className={label} htmlFor="ulasan-sumber">Dari</label>
                <select
                  id="ulasan-sumber"
                  value={sumber}
                  onChange={(e) => setSumber(e.target.value as "shopee" | "tokopedia")}
                  className={kotak}
                >
                  <option value="shopee">Shopee</option>
                  <option value="tokopedia">Tokopedia</option>
                </select>
              </div>
              <div>
                <label className={label} htmlFor="ulasan-ukuran">Ukuran</label>
                <select id="ulasan-ukuran" value={ukuran} onChange={(e) => setUkuran(e.target.value)} className={kotak}>
                  {produk.varian.map((v) => (
                    <option key={v.slug} value={v.slug}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={label} htmlFor="ulasan-bintang">Bintang</label>
                <select id="ulasan-bintang" value={bintang} onChange={(e) => setBintang(e.target.value)} className={kotak}>
                  {[5, 4, 3, 2, 1].map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={label} htmlFor="ulasan-nama">Nama pengulas</label>
                <input id="ulasan-nama" value={nama} onChange={(e) => setNama(e.target.value)} maxLength={60} className={kotak} />
              </div>
              <div>
                <label className={label} htmlFor="ulasan-tanggal">Tanggal</label>
                <input
                  id="ulasan-tanggal"
                  type="date"
                  value={tanggal}
                  max={hariIni()}
                  onChange={(e) => setTanggal(e.target.value)}
                  className={kotak}
                />
              </div>
            </div>

            {sumber === "tokopedia" && (
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label className={label} htmlFor="ulasan-produk-asal">
                    Nama produk di Tokopedia <span className="normal-case">(opsional)</span>
                  </label>
                  <input
                    id="ulasan-produk-asal"
                    value={produkAsal}
                    onChange={(e) => setProdukAsal(e.target.value)}
                    maxLength={200}
                    className={kotak}
                  />
                </div>
                <div>
                  <label className={label} htmlFor="ulasan-url-asal">
                    Link produk Tokopedia <span className="normal-case">(opsional)</span>
                  </label>
                  <input
                    id="ulasan-url-asal"
                    type="url"
                    value={urlAsal}
                    onChange={(e) => setUrlAsal(e.target.value)}
                    maxLength={400}
                    placeholder="https://www.tokopedia.com/menikstore/..."
                    className={kotak}
                  />
                </div>
              </div>
            )}

            <div>
              <label className={label} htmlFor="ulasan-teks">Isi ulasan</label>
              <textarea id="ulasan-teks" value={teks} onChange={(e) => setTeks(e.target.value)} rows={4} maxLength={3000} className={`${kotak} leading-relaxed`} />
            </div>
            {sumber === "shopee" && (
              <div>
                <label className={label} htmlFor="ulasan-susulan">
                  Update penilaian <span className="normal-case">(opsional)</span>
                </label>
                <textarea id="ulasan-susulan" value={susulan} onChange={(e) => setSusulan(e.target.value)} rows={2} maxLength={3000} className={`${kotak} leading-relaxed`} />
              </div>
            )}
          </fieldset>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={menyimpan}
              className="border border-brand-500 bg-brand-500 px-6 py-2.5 font-mono text-[13px] tracking-[0.2em] indent-[0.2em] text-white uppercase transition-colors hover:border-brand-600 hover:bg-brand-600 disabled:cursor-not-allowed disabled:border-stone-300 disabled:bg-stone-300"
            >
              {menyimpan ? "Menyimpan..." : "Simpan ulasan"}
            </button>
            <button
              type="button"
              onClick={() => setBuka(false)}
              className="border border-ink/15 px-6 py-2.5 font-mono text-[13px] tracking-[0.2em] indent-[0.2em] text-stone-600 uppercase transition-colors hover:border-ink hover:text-ink"
            >
              Batal
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setBuka(true)}
          className="mt-8 border border-ink/15 px-6 py-2.5 font-mono text-[13px] tracking-[0.2em] indent-[0.2em] text-stone-600 uppercase transition-colors hover:border-brand-400 hover:text-brand-600"
        >
          + Tambah ulasan dari Shopee atau Tokopedia
        </button>
      )}
    </section>
  );
}
