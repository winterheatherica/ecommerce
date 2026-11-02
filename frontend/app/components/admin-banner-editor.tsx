"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { simpanBannerToko, unggahBanner, type IsiBanner } from "@/app/lib/api-client";
import {
  kelasKotak,
  kelasLabel,
  kelasTombolKecil,
  kelasTombolTambah,
  kelasTombolUtama,
  pindahkan,
} from "@/app/lib/admin-ui";
import type { BannerAPI } from "@/app/lib/situs";

const BANNER_MAKS = 8;
const RASIO = 2;

type Baris = IsiBanner & { kunci: string; url: string };

let urutan = 0;
const kunciBaru = () => `baru-${++urutan}`;

function dariApi(daftar: BannerAPI[]): Baris[] {
  return daftar.map((b) => ({
    kunci: String(b.id),
    url: b.url,
    cloudinary_id: b.cloudinary_id ?? null,
    static_path: b.static_path ?? null,
    version: b.version ?? null,
    width: b.width,
    height: b.height,
    alt: b.alt,
    link: b.link,
  }));
}

function rasioMelenceng(b: Baris): boolean {
  return b.width !== null && b.height !== null && Math.abs(b.width / b.height - RASIO) > 0.1;
}

export default function AdminBannerEditor({ awal }: { awal: BannerAPI[] }) {
  const router = useRouter();
  const pilihBerkas = useRef<HTMLInputElement>(null);
  const [daftar, setDaftarMentah] = useState<Baris[]>(() => dariApi(awal));
  const [mengunggah, setMengunggah] = useState(false);
  const [menyimpan, setMenyimpan] = useState(false);
  const [kabar, setKabar] = useState<{ ok: boolean; pesan: string } | null>(null);

  const setDaftar = (d: Baris[]) => {
    setDaftarMentah(d);
    setKabar(null);
  };

  const ubah = (i: number, kolom: "alt" | "link", nilai: string) =>
    setDaftar(daftar.map((b, j) => (j === i ? { ...b, [kolom]: nilai } : b)));

  const unggah = async (berkas: File | undefined) => {
    if (!berkas) return;

    setMengunggah(true);
    setKabar(null);

    try {
      const foto = await unggahBanner(berkas);
      setDaftarMentah((d) => [
        ...d,
        {
          kunci: kunciBaru(),
          url: foto.url,
          cloudinary_id: foto.cloudinary_id,
          static_path: null,
          version: foto.version,
          width: foto.width,
          height: foto.height,
          alt: "",
          link: null,
        },
      ]);
      setKabar({ ok: true, pesan: "Gambar terunggah. Isi keterangannya, lalu tekan Simpan supaya tampil di website" });
    } catch (err) {
      setKabar({ ok: false, pesan: err instanceof Error ? err.message : "Gagal mengunggah gambar" });
    } finally {
      setMengunggah(false);
      if (pilihBerkas.current) pilihBerkas.current.value = "";
    }
  };

  const simpan = async () => {
    setMenyimpan(true);
    setKabar(null);

    try {
      const hasil = await simpanBannerToko(
        daftar.map((b) => ({
          cloudinary_id: b.cloudinary_id,
          static_path: b.static_path,
          version: b.version,
          width: b.width,
          height: b.height,
          alt: b.alt,
          link: b.link?.trim() ? b.link.trim() : null,
        })),
      );
      setDaftarMentah(dariApi(hasil.banners));
      setKabar({ ok: true, pesan: "Banner tersimpan dan langsung tampil di website" });
      router.refresh();
    } catch (err) {
      setKabar({ ok: false, pesan: err instanceof Error ? err.message : "Gagal menyimpan" });
    } finally {
      setMenyimpan(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Banner promo</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600">
        Tampil sebagai slider. Di HP letaknya paling atas di banner beranda, di komputer tepat di bawah banner beranda.
        Urutan di sini sama dengan urutan slider. Semua perubahan baru tersimpan setelah tombol Simpan ditekan.
      </p>
      <div className="mt-4 border border-ink/10 bg-white px-4 py-3 text-sm leading-relaxed text-stone-600">
        Ukuran gambar <strong className="font-semibold text-ink">1200 × 600 px</strong> (perbandingan 2:1), format JPG,
        PNG, atau WebP, maksimal 10 MB. Gambar dengan perbandingan lain akan terpotong. Taruh tulisan penting agak ke
        tengah dan buat cukup besar, karena di HP lebar banner cuma sekitar 330 px.
      </div>

      <fieldset disabled={menyimpan} className="mt-8 space-y-6">
        {daftar.length === 0 && (
          <p className="border border-dashed border-ink/20 px-4 py-8 text-center text-sm text-stone-500">
            Belum ada banner. Slider tidak ditampilkan di website.
          </p>
        )}

        {daftar.map((b, i) => (
          <section key={b.kunci} className="border border-ink/10 bg-white p-4">
            <div className="grid gap-5 sm:grid-cols-[240px_1fr]">
              <div>
                <Image
                  src={b.url}
                  alt=""
                  width={b.width ?? 1200}
                  height={b.height ?? 600}
                  sizes="240px"
                  className="aspect-[2/1] w-full border border-ink/10 bg-brand-50 object-cover"
                />
                <p className="mt-2 text-xs text-stone-500">
                  Banner {i + 1}
                  {b.width && b.height ? ` · ${b.width} × ${b.height} px` : ""}
                  {b.static_path ? " · contoh bawaan" : ""}
                </p>
                {rasioMelenceng(b) && (
                  <p className="mt-1 text-xs font-medium text-amber-700">
                    Perbandingannya bukan 2:1, sebagian gambar akan terpotong.
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className={kelasLabel} htmlFor={`banner-alt-${b.kunci}`}>
                    Keterangan gambar
                  </label>
                  <input
                    id={`banner-alt-${b.kunci}`}
                    value={b.alt}
                    onChange={(e) => ubah(i, "alt", e.target.value)}
                    maxLength={160}
                    placeholder="Tulis ulang isi banner, misalnya: Diskon 10% semua pengusir kucing"
                    className={kelasKotak}
                  />
                  <p className="mt-1.5 text-xs text-stone-500">Dibacakan untuk pengunjung tunanetra dan dibaca mesin pencari.</p>
                </div>
                <div>
                  <label className={kelasLabel} htmlFor={`banner-link-${b.kunci}`}>
                    Link saat diklik (boleh kosong)
                  </label>
                  <input
                    id={`banner-link-${b.kunci}`}
                    value={b.link ?? ""}
                    onChange={(e) => ubah(i, "link", e.target.value)}
                    placeholder="/produk/bye-bye-cat-50g atau https://..."
                    className={`${kelasKotak} font-mono`}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setDaftar(pindahkan(daftar, i, i - 1))}
                    disabled={i === 0}
                    className={kelasTombolKecil}
                  >
                    Naik
                  </button>
                  <button
                    type="button"
                    onClick={() => setDaftar(pindahkan(daftar, i, i + 1))}
                    disabled={i === daftar.length - 1}
                    className={kelasTombolKecil}
                  >
                    Turun
                  </button>
                  <button
                    type="button"
                    onClick={() => setDaftar(daftar.filter((_, j) => j !== i))}
                    className={`${kelasTombolKecil} hover:border-red-500 hover:text-red-700`}
                  >
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          </section>
        ))}

        <div>
          <input
            ref={pilihBerkas}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(e) => void unggah(e.target.files?.[0])}
          />
          <button
            type="button"
            onClick={() => pilihBerkas.current?.click()}
            disabled={mengunggah || daftar.length >= BANNER_MAKS}
            className={kelasTombolTambah}
          >
            {mengunggah ? "Mengunggah..." : "+ Tambah banner"}
          </button>
          {daftar.length >= BANNER_MAKS && (
            <p className="mt-2 text-xs text-stone-500">Maksimal {BANNER_MAKS} banner. Hapus salah satu dulu.</p>
          )}
        </div>
      </fieldset>

      {kabar && (
        <p
          role={kabar.ok ? "status" : "alert"}
          className={`mt-8 border px-4 py-3 text-sm ${
            kabar.ok ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-red-300 bg-red-50 text-red-700"
          }`}
        >
          {kabar.pesan}
        </p>
      )}

      <button type="button" onClick={() => void simpan()} disabled={menyimpan} className={`${kelasTombolUtama} mt-8`}>
        {menyimpan ? "Menyimpan..." : "Simpan banner"}
      </button>
    </div>
  );
}
