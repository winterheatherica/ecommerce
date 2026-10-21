"use client";

import { useState, useSyncExternalStore } from "react";

import Turnstile from "@/app/components/turnstile";
import { kirimUlasanPesanan, type UlasanSayaAPI } from "@/app/lib/api-client";

type Barang = { variantSlug: string; nama: string };

type Props = {
  orderNo: string;
  barang: Barang[];
  ulasanAwal: UlasanSayaAPI[];
  siteKey: string | null;
};

function langgananMenit(ubah: () => void): () => void {
  const jeda = window.setInterval(ubah, 30_000);
  return () => window.clearInterval(jeda);
}

const menitIni = () => Math.floor(Date.now() / 60_000) * 60_000;

const jam = (iso: string) =>
  new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" });

const tanggal = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" });

function PilihBintang({ nilai, ubah }: { nilai: number; ubah: (n: number) => void }) {
  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Bintang">
      {[1, 2, 3, 4, 5].map((b) => (
        <button
          key={b}
          type="button"
          role="radio"
          aria-checked={nilai === b}
          aria-label={`${b} bintang`}
          onClick={() => ubah(b)}
          className={`text-2xl leading-none transition-colors ${b <= nilai ? "text-amber-500" : "text-stone-300 hover:text-amber-300"}`}
        >
          &#9733;
        </button>
      ))}
    </div>
  );
}

function Form({
  orderNo,
  barang,
  awal,
  siteKey,
  selesai,
  batal,
}: {
  orderNo: string;
  barang: Barang;
  awal: UlasanSayaAPI | null;
  siteKey: string | null;
  selesai: (u: UlasanSayaAPI) => void;
  batal: () => void;
}) {
  const [bintang, setBintang] = useState(awal?.rating ?? 0);
  const [teks, setTeks] = useState(awal?.body ?? "");
  const [token, setToken] = useState<string | null>(null);
  const [ulang, setUlang] = useState(0);
  const [mengirim, setMengirim] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);

  const bisaKirim = bintang > 0 && (!siteKey || token) && !mengirim;

  const kirim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bisaKirim) return;

    setMengirim(true);
    setGalat(null);

    try {
      const hasil = await kirimUlasanPesanan(
        orderNo,
        barang.variantSlug,
        { rating: bintang, body: teks.trim() || null, turnstile_token: token ?? undefined },
        Boolean(awal),
      );
      selesai(hasil);
    } catch (err) {
      setGalat(err instanceof Error ? err.message : "Ulasan gagal dikirim.");
      setToken(null);
      setUlang((u) => u + 1);
    } finally {
      setMengirim(false);
    }
  };

  return (
    <form onSubmit={kirim} className="mt-4 border border-ink/10 bg-stone-50 p-5">
      <p className="font-mono text-[12px] tracking-[0.16em] text-stone-500 uppercase">Bintang</p>
      <div className="mt-2">
        <PilihBintang nilai={bintang} ubah={setBintang} />
      </div>

      <label className="mt-5 block font-mono text-[12px] tracking-[0.16em] text-stone-500 uppercase" htmlFor={`ulasan-${barang.variantSlug}`}>
        Ceritakan pengalamanmu <span className="normal-case">(opsional)</span>
      </label>
      <textarea
        id={`ulasan-${barang.variantSlug}`}
        value={teks}
        onChange={(e) => setTeks(e.target.value)}
        rows={4}
        maxLength={3000}
        placeholder="Misalnya dipakai di mana, dan bagaimana hasilnya setelah beberapa hari."
        className="mt-2 w-full border border-ink/15 bg-white px-4 py-3 text-sm leading-relaxed text-ink outline-none transition-colors placeholder:text-stone-400 focus:border-brand-500"
      />

      {siteKey && <Turnstile siteKey={siteKey} ulang={ulang} onToken={setToken} className="mt-5" />}

      {galat && (
        <p role="alert" className="mt-4 text-sm text-red-700">
          {galat}
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={!bisaKirim}
          className="border border-brand-500 bg-brand-500 px-6 py-2.5 font-mono text-[13px] tracking-[0.2em] indent-[0.2em] text-white uppercase transition-colors hover:border-brand-600 hover:bg-brand-600 disabled:cursor-not-allowed disabled:border-stone-300 disabled:bg-stone-300"
        >
          {mengirim ? "Mengirim..." : awal ? "Simpan perubahan" : "Kirim ulasan"}
        </button>
        <button
          type="button"
          onClick={batal}
          className="font-mono text-[12px] tracking-[0.14em] text-stone-500 uppercase transition-colors hover:text-ink"
        >
          Batal
        </button>
        {bintang === 0 && <span className="text-xs text-stone-500">Pilih bintangnya dulu.</span>}
      </div>
    </form>
  );
}

export default function UlasanPesanan({ orderNo, barang, ulasanAwal, siteKey }: Props) {
  const [ulasan, setUlasan] = useState<Record<string, UlasanSayaAPI>>(
    Object.fromEntries(ulasanAwal.map((u) => [u.variant_slug, u])),
  );
  const [dibuka, setDibuka] = useState<string | null>(null);
  const sekarang = useSyncExternalStore(langgananMenit, menitIni, () => null);

  return (
    <section className="mt-12 border-t border-ink/10 pt-10">
      <h2 className="font-mono text-[13px] tracking-[0.28em] text-stone-500 uppercase">Ulas pesananmu</h2>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-stone-600">
        Ulasanmu langsung tampil di halaman produk dengan nama yang disamarkan. Kamu masih bisa
        mengubahnya dalam 3 jam setelah dikirim.
      </p>

      <ul className="mt-6 divide-y divide-ink/10 border-y border-ink/10">
        {barang.map((b) => {
          const u = ulasan[b.variantSlug] ?? null;
          const bisaUbah = u !== null && sekarang !== null && sekarang < Date.parse(u.editable_until);
          const terbuka = dibuka === b.variantSlug;

          return (
            <li key={b.variantSlug} className="py-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <p className="min-w-0 flex-1 text-sm font-medium text-ink">{b.nama}</p>
                {!terbuka && (!u || bisaUbah) && (
                  <button
                    type="button"
                    onClick={() => setDibuka(b.variantSlug)}
                    className="shrink-0 border border-ink/15 px-4 py-2 font-mono text-[12px] tracking-[0.16em] indent-[0.16em] text-stone-600 uppercase transition-colors hover:border-brand-500 hover:text-brand-600"
                  >
                    {u ? "Ubah ulasan" : "Tulis ulasan"}
                  </button>
                )}
              </div>

              {u && !terbuka && (
                <div className="mt-3">
                  <p className="text-sm text-amber-500" aria-label={`${u.rating} dari 5 bintang`}>
                    {"★".repeat(u.rating)}
                    <span className="text-stone-300">{"★".repeat(5 - u.rating)}</span>
                  </p>
                  {u.body && (
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed whitespace-pre-line break-words text-stone-700">
                      {u.body}
                    </p>
                  )}
                  <p className="mt-2 font-mono text-[12px] text-stone-400">
                    Terkirim {tanggal(u.created_at)}
                    {bisaUbah ? ` · bisa diubah sampai ${jam(u.editable_until)} WIB` : ""}
                  </p>
                </div>
              )}

              {terbuka && (
                <Form
                  orderNo={orderNo}
                  barang={b}
                  awal={u}
                  siteKey={siteKey}
                  selesai={(baru) => {
                    setUlasan((s) => ({ ...s, [b.variantSlug]: baru }));
                    setDibuka(null);
                  }}
                  batal={() => setDibuka(null)}
                />
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
