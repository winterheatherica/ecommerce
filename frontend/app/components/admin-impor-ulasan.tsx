"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import KolomPilih from "@/app/components/kolom-pilih";
import {
  GalatSimpanUlasan,
  bacaScreenshotUlasan,
  simpanUlasanMassal,
  type KirimanUlasan,
  type SumberImporUlasan,
  type UlasanScreenshot,
} from "@/app/lib/api-client";

export type PilihanVarian = { nilai: string; label: string };

type Baris = {
  id: string;
  layar: number;
  sumber: SumberImporUlasan;
  pilih: boolean;
  nama: string;
  bintang: number;
  teks: string;
  tanggal: string;
  waktuAsli: string | null;
  presisi: "day" | "month";
  produk: string | null;
  varian: string;
  tebakan: "nama" | "mirip" | null;
  kandidat: string[];
  utuh: boolean;
  kembar: boolean;
  galat?: string;
};

type Layar = {
  id: number;
  nama: string;
  url: string;
  status: "antre" | "membaca" | "selesai" | "gagal";
  bagian?: string;
  jumlah?: number;
  pesan?: string;
};

const SUMBER: { nilai: SumberImporUlasan; label: string }[] = [
  { nilai: "shopee", label: "Shopee" },
  { nilai: "tokopedia", label: "Tokopedia & TikTok Shop" },
];

const LABEL_SUMBER: Record<SumberImporUlasan, { teks: string; kelas: string }> = {
  shopee: { teks: "Shopee", kelas: "border-orange-300 bg-orange-50 text-orange-700" },
  tokopedia: { teks: "Tokopedia & TikTok Shop", kelas: "border-emerald-300 bg-emerald-50 text-emerald-700" },
};

const LEBAR_MAKS = 1080;
const TINGGI_POTONG = 2200;
const TUMPANG = 260;
const SELISIH_WIB = 7 * 3600e3;

const label = "block font-mono text-[12px] tracking-[0.2em] text-stone-500 uppercase";
const kotak =
  "mt-2 w-full border border-ink/15 bg-white px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-stone-400 focus:border-brand-500";

function samarkan(nama: string): string {
  const s = nama.trim();
  if (!s) return "Pembeli";
  if (s.includes("*")) return s;
  if (s.length <= 2) return `${s[0]}*`;
  return `${s[0]}*****${s.at(-1)}`;
}

function tanggalWib(iso: string | null): string {
  if (!iso) return "";
  return new Date(Date.parse(iso) + SELISIH_WIB).toISOString().slice(0, 10);
}

async function siapkanGambar(berkas: File): Promise<Blob[]> {
  const gambar = await createImageBitmap(berkas);
  const skala = Math.min(1, LEBAR_MAKS / gambar.width);
  const lebar = Math.round(gambar.width * skala);
  const tinggi = Math.round(gambar.height * skala);
  const potongan: Blob[] = [];

  for (let atas = 0; atas < tinggi; atas += TINGGI_POTONG - TUMPANG) {
    const t = Math.min(TINGGI_POTONG, tinggi - atas);
    const kanvas = document.createElement("canvas");
    kanvas.width = lebar;
    kanvas.height = t;
    kanvas.getContext("2d")?.drawImage(gambar, 0, atas / skala, gambar.width, t / skala, 0, 0, lebar, t);

    potongan.push(
      await new Promise<Blob>((selesai, gagal) =>
        kanvas.toBlob((b) => (b ? selesai(b) : gagal(new Error("Gambar gagal diproses"))), "image/jpeg", 0.9),
      ),
    );

    if (atas + t >= tinggi) break;
  }

  gambar.close();
  return potongan;
}

function kunciBaris(b: Pick<Baris, "sumber" | "nama" | "bintang" | "tanggal" | "teks">): string {
  return [b.sumber, b.nama.trim().toLowerCase(), b.bintang, b.tanggal, b.teks.trim()].join("|");
}

function keBaris(u: UlasanScreenshot, sumber: SumberImporUlasan, layar: number, urutan: number): Baris {
  const nama = u.author_name_raw.trim();

  return {
    id: `${layar}-${urutan}-${Math.random().toString(36).slice(2, 8)}`,
    layar,
    sumber,
    pilih: u.complete && !u.duplicate && nama !== "",
    nama,
    bintang: u.rating,
    teks: u.body ?? "",
    tanggal: tanggalWib(u.reviewed_at),
    waktuAsli: u.reviewed_at,
    presisi: u.reviewed_precision,
    produk: u.marketplace_product,
    varian: u.variant_slug ?? "",
    tebakan: u.variant_guess,
    kandidat: u.variant_candidates ?? [],
    utuh: u.complete,
    kembar: u.duplicate,
  };
}

function Bintang({ nilai, ubah, id }: { nilai: number; ubah: (n: number) => void; id: string }) {
  return (
    <div role="radiogroup" aria-labelledby={id} className="mt-2 flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={nilai === n}
          aria-label={`${n} bintang`}
          onClick={() => ubah(n)}
          className={`text-2xl leading-none transition-colors ${n <= nilai ? "text-amber-500" : "text-stone-300 hover:text-amber-300"}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function AdminImporUlasan({ varian }: { varian: PilihanVarian[] }) {
  const [sumber, setSumber] = useState<SumberImporUlasan>("shopee");
  const [layar, setLayar] = useState<Layar[]>([]);
  const [baris, setBaris] = useState<Baris[]>([]);
  const [membaca, setMembaca] = useState(false);
  const [menyimpan, setMenyimpan] = useState(false);
  const [pesan, setPesan] = useState<{ teks: string; gagal: boolean } | null>(null);
  const [seret, setSeret] = useState(false);
  const pemilih = useRef<HTMLInputElement>(null);
  const kotakSemua = useRef<HTMLInputElement>(null);
  const urlGambar = useRef<string[]>([]);
  const nomorLayar = useRef(0);

  useEffect(() => {
    const daftar = urlGambar.current;
    return () => daftar.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  const opsiVarian = [{ nilai: "", label: "Pilih ukuran" }, ...varian];
  const labelVarian = new Map(varian.map((v) => [v.nilai, v.label]));
  const terpilih = baris.filter((b) => b.pilih);
  const semuaDipilih = baris.length > 0 && terpilih.length === baris.length;

  useEffect(() => {
    if (kotakSemua.current) {
      kotakSemua.current.indeterminate = terpilih.length > 0 && terpilih.length < baris.length;
    }
  }, [terpilih.length, baris.length]);

  const pilihSemua = (pilih: boolean) => {
    setPesan(null);
    setBaris((lama) => lama.map((b) => ({ ...b, pilih, galat: pilih ? b.galat : undefined })));
  };

  const yakinSimpanSebagian = (): boolean => {
    const lewat = baris.filter((b) => !b.pilih);
    if (lewat.length === 0) return true;

    const kembar = lewat.filter((b) => b.kembar).length;
    const terpotong = lewat.filter((b) => !b.kembar && !b.utuh).length;
    const rincian = [
      kembar > 0 ? `${kembar} sudah pernah disimpan` : "",
      terpotong > 0 ? `${terpotong} terpotong` : "",
    ].filter(Boolean);

    return window.confirm(
      `Baru ${terpilih.length} dari ${baris.length} ulasan yang dipilih.\n\n` +
        `${lewat.length} ulasan yang tidak dipilih${rincian.length > 0 ? ` (${rincian.join(", ")})` : ""} ` +
        `tidak akan ikut disimpan. Simpan ${terpilih.length} ulasan yang dipilih saja?`,
    );
  };

  const ubahLayar = (id: number, ubah: Partial<Layar>) =>
    setLayar((lama) => lama.map((l) => (l.id === id ? { ...l, ...ubah } : l)));

  const ubahBaris = (id: string, ubah: Partial<Baris>) => {
    setPesan(null);
    setBaris((lama) => lama.map((b) => (b.id === id ? { ...b, ...ubah, galat: undefined } : b)));
  };

  const tambahHasil = (nomor: number, dari: SumberImporUlasan, hasil: UlasanScreenshot[]) =>
    setBaris((lama) => {
      const ada = new Set(lama.map(kunciBaris));
      const baru: Baris[] = [];

      hasil.forEach((u, i) => {
        const b = keBaris(u, dari, nomor, i);
        const kunci = kunciBaris(b);
        if (ada.has(kunci)) return;
        ada.add(kunci);
        baru.push(b);
      });

      return [...lama, ...baru];
    });

  const baca = async (berkas: File[]) => {
    const gambar = berkas.filter((f) => f.type.startsWith("image/"));
    if (gambar.length === 0) return;

    const antre = gambar.map((f) => {
      nomorLayar.current += 1;
      const url = URL.createObjectURL(f);
      urlGambar.current.push(url);
      return { berkas: f, layar: { id: nomorLayar.current, nama: f.name, url, status: "antre" as const } };
    });

    const dari = sumber;

    setLayar((lama) => [...lama, ...antre.map((a) => a.layar)]);
    setMembaca(true);
    setPesan(null);

    for (const { berkas: f, layar: l } of antre) {
      try {
        const potongan = await siapkanGambar(f);
        let jumlah = 0;

        for (const [i, p] of potongan.entries()) {
          ubahLayar(l.id, {
            status: "membaca",
            bagian: potongan.length > 1 ? `bagian ${i + 1} dari ${potongan.length}` : undefined,
          });
          const hasil = await bacaScreenshotUlasan(p, dari);
          jumlah += hasil.length;
          tambahHasil(l.id, dari, hasil);
        }

        ubahLayar(l.id, { status: "selesai", jumlah, bagian: undefined });
      } catch (err) {
        ubahLayar(l.id, {
          status: "gagal",
          bagian: undefined,
          pesan: err instanceof Error ? err.message : "Screenshot gagal dibaca",
        });
      }
    }

    setMembaca(false);
  };

  const pilihBerkas = (daftar: FileList | null) => {
    if (daftar && daftar.length > 0) void baca([...daftar]);
    if (pemilih.current) pemilih.current.value = "";
  };

  const simpan = async () => {
    const salah = new Map<string, string>();

    for (const b of terpilih) {
      if (!b.nama.trim()) salah.set(b.id, "Nama pengulas belum diisi.");
      else if (!b.tanggal) salah.set(b.id, "Tanggal belum diisi.");
      else if (!b.varian) salah.set(b.id, "Pilih ukuran produknya di toko.");
    }

    if (salah.size > 0) {
      setBaris((lama) => lama.map((b) => ({ ...b, galat: salah.get(b.id) })));
      setPesan({ teks: `${salah.size} ulasan belum lengkap. Lengkapi yang ditandai merah.`, gagal: true });
      document.getElementById(`ulasan-${[...salah.keys()][0]}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    if (!yakinSimpanSebagian()) return;

    const keKiriman = (b: Baris): KirimanUlasan => ({
      variant_slug: b.varian,
      rating: b.bintang,
      author_name: b.nama.trim(),
      body: b.teks.trim() || null,
      reviewed_at: b.waktuAsli && tanggalWib(b.waktuAsli) === b.tanggal ? b.waktuAsli : `${b.tanggal}T12:00:00+07:00`,
      reviewed_precision: b.presisi,
      marketplace_product: b.produk,
    });

    setMenyimpan(true);
    setPesan(null);

    let masuk = 0;
    let kembar = 0;

    try {
      for (const s of SUMBER.map((x) => x.nilai)) {
        const kelompok = terpilih.filter((b) => b.sumber === s);
        if (kelompok.length === 0) continue;

        try {
          const hasil = await simpanUlasanMassal(s, kelompok.map(keKiriman));
          const tersimpan = new Set(kelompok.map((b) => b.id));

          masuk += hasil.inserted;
          kembar += hasil.duplicates;
          setBaris((lama) => lama.filter((b) => !tersimpan.has(b.id)));
        } catch (err) {
          if (err instanceof GalatSimpanUlasan && err.perBaris.length > 0) {
            const perId = new Map(err.perBaris.map((g) => [kelompok[g.index]?.id, g.message]));
            setBaris((lama) => lama.map((b) => ({ ...b, galat: perId.get(b.id) ?? b.galat })));
          }
          throw err;
        }
      }

      setPesan({
        teks:
          masuk === 0
            ? `Tidak ada ulasan baru. ${kembar} ulasan dilewati karena sudah pernah disimpan.`
            : `${masuk} ulasan tersimpan${kembar > 0 ? `, ${kembar} dilewati karena sudah pernah disimpan` : ""}.`,
        gagal: false,
      });
    } catch (err) {
      const sebagian = masuk > 0 ? ` (${masuk} ulasan lain sudah tersimpan)` : "";
      setPesan({ teks: `${err instanceof Error ? err.message : "Ulasan gagal disimpan"}${sebagian}`, gagal: true });
    } finally {
      setMenyimpan(false);
    }
  };

  const nomorUrut = new Map(layar.map((l, i) => [l.id, i + 1]));

  return (
    <div className="mx-auto max-w-4xl pb-28">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Impor ulasan</h1>
      <p className="mt-1 max-w-2xl text-sm leading-relaxed text-stone-500">
        Unggah screenshot daftar ulasan dari aplikasi Shopee Seller atau TikTok Shop. Ulasannya dibaca otomatis,
        kamu periksa dulu di bawah, lalu disimpan sekaligus. Nama asli pengulas hanya tersimpan untuk admin; di toko
        tampil disamarkan.
      </p>

      <div className="mt-8 border border-ink/10 bg-white p-6">
        <p id="label-sumber" className={label}>
          1. Ulasan dari
        </p>
        <div role="radiogroup" aria-labelledby="label-sumber" className="mt-3 flex flex-wrap gap-2">
          {SUMBER.map((s) => (
            <button
              key={s.nilai}
              type="button"
              role="radio"
              aria-checked={sumber === s.nilai}
              disabled={membaca}
              onClick={() => setSumber(s.nilai)}
              className={`border px-4 py-2 text-sm transition-colors disabled:cursor-not-allowed ${
                sumber === s.nilai
                  ? "border-brand-500 bg-brand-500 text-white"
                  : "border-ink/15 text-stone-600 hover:border-brand-400 hover:text-brand-600"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <p className={`${label} mt-8`}>2. Screenshot</p>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setSeret(true);
          }}
          onDragLeave={() => setSeret(false)}
          onDrop={(e) => {
            e.preventDefault();
            setSeret(false);
            if (!membaca) void baca([...e.dataTransfer.files]);
          }}
          className={`mt-3 flex flex-col items-center gap-3 border border-dashed px-6 py-8 text-center transition-colors ${
            seret ? "border-brand-500 bg-brand-50" : "border-ink/20"
          }`}
        >
          <button
            type="button"
            onClick={() => pemilih.current?.click()}
            disabled={membaca}
            className="border border-brand-500 bg-brand-500 px-5 py-2.5 font-mono text-[13px] tracking-[0.18em] indent-[0.18em] text-white uppercase transition-colors hover:border-brand-600 hover:bg-brand-600 disabled:cursor-not-allowed disabled:border-stone-300 disabled:bg-stone-300"
          >
            {membaca ? "Sedang membaca..." : "Pilih screenshot"}
          </button>
          <p className="text-sm text-stone-500">
            Bisa beberapa sekaligus, atau seret ke sini. Satu screenshot butuh sekitar 10 sampai 40 detik.
          </p>
          <input
            ref={pemilih}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            hidden
            onChange={(e) => pilihBerkas(e.target.files)}
          />
        </div>

        {layar.length > 0 && (
          <ul className="mt-4 divide-y divide-ink/5 border border-ink/10">
            {layar.map((l, i) => (
              <li key={l.id} className="flex items-center gap-3 px-3 py-2">
                <a href={l.url} target="_blank" rel="noopener" className="shrink-0">
                  <Image
                    src={l.url}
                    alt={`Screenshot ${i + 1}`}
                    width={40}
                    height={56}
                    unoptimized
                    className="h-14 w-10 border border-ink/10 object-cover object-top"
                  />
                </a>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-ink">
                    Screenshot {i + 1} <span className="text-stone-400">· {l.nama}</span>
                  </p>
                  <p
                    className={`text-[13px] ${
                      l.status === "gagal" ? "text-red-600" : l.status === "selesai" ? "text-emerald-700" : "text-stone-500"
                    }`}
                  >
                    {l.status === "antre" && "Menunggu giliran"}
                    {l.status === "membaca" && `Sedang dibaca${l.bagian ? ` (${l.bagian})` : ""}...`}
                    {l.status === "selesai" && `Selesai, ${l.jumlah} ulasan terbaca`}
                    {l.status === "gagal" && l.pesan}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {baris.length > 0 && (
        <section className="mt-10">
          <h2 className={label}>3. Periksa sebelum disimpan</h2>
          <p className="mt-2 text-sm text-stone-500">
            Cocokkan dengan screenshot-nya. Ulasan yang terpotong atau sudah pernah disimpan tidak dicentang otomatis.
          </p>

          <ul className="mt-4 space-y-3">
            {baris.map((b) => (
              <li
                key={b.id}
                id={`ulasan-${b.id}`}
                className={`border bg-white p-5 ${b.galat ? "border-red-300" : b.pilih ? "border-ink/15" : "border-ink/10 opacity-70"}`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <label className="mr-2 flex items-center gap-2 text-sm text-ink">
                    <input
                      type="checkbox"
                      checked={b.pilih}
                      onChange={(e) => ubahBaris(b.id, { pilih: e.target.checked })}
                      className="h-4 w-4 accent-brand-500"
                    />
                    Simpan
                  </label>
                  <span className={`border px-1.5 py-0.5 font-mono text-[11px] uppercase ${LABEL_SUMBER[b.sumber].kelas}`}>
                    {LABEL_SUMBER[b.sumber].teks}
                  </span>
                  <span className="font-mono text-[11px] text-stone-400 uppercase">Screenshot {nomorUrut.get(b.layar)}</span>
                  {!b.utuh && (
                    <span className="border border-amber-300 bg-amber-50 px-1.5 py-0.5 font-mono text-[11px] text-amber-800 uppercase">
                      Terpotong, cek lagi
                    </span>
                  )}
                  {b.kembar && (
                    <span className="border border-stone-300 bg-stone-100 px-1.5 py-0.5 font-mono text-[11px] text-stone-600 uppercase">
                      Sudah pernah disimpan
                    </span>
                  )}
                  {!b.teks.trim() && (
                    <span className="border border-ink/10 px-1.5 py-0.5 font-mono text-[11px] text-stone-500 uppercase">
                      Cuma bintang
                    </span>
                  )}
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto_auto]">
                  <div>
                    <label className={label} htmlFor={`nama-${b.id}`}>
                      Nama pengulas
                    </label>
                    <input
                      id={`nama-${b.id}`}
                      value={b.nama}
                      maxLength={60}
                      onChange={(e) => ubahBaris(b.id, { nama: e.target.value })}
                      className={kotak}
                    />
                    <p className="mt-1 font-mono text-[12px] text-stone-400">Tampil di toko: {samarkan(b.nama)}</p>
                  </div>
                  <div>
                    <p id={`bintang-${b.id}`} className={label}>
                      Bintang
                    </p>
                    <Bintang id={`bintang-${b.id}`} nilai={b.bintang} ubah={(n) => ubahBaris(b.id, { bintang: n })} />
                  </div>
                  <div>
                    <label className={label} htmlFor={`tanggal-${b.id}`}>
                      Tanggal
                    </label>
                    <input
                      id={`tanggal-${b.id}`}
                      type="date"
                      value={b.tanggal}
                      onChange={(e) => ubahBaris(b.id, { tanggal: e.target.value })}
                      className={kotak}
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className={label} htmlFor={`teks-${b.id}`}>
                    Isi ulasan
                  </label>
                  <textarea
                    id={`teks-${b.id}`}
                    value={b.teks}
                    rows={2}
                    maxLength={3000}
                    placeholder="Tanpa tulisan"
                    onChange={(e) => ubahBaris(b.id, { teks: e.target.value })}
                    className={kotak}
                  />
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className={label}>Produk di marketplace</p>
                    <p className="mt-2 text-sm break-words text-stone-600">{b.produk ?? "Tidak terbaca"}</p>
                  </div>
                  <div>
                    <p id={`varian-${b.id}`} className={label}>
                      Ukuran di toko
                    </p>
                    <KolomPilih
                      labelId={`varian-${b.id}`}
                      nilai={b.varian}
                      opsi={opsiVarian}
                      ubah={(v) => ubahBaris(b.id, { varian: v, tebakan: null })}
                      bulat={false}
                      className="mt-2 w-full border border-ink/15 bg-white px-3 py-2 text-left text-sm text-ink outline-none transition-colors focus:border-brand-500"
                    />
                    {b.tebakan && b.varian && (
                      <p className="mt-1 font-mono text-[12px] text-stone-400">
                        {b.tebakan === "nama"
                          ? `Cocok dengan nama listing di ${LABEL_SUMBER[b.sumber].teks}`
                          : "Tebakan dari nama produk, cek lagi"}
                      </p>
                    )}
                    {b.kandidat.some((k) => labelVarian.has(k)) && (
                      <div className="mt-2">
                        <p className="font-mono text-[11px] tracking-[0.14em] text-stone-400 uppercase">Paling mirip</p>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {b.kandidat
                            .filter((k) => labelVarian.has(k))
                            .map((k) => (
                              <button
                                key={k}
                                type="button"
                                aria-pressed={b.varian === k}
                                onClick={() => ubahBaris(b.id, { varian: k, tebakan: null })}
                                className={`max-w-full border px-2 py-1 text-left text-[12px] leading-snug transition-colors ${
                                  b.varian === k
                                    ? "border-brand-500 bg-brand-50 text-brand-700"
                                    : "border-ink/15 text-stone-600 hover:border-brand-400 hover:text-brand-600"
                                }`}
                              >
                                {labelVarian.get(k)}
                              </button>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {b.galat && (
                  <p role="alert" className="mt-3 text-sm text-red-600">
                    {b.galat}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {(baris.length > 0 || pesan) && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-ink/10 bg-white/95 px-6 py-4 backdrop-blur lg:left-60">
          <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <p role="status" className={`text-sm ${pesan?.gagal ? "text-red-600" : "text-stone-600"}`}>
                {pesan?.teks ?? `${terpilih.length} dari ${baris.length} ulasan dipilih`}
              </p>
              {baris.length > 0 && (
                <label className="flex items-center gap-2 text-sm text-ink">
                  <input
                    ref={kotakSemua}
                    type="checkbox"
                    checked={semuaDipilih}
                    disabled={menyimpan}
                    onChange={(e) => pilihSemua(e.target.checked)}
                    className="h-4 w-4 accent-brand-500"
                  />
                  Pilih semua
                </label>
              )}
            </div>
            {baris.length > 0 && (
              <button
                type="button"
                onClick={() => void simpan()}
                disabled={menyimpan || membaca || terpilih.length === 0}
                className="border border-brand-500 bg-brand-500 px-6 py-2.5 font-mono text-[13px] tracking-[0.18em] indent-[0.18em] text-white uppercase transition-colors hover:border-brand-600 hover:bg-brand-600 disabled:cursor-not-allowed disabled:border-stone-300 disabled:bg-stone-300"
              >
                {menyimpan ? "Menyimpan..." : `Simpan ${terpilih.length} ulasan`}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
