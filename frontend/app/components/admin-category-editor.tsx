"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import KolomPilih from "@/app/components/kolom-pilih";
import { simpanKategoriToko } from "@/app/lib/api-client";
import {
  kelasKotak,
  kelasLabel,
  kelasTombolKecil,
  kelasTombolTambah,
  kelasTombolUtama,
  pindahkan,
  slugIkutNama,
} from "@/app/lib/admin-ui";
import type { GrupAPI, KategoriAPI, SitusAPI } from "@/app/lib/situs";

type Grup = GrupAPI & { baru: boolean };
type Kategori = Omit<KategoriAPI, "complaint"> & { complaint: string; baru: boolean; kunci: string };

function dariSitus(s: SitusAPI): { grup: Grup[]; kategori: Kategori[] } {
  return {
    grup: s.groups.map((g) => ({ ...g, baru: false })),
    kategori: s.categories.map((k) => ({ ...k, complaint: k.complaint ?? "", baru: false, kunci: k.slug })),
  };
}

function Kolom({
  id,
  nama,
  nilai,
  ubah,
  petunjuk,
  panjang,
  mati,
  mono,
}: {
  id: string;
  nama: string;
  nilai: string;
  ubah: (v: string) => void;
  petunjuk?: string;
  panjang?: boolean;
  mati?: boolean;
  mono?: boolean;
}) {
  return (
    <div className={panjang ? "sm:col-span-2" : ""}>
      <label className={kelasLabel} htmlFor={id}>
        {nama}
      </label>
      {panjang ? (
        <textarea
          id={id}
          value={nilai}
          onChange={(e) => ubah(e.target.value)}
          rows={3}
          className={`${kelasKotak} resize-y leading-relaxed`}
        />
      ) : (
        <input
          id={id}
          value={nilai}
          onChange={(e) => ubah(e.target.value)}
          disabled={mati}
          className={`${kelasKotak} ${mono ? "font-mono" : ""}`}
        />
      )}
      {petunjuk && <p className="mt-1.5 text-xs leading-relaxed text-stone-500">{petunjuk}</p>}
    </div>
  );
}

export default function AdminCategoryEditor({ awal }: { awal: SitusAPI }) {
  const router = useRouter();
  const [{ grup, kategori }, setIsi] = useState(() => dariSitus(awal));
  const [terbuka, setTerbuka] = useState<string | null>(null);
  const [menyimpan, setMenyimpan] = useState(false);
  const [kabar, setKabar] = useState<{ ok: boolean; pesan: string } | null>(null);

  const setGrup = (g: Grup[]) => {
    setIsi((lama) => ({ ...lama, grup: g }));
    setKabar(null);
  };
  const setKategori = (k: Kategori[]) => {
    setIsi((lama) => ({ ...lama, kategori: k }));
    setKabar(null);
  };

  const ubahGrup = (i: number, kolom: keyof GrupAPI, nilai: string) =>
    setGrup(
      grup.map((g, j) =>
        j !== i
          ? g
          : kolom === "label" && g.baru
            ? { ...g, label: nilai, slug: slugIkutNama(g.slug, g.label, nilai) }
            : { ...g, [kolom]: nilai },
      ),
    );

  const ubahKategori = (i: number, kolom: keyof Kategori, nilai: string) =>
    setKategori(
      kategori.map((k, j) =>
        j !== i
          ? k
          : kolom === "label" && k.baru
            ? { ...k, label: nilai, slug: slugIkutNama(k.slug, k.label, nilai) }
            : { ...k, [kolom]: nilai },
      ),
    );

  const tambahKategori = () => {
    const kunci = `baru-${Date.now()}`;
    setKategori([
      ...kategori,
      {
        slug: "",
        group_slug: grup[0]?.slug ?? "",
        label: "",
        title: "",
        seo_title: "",
        summary: "",
        complaint: "",
        product_count: 0,
        baru: true,
        kunci,
      },
    ]);
    setTerbuka(kunci);
  };

  const simpan = async () => {
    setMenyimpan(true);
    setKabar(null);

    try {
      const hasil = await simpanKategoriToko({
        groups: grup.map((g) => ({ slug: g.slug, label: g.label, title: g.title, summary: g.summary })),
        categories: kategori.map((k) => ({
          slug: k.slug,
          group_slug: k.group_slug,
          label: k.label,
          title: k.title,
          seo_title: k.seo_title,
          summary: k.summary,
          complaint: k.complaint.trim() || null,
        })),
      });
      setIsi(dariSitus(hasil));
      setKabar({ ok: true, pesan: "Kategori tersimpan dan langsung tampil di website" });
      router.refresh();
    } catch (err) {
      setKabar({ ok: false, pesan: err instanceof Error ? err.message : "Gagal menyimpan" });
    } finally {
      setMenyimpan(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Kategori</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600">
        Grup jadi tombol besar di katalog, kategori jadi tombol di dalamnya. Urutan di sini sama dengan urutan di
        website. Kategori yang punya teks keluhan tampil sebagai kotak masalah di beranda. Semua perubahan baru tersimpan
        setelah tombol Simpan ditekan.
      </p>

      <fieldset disabled={menyimpan}>
        <section className="mt-10">
          <h2 className="text-lg font-semibold tracking-tight text-ink">Grup</h2>
          <ul className="mt-4 space-y-4">
            {grup.map((g, i) => {
              const dipakai = kategori.filter((k) => k.group_slug === g.slug).length;

              return (
                <li key={i} className="border border-ink/10 bg-white p-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Kolom id={`grup-nama-${i}`} nama="Nama tombol" nilai={g.label} ubah={(v) => ubahGrup(i, "label", v)} />
                    <Kolom
                      id={`grup-slug-${i}`}
                      nama="Slug"
                      nilai={g.slug}
                      ubah={(v) => ubahGrup(i, "slug", v)}
                      mati={!g.baru}
                      mono
                      petunjuk={g.baru ? `Alamatnya nanti /produk?grup=${g.slug || "..."}` : "Tidak bisa diubah, sudah dipakai di link"}
                    />
                    <Kolom id={`grup-judul-${i}`} nama="Judul halaman" nilai={g.title} ubah={(v) => ubahGrup(i, "title", v)} />
                    <Kolom id={`grup-ringkasan-${i}`} nama="Ringkasan" nilai={g.summary} ubah={(v) => ubahGrup(i, "summary", v)} panjang />
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <button type="button" onClick={() => setGrup(pindahkan(grup, i, i - 1))} disabled={i === 0} className={kelasTombolKecil}>
                      Naik
                    </button>
                    <button
                      type="button"
                      onClick={() => setGrup(pindahkan(grup, i, i + 1))}
                      disabled={i === grup.length - 1}
                      className={kelasTombolKecil}
                    >
                      Turun
                    </button>
                    <span className="ml-auto text-xs text-stone-500">{dipakai} kategori</span>
                    <button
                      type="button"
                      onClick={() => setGrup(grup.filter((_, j) => j !== i))}
                      disabled={dipakai > 0}
                      title={dipakai > 0 ? "Pindahkan atau hapus kategorinya dulu" : undefined}
                      className={`${kelasTombolKecil} hover:border-red-400 hover:text-red-600`}
                    >
                      Hapus
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
          <button
            type="button"
            onClick={() => setGrup([...grup, { slug: "", label: "", title: "", summary: "", baru: true }])}
            className={`${kelasTombolTambah} mt-4`}
          >
            Tambah grup
          </button>
        </section>

        <section className="mt-12">
          <h2 className="text-lg font-semibold tracking-tight text-ink">Kategori</h2>
          <ul className="mt-4 space-y-3">
            {kategori.map((k, i) => {
              const kunci = k.kunci;
              const buka = terbuka === kunci;
              const namaGrup = grup.find((g) => g.slug === k.group_slug)?.label ?? "tanpa grup";
              const jumlah = k.product_count ?? 0;

              return (
                <li key={kunci} className="border border-ink/10 bg-white">
                  <div className="flex flex-wrap items-center gap-2 px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setTerbuka(buka ? null : kunci)}
                      aria-expanded={buka}
                      className="min-w-0 flex-1 text-left"
                    >
                      <span className="block font-medium text-ink">{k.label || "Kategori baru"}</span>
                      <span className="block text-xs text-stone-500">
                        {namaGrup} · {jumlah} produk{k.complaint.trim() ? " · tampil di beranda" : ""}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setKategori(pindahkan(kategori, i, i - 1))}
                      disabled={i === 0}
                      aria-label={`Naikkan ${k.label}`}
                      className={kelasTombolKecil}
                    >
                      &uarr;
                    </button>
                    <button
                      type="button"
                      onClick={() => setKategori(pindahkan(kategori, i, i + 1))}
                      disabled={i === kategori.length - 1}
                      aria-label={`Turunkan ${k.label}`}
                      className={kelasTombolKecil}
                    >
                      &darr;
                    </button>
                    <button
                      type="button"
                      onClick={() => setKategori(kategori.filter((_, j) => j !== i))}
                      disabled={jumlah > 0}
                      title={jumlah > 0 ? `Masih dipakai ${jumlah} produk` : undefined}
                      className={`${kelasTombolKecil} hover:border-red-400 hover:text-red-600`}
                    >
                      Hapus
                    </button>
                  </div>

                  {buka && (
                    <div className="grid gap-4 border-t border-ink/10 p-4 sm:grid-cols-2">
                      <Kolom id={`kat-nama-${i}`} nama="Nama tombol" nilai={k.label} ubah={(v) => ubahKategori(i, "label", v)} />
                      <Kolom
                        id={`kat-slug-${i}`}
                        nama="Slug"
                        nilai={k.slug}
                        ubah={(v) => ubahKategori(i, "slug", v)}
                        mati={!k.baru}
                        mono
                        petunjuk={k.baru ? `Alamatnya nanti /produk?kategori=${k.slug || "..."}` : "Tidak bisa diubah, sudah dipakai di link"}
                      />
                      <div>
                        <label className={kelasLabel} htmlFor={`kat-grup-${i}`} id={`kat-grup-${i}-label`}>
                          Grup
                        </label>
                        <KolomPilih
                          id={`kat-grup-${i}`}
                          labelId={`kat-grup-${i}-label`}
                          nilai={k.group_slug}
                          opsi={grup.map((g) => ({ nilai: g.slug, label: g.label || g.slug || "Grup baru" }))}
                          ubah={(v) => ubahKategori(i, "group_slug", v)}
                          bulat={false}
                          className={kelasKotak}
                        />
                      </div>
                      <Kolom id={`kat-judul-${i}`} nama="Judul halaman" nilai={k.title} ubah={(v) => ubahKategori(i, "title", v)} />
                      <Kolom
                        id={`kat-seo-${i}`}
                        nama="Judul di Google"
                        nilai={k.seo_title}
                        ubah={(v) => ubahKategori(i, "seo_title", v)}
                      />
                      <Kolom
                        id={`kat-keluhan-${i}`}
                        nama="Keluhan di beranda (opsional)"
                        nilai={k.complaint}
                        ubah={(v) => ubahKategori(i, "complaint", v)}
                        petunjuk="Contoh: Berak di teras & motor. Kosongkan kalau tidak perlu tampil di beranda."
                      />
                      <Kolom
                        id={`kat-ringkasan-${i}`}
                        nama="Ringkasan"
                        nilai={k.summary}
                        ubah={(v) => ubahKategori(i, "summary", v)}
                        panjang
                        petunjuk="Tampil di Google dan sebagai deskripsi produk yang belum punya deskripsi sendiri."
                      />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          <button type="button" onClick={tambahKategori} className={`${kelasTombolTambah} mt-4`}>
            Tambah kategori
          </button>
        </section>
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
        {menyimpan ? "Menyimpan..." : "Simpan kategori"}
      </button>
    </div>
  );
}
