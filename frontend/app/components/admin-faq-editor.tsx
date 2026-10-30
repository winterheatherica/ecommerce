"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { simpanFaqToko } from "@/app/lib/api-client";
import {
  kelasKotak,
  kelasLabel,
  kelasTombolKecil,
  kelasTombolTambah,
  kelasTombolUtama,
  pindahkan,
  slugIkutNama,
} from "@/app/lib/admin-ui";
import { PENANDA_FAQ, type KelompokFaqAPI } from "@/app/lib/situs";

type Pertanyaan = { kunci: string; question: string; answer: string };
type Kelompok = { kunci: string; slug: string; title: string; baru: boolean; items: Pertanyaan[] };

let urutan = 0;
const kunciBaru = () => `baru-${++urutan}`;

function dariApi(faq: KelompokFaqAPI[]): Kelompok[] {
  return faq.map((k) => ({
    kunci: k.slug,
    slug: k.slug,
    title: k.title,
    baru: false,
    items: k.items.map((x) => ({ kunci: String(x.id), question: x.question, answer: x.answer })),
  }));
}

export default function AdminFaqEditor({ awal }: { awal: KelompokFaqAPI[] }) {
  const router = useRouter();
  const [kelompok, setKelompokMentah] = useState<Kelompok[]>(() => dariApi(awal));
  const [menyimpan, setMenyimpan] = useState(false);
  const [kabar, setKabar] = useState<{ ok: boolean; pesan: string } | null>(null);

  const setKelompok = (k: Kelompok[]) => {
    setKelompokMentah(k);
    setKabar(null);
  };

  const ubahKelompok = (i: number, ubah: (k: Kelompok) => Kelompok) =>
    setKelompok(kelompok.map((k, j) => (j === i ? ubah(k) : k)));

  const ubahPertanyaan = (i: number, p: number, kolom: "question" | "answer", nilai: string) =>
    ubahKelompok(i, (k) => ({ ...k, items: k.items.map((x, q) => (q === p ? { ...x, [kolom]: nilai } : x)) }));

  const simpan = async () => {
    setMenyimpan(true);
    setKabar(null);

    try {
      const hasil = await simpanFaqToko(
        kelompok.map((k) => ({
          slug: k.slug,
          title: k.title,
          items: k.items.map((x) => ({ question: x.question, answer: x.answer })),
        })),
      );
      setKelompokMentah(dariApi(hasil.faq));
      setKabar({ ok: true, pesan: "FAQ tersimpan dan langsung tampil di website" });
      router.refresh();
    } catch (err) {
      setKabar({ ok: false, pesan: err instanceof Error ? err.message : "Gagal menyimpan" });
    } finally {
      setMenyimpan(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">FAQ</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600">
        Tiap kelompok jadi subjudul di halaman FAQ dan link di footer. Semua perubahan baru tersimpan setelah tombol
        Simpan ditekan.
      </p>
      <div className="mt-4 border border-ink/10 bg-white px-4 py-3 text-sm leading-relaxed text-stone-600">
        <p>Penanda yang otomatis diganti dengan isi Info toko, supaya jawaban ikut berubah kalau info toko diganti:</p>
        <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
          {PENANDA_FAQ.map((p) => (
            <li key={p.kunci}>
              <code className="font-mono text-ink">{`{${p.kunci}}`}</code> {p.arti}
            </li>
          ))}
        </ul>
      </div>

      <fieldset disabled={menyimpan} className="mt-8 space-y-8">
        {kelompok.map((k, i) => (
          <section key={k.kunci} className="border border-ink/10 bg-white p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={kelasLabel} htmlFor={`faq-judul-${k.kunci}`}>
                  Judul kelompok
                </label>
                <input
                  id={`faq-judul-${k.kunci}`}
                  value={k.title}
                  onChange={(e) =>
                    ubahKelompok(i, (x) => ({
                      ...x,
                      title: e.target.value,
                      slug: x.baru ? slugIkutNama(x.slug, x.title, e.target.value) : x.slug,
                    }))
                  }
                  className={kelasKotak}
                />
              </div>
              <div>
                <label className={kelasLabel} htmlFor={`faq-slug-${k.kunci}`}>
                  Slug
                </label>
                <input
                  id={`faq-slug-${k.kunci}`}
                  value={k.slug}
                  onChange={(e) => ubahKelompok(i, (x) => ({ ...x, slug: e.target.value }))}
                  className={`${kelasKotak} font-mono`}
                />
                <p className="mt-1.5 text-xs text-stone-500">Link footer: /faq#{k.slug || "..."}</p>
              </div>
            </div>

            <ol className="mt-6 space-y-4">
              {k.items.map((x, p) => (
                <li key={x.kunci} className="border-t border-ink/10 pt-4">
                  <label className={kelasLabel} htmlFor={`faq-tanya-${x.kunci}`}>
                    Pertanyaan {p + 1}
                  </label>
                  <input
                    id={`faq-tanya-${x.kunci}`}
                    value={x.question}
                    onChange={(e) => ubahPertanyaan(i, p, "question", e.target.value)}
                    className={kelasKotak}
                  />
                  <label className={`${kelasLabel} mt-3`} htmlFor={`faq-jawab-${x.kunci}`}>
                    Jawaban
                  </label>
                  <textarea
                    id={`faq-jawab-${x.kunci}`}
                    value={x.answer}
                    onChange={(e) => ubahPertanyaan(i, p, "answer", e.target.value)}
                    rows={4}
                    className={`${kelasKotak} resize-y leading-relaxed`}
                  />
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => ubahKelompok(i, (y) => ({ ...y, items: pindahkan(y.items, p, p - 1) }))}
                      disabled={p === 0}
                      className={kelasTombolKecil}
                    >
                      Naik
                    </button>
                    <button
                      type="button"
                      onClick={() => ubahKelompok(i, (y) => ({ ...y, items: pindahkan(y.items, p, p + 1) }))}
                      disabled={p === k.items.length - 1}
                      className={kelasTombolKecil}
                    >
                      Turun
                    </button>
                    <button
                      type="button"
                      onClick={() => ubahKelompok(i, (y) => ({ ...y, items: y.items.filter((_, q) => q !== p) }))}
                      className={`${kelasTombolKecil} ml-auto hover:border-red-400 hover:text-red-600`}
                    >
                      Hapus pertanyaan
                    </button>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-6 flex flex-wrap gap-2 border-t border-ink/10 pt-4">
              <button
                type="button"
                onClick={() =>
                  ubahKelompok(i, (y) => ({ ...y, items: [...y.items, { kunci: kunciBaru(), question: "", answer: "" }] }))
                }
                className={kelasTombolTambah}
              >
                Tambah pertanyaan
              </button>
              <button
                type="button"
                onClick={() => setKelompok(pindahkan(kelompok, i, i - 1))}
                disabled={i === 0}
                className={`${kelasTombolKecil} ml-auto`}
              >
                Kelompok naik
              </button>
              <button
                type="button"
                onClick={() => setKelompok(pindahkan(kelompok, i, i + 1))}
                disabled={i === kelompok.length - 1}
                className={kelasTombolKecil}
              >
                Kelompok turun
              </button>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Hapus kelompok "${k.title || "tanpa judul"}" beserta semua pertanyaannya?`)) {
                    setKelompok(kelompok.filter((_, j) => j !== i));
                  }
                }}
                className={`${kelasTombolKecil} hover:border-red-400 hover:text-red-600`}
              >
                Hapus kelompok
              </button>
            </div>
          </section>
        ))}

        <button
          type="button"
          onClick={() =>
            setKelompok([
              ...kelompok,
              { kunci: kunciBaru(), slug: "", title: "", baru: true, items: [{ kunci: kunciBaru(), question: "", answer: "" }] },
            ])
          }
          className={kelasTombolTambah}
        >
          Tambah kelompok
        </button>
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
        {menyimpan ? "Menyimpan..." : "Simpan FAQ"}
      </button>
    </div>
  );
}
