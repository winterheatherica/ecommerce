"use client";

import Image from "next/image";
import { useState, type Dispatch, type ReactNode, type SetStateAction } from "react";

import { hapusFoto, pasangFoto, ubahUkuranFoto, unggahFoto, urutkanFoto } from "@/app/lib/api-client";
import type { FotoUnggahan } from "@/app/lib/foto";
import type { Foto, Produk } from "@/app/data/produk";

export const FOTO_MAKS = 12;

export type FotoBaru = FotoUnggahan;

const JENIS = ["image/jpeg", "image/png", "image/webp"];
const UKURAN_MAKS = 10 * 1024 * 1024;

const tombol =
  "border border-ink/15 px-2.5 py-1.5 font-mono text-[11px] tracking-[0.14em] indent-[0.14em] text-stone-600 uppercase transition-colors hover:border-brand-500 hover:text-brand-600 disabled:cursor-not-allowed disabled:border-ink/10 disabled:text-stone-300";

export const PETUNJUK_FOTO =
  "Foto pertama jadi foto utama di kartu produk dan saat link produk dibagikan. Format JPG, PNG, atau WebP, maksimal 10 MB per foto dan 12 foto per produk.";

function pindahkan<T>(daftar: T[], dari: number, ke: number): T[] {
  const baru = [...daftar];
  const [item] = baru.splice(dari, 1);
  baru.splice(ke, 0, item);
  return baru;
}

function salahBerkas(berkas: File): string | null {
  if (!JENIS.includes(berkas.type)) return `${berkas.name}: harus JPG, PNG, atau WebP`;
  if (berkas.size > UKURAN_MAKS) return `${berkas.name}: lebih dari 10 MB`;
  return null;
}

async function unggahBerurutan(
  berkas: File[],
  sisa: number,
  setSibuk: (pesan: string | null) => void,
  simpan: (foto: FotoUnggahan) => Promise<void>,
): Promise<string[]> {
  const pesan: string[] = [];
  const dipakai = berkas.slice(0, Math.max(0, sisa));

  if (berkas.length > dipakai.length) {
    pesan.push(`Maksimal ${FOTO_MAKS} foto, ${berkas.length - dipakai.length} foto tidak diunggah`);
  }

  for (const [i, b] of dipakai.entries()) {
    const salah = salahBerkas(b);
    if (salah) {
      pesan.push(salah);
      continue;
    }

    setSibuk(`Mengunggah ${i + 1} dari ${dipakai.length}...`);

    try {
      await simpan(await unggahFoto(b));
    } catch (err) {
      pesan.push(`${b.name}: ${err instanceof Error ? err.message : "gagal diunggah"}`);
    }
  }

  setSibuk(null);
  return pesan;
}

function TombolUnggah({
  sisa,
  proses,
  mati,
  onPilih,
}: {
  sisa: number;
  proses: string | null;
  mati: boolean;
  onPilih: (berkas: File[]) => void;
}) {
  const habis = sisa <= 0;
  const nonaktif = mati || habis || proses !== null;

  return (
    <label
      className={`inline-flex items-center border px-5 py-2.5 font-mono text-[12px] tracking-[0.16em] indent-[0.16em] uppercase transition-colors focus-within:border-brand-500 ${
        nonaktif
          ? "cursor-not-allowed border-ink/10 text-stone-300"
          : "cursor-pointer border-brand-500 text-brand-600 hover:bg-brand-50"
      }`}
    >
      <input
        type="file"
        accept={JENIS.join(",")}
        multiple
        disabled={nonaktif}
        className="sr-only"
        onChange={(e) => {
          const daftar = [...(e.target.files ?? [])];
          e.target.value = "";
          if (daftar.length > 0) onPilih(daftar);
        }}
      />
      {proses ?? (habis ? `Sudah ${FOTO_MAKS} foto` : "Tambah foto")}
    </label>
  );
}

function KartuFoto({
  url,
  urutan,
  jumlah,
  utama,
  tersembunyi = false,
  mati,
  bisaHapus,
  onGeser,
  onHapus,
  children,
}: {
  url: string;
  urutan: number;
  jumlah: number;
  utama: boolean;
  tersembunyi?: boolean;
  mati: boolean;
  bisaHapus: boolean;
  onGeser: (arah: -1 | 1) => void;
  onHapus: () => void;
  children?: ReactNode;
}) {
  return (
    <li className="flex flex-col border border-ink/10 bg-white">
      <div className="relative aspect-square overflow-hidden bg-brand-50">
        <Image
          src={url}
          alt={`Foto ${urutan + 1}`}
          fill
          sizes="200px"
          className={`object-cover ${tersembunyi ? "opacity-50" : ""}`}
        />
        {utama && (
          <span className="absolute top-2 left-2 bg-brand-500 px-2 py-1 font-mono text-[10px] tracking-[0.16em] text-white uppercase">
            Utama
          </span>
        )}
        {tersembunyi && (
          <span className="absolute inset-x-0 bottom-0 bg-white/90 px-2 py-1.5 text-[11px] leading-snug text-amber-800">
            Tidak tampil di toko karena ukurannya nonaktif
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-2">
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => onGeser(-1)}
            disabled={mati || urutan === 0}
            aria-label={`Geser foto ${urutan + 1} ke kiri`}
            className={tombol}
          >
            &larr;
          </button>
          <button
            type="button"
            onClick={() => onGeser(1)}
            disabled={mati || urutan === jumlah - 1}
            aria-label={`Geser foto ${urutan + 1} ke kanan`}
            className={tombol}
          >
            &rarr;
          </button>
          <button
            type="button"
            onClick={onHapus}
            disabled={mati || !bisaHapus}
            title={bisaHapus ? undefined : "Produk wajib punya minimal satu foto"}
            className={`${tombol} ml-auto hover:border-red-400 hover:text-red-600`}
          >
            Hapus
          </button>
        </div>
        {children}
      </div>
    </li>
  );
}

export function AdminPhotoPicker({
  foto,
  setFoto,
  sibuk,
  setSibuk,
  mati,
}: {
  foto: FotoBaru[];
  setFoto: Dispatch<SetStateAction<FotoBaru[]>>;
  sibuk: string | null;
  setSibuk: (pesan: string | null) => void;
  mati: boolean;
}) {
  const [galat, setGalat] = useState<string | null>(null);

  const tambah = async (berkas: File[]) => {
    setGalat(null);

    const pesan = await unggahBerurutan(berkas, FOTO_MAKS - foto.length, setSibuk, async (f) => {
      setFoto((lama) => [...lama, f]);
    });

    if (pesan.length > 0) setGalat(pesan.join(". "));
  };

  return (
    <div>
      {foto.length > 0 && (
        <ul className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {foto.map((f, i) => (
            <KartuFoto
              key={f.cloudinary_id}
              url={f.url}
              urutan={i}
              jumlah={foto.length}
              utama={i === 0}
              mati={mati || sibuk !== null}
              bisaHapus
              onGeser={(arah) => setFoto((lama) => pindahkan(lama, i, i + arah))}
              onHapus={() => setFoto((lama) => lama.filter((x) => x.cloudinary_id !== f.cloudinary_id))}
            />
          ))}
        </ul>
      )}

      <TombolUnggah sisa={FOTO_MAKS - foto.length} proses={sibuk} mati={mati} onPilih={(b) => void tambah(b)} />

      {galat && (
        <p role="alert" className="mt-3 text-sm leading-relaxed text-red-700">
          {galat}
        </p>
      )}
    </div>
  );
}

export default function AdminPhotoEditor({ produk }: { produk: Produk }) {
  const [foto, setFoto] = useState<Foto[]>(produk.foto);
  const [unggah, setUnggah] = useState<string | null>(null);
  const [sibuk, setSibuk] = useState(false);
  const [kabar, setKabar] = useState<{ ok: boolean; pesan: string } | null>(null);

  const banyakUkuran = produk.varian.length > 1;
  const mati = sibuk || unggah !== null;
  const nonaktif = new Set(produk.varian.filter((v) => v.aktif === false).map((v) => v.slug));
  const tampil = (f: Foto) => !f.varianSlug || !nonaktif.has(f.varianSlug);
  const idUtama = foto.find(tampil)?.id;

  const jalankan = async (kerja: () => Promise<void>, pesanOk: string) => {
    setSibuk(true);
    setKabar(null);

    try {
      await kerja();
      setKabar({ ok: true, pesan: pesanOk });
    } catch (err) {
      setKabar({ ok: false, pesan: err instanceof Error ? err.message : "Gagal menyimpan" });
    } finally {
      setSibuk(false);
    }
  };

  const tambah = async (berkas: File[]) => {
    setKabar(null);

    let masuk = 0;
    const pesan = await unggahBerurutan(berkas, FOTO_MAKS - foto.length, setUnggah, async (f) => {
      const baru = await pasangFoto(produk.slug, f, null);
      setFoto((lama) => [...lama, baru]);
      masuk++;
    });

    if (pesan.length > 0) setKabar({ ok: false, pesan: pesan.join(". ") });
    else if (masuk > 0) setKabar({ ok: true, pesan: `${masuk} foto ditambahkan` });
  };

  const geser = (i: number, arah: -1 | 1) => {
    const baru = pindahkan(foto, i, i + arah);

    void jalankan(async () => {
      await urutkanFoto(produk.slug, baru.map((f) => f.id));
      setFoto(baru);
    }, "Urutan foto tersimpan");
  };

  const hapus = (f: Foto) => {
    if (!window.confirm("Hapus foto ini dari produk?")) return;

    void jalankan(async () => {
      await hapusFoto(f.id);
      setFoto((lama) => lama.filter((x) => x.id !== f.id));
    }, "Foto dihapus");
  };

  const tandai = (f: Foto, slug: string) => {
    void jalankan(
      async () => {
        const baru = await ubahUkuranFoto(f.id, slug || null);
        setFoto((lama) => lama.map((x) => (x.id === f.id ? baru : x)));
      },
      "Ukuran foto tersimpan",
    );
  };

  return (
    <section className="mt-12 border-t border-ink/10 pt-10">
      <h2 className="text-lg font-semibold tracking-tight text-ink">Foto produk</h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600">
        {PETUNJUK_FOTO} Perubahan di bagian ini langsung tersimpan.
        {banyakUkuran &&
          " Tandai foto dengan ukurannya supaya foto itu yang tampil saat pembeli memilih ukuran tersebut, juga di keranjang."}
      </p>

      {foto.length > 0 ? (
        <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {foto.map((f, i) => (
            <KartuFoto
              key={f.id}
              url={f.url}
              urutan={i}
              jumlah={foto.length}
              utama={f.id === idUtama}
              tersembunyi={!tampil(f)}
              mati={mati}
              bisaHapus={foto.length > 1}
              onGeser={(arah) => geser(i, arah)}
              onHapus={() => hapus(f)}
            >
              {banyakUkuran && (
                <select
                  value={f.varianSlug ?? ""}
                  onChange={(e) => tandai(f, e.target.value)}
                  disabled={mati}
                  aria-label={`Ukuran untuk foto ${i + 1}`}
                  className="w-full border border-ink/15 bg-white px-2 py-1.5 text-xs text-ink outline-none focus:border-brand-500 disabled:bg-stone-100"
                >
                  <option value="">Semua ukuran</option>
                  {produk.varian.map((v) => (
                    <option key={v.slug} value={v.slug}>
                      {v.label}
                      {v.aktif === false ? " (nonaktif)" : ""}
                    </option>
                  ))}
                </select>
              )}
            </KartuFoto>
          ))}
        </ul>
      ) : (
        <p className="mt-6 border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Produk ini belum punya foto. Tambahkan minimal satu.
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <TombolUnggah sisa={FOTO_MAKS - foto.length} proses={unggah} mati={sibuk} onPilih={(b) => void tambah(b)} />
        {kabar && (
          <span
            role={kabar.ok ? "status" : "alert"}
            className={`text-sm leading-relaxed ${kabar.ok ? "text-emerald-700" : "text-red-700"}`}
          >
            {kabar.pesan}
          </span>
        )}
      </div>
    </section>
  );
}
