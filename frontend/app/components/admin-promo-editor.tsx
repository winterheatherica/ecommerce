"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { ubahVarian } from "@/app/lib/api-client";
import { isianWibKeIso, isoKeIsianWib } from "@/app/lib/waktu-wib";
import { rupiah, type Produk, type StatusPromo, type Varian } from "@/app/data/produk";

const LABEL_STATUS: Record<StatusPromo, { teks: string; kelas: string }> = {
  none: { teks: "Tidak ada promo", kelas: "border-ink/15 text-stone-500" },
  active: { teks: "Sedang berlaku", kelas: "border-red-300 bg-red-50 text-red-700" },
  scheduled: { teks: "Terjadwal", kelas: "border-amber-300 bg-amber-50 text-amber-800" },
  ended: { teks: "Sudah berakhir", kelas: "border-stone-300 bg-stone-100 text-stone-500" },
};

const kotak =
  "mt-1.5 w-full border border-ink/15 bg-white px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-brand-500 disabled:bg-stone-100";
const label = "block font-mono text-[11px] tracking-[0.18em] text-stone-500 uppercase";

function BarisPromo({ varian }: { varian: Varian }) {
  const router = useRouter();
  const promo = varian.promo;

  const [harga, setHarga] = useState(promo?.harga ? String(promo.harga) : "");
  const [mulai, setMulai] = useState(isoKeIsianWib(promo?.mulai ?? null));
  const [akhir, setAkhir] = useState(isoKeIsianWib(promo?.akhir ?? null));
  const [tampilkan, setTampilkan] = useState(promo?.tampilkanPeriode ?? false);
  const [status, setStatus] = useState<StatusPromo>(promo?.status ?? "none");
  const [menyimpan, setMenyimpan] = useState(false);
  const [pesan, setPesan] = useState<{ jenis: "galat" | "ok"; teks: string } | null>(null);

  const angka = Number(harga);
  const hemat = harga && angka > 0 && angka < varian.harga ? varian.harga - angka : 0;

  const kirim = async (
    isi: Parameters<typeof ubahVarian>[1],
    berhasil: string,
    setelahnya?: () => void,
  ) => {
    setMenyimpan(true);
    setPesan(null);

    try {
      const hasil = await ubahVarian(varian.slug, isi);
      setStatus(hasil.promo_status ?? "none");
      setelahnya?.();
      setPesan({ jenis: "ok", teks: berhasil });
      router.refresh();
    } catch (err) {
      setPesan({ jenis: "galat", teks: err instanceof Error ? err.message : "Gagal menyimpan" });
    } finally {
      setMenyimpan(false);
    }
  };

  const simpan = () => {
    if (!(angka > 0 && Number.isInteger(angka))) {
      setPesan({ jenis: "galat", teks: "Isi harga promo dulu, dalam rupiah tanpa titik." });
      return;
    }

    void kirim(
      {
        promo_price: angka,
        promo_starts_at: isianWibKeIso(mulai),
        promo_ends_at: isianWibKeIso(akhir),
        promo_show_period: Boolean(akhir) && tampilkan,
      },
      "Promo tersimpan.",
    );
  };

  const hentikan = () => {
    void kirim(
      {
        promo_price: null,
        promo_starts_at: null,
        promo_ends_at: null,
        promo_show_period: false,
      },
      "Promo dihentikan. Harga kembali normal.",
      () => {
        setHarga("");
        setMulai("");
        setAkhir("");
        setTampilkan(false);
      },
    );
  };

  const st = LABEL_STATUS[status];

  return (
    <li className="py-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <p className="text-sm font-medium text-ink">
          {varian.label}
          <span className="ml-2 font-mono text-xs font-normal text-stone-500">
            normal {rupiah(varian.harga)}
          </span>
        </p>
        <span className={`border px-2 py-0.5 font-mono text-[11px] tracking-[0.12em] uppercase ${st.kelas}`}>
          {st.teks}
        </span>
      </div>

      <fieldset disabled={menyimpan} className="mt-4 grid gap-4 sm:grid-cols-[8rem_1fr_1fr]">
        <div>
          <label className={label} htmlFor={`promo-harga-${varian.slug}`}>
            Harga promo
          </label>
          <input
            id={`promo-harga-${varian.slug}`}
            type="number"
            min={1}
            inputMode="numeric"
            value={harga}
            onChange={(e) => setHarga(e.target.value)}
            placeholder="39000"
            className={`${kotak} font-mono`}
          />
          {hemat > 0 && (
            <p className="mt-1 text-xs text-red-700">
              Hemat {rupiah(hemat)} ({Math.round((hemat / varian.harga) * 100)}%)
            </p>
          )}
        </div>
        <div>
          <label className={label} htmlFor={`promo-mulai-${varian.slug}`}>
            Mulai (WIB, boleh kosong)
          </label>
          <input
            id={`promo-mulai-${varian.slug}`}
            type="datetime-local"
            value={mulai}
            onChange={(e) => setMulai(e.target.value)}
            className={kotak}
          />
        </div>
        <div>
          <label className={label} htmlFor={`promo-akhir-${varian.slug}`}>
            Berakhir (WIB, boleh kosong)
          </label>
          <input
            id={`promo-akhir-${varian.slug}`}
            type="datetime-local"
            value={akhir}
            onChange={(e) => setAkhir(e.target.value)}
            className={kotak}
          />
        </div>
      </fieldset>

      <label className="mt-4 flex items-start gap-2.5 text-sm text-stone-700">
        <input
          type="checkbox"
          checked={tampilkan}
          disabled={menyimpan || !akhir}
          onChange={(e) => setTampilkan(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-brand-500"
        />
        <span>
          Tampilkan tanggal berakhir ke pembeli
          <span className="block text-xs text-stone-500">
            Biarkan mati kalau promonya mengikuti Shopee dan bisa berhenti lebih cepat.
          </span>
        </span>
      </label>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={simpan}
          disabled={menyimpan}
          className="border border-brand-500 bg-brand-500 px-5 py-2 font-mono text-[12px] tracking-[0.18em] indent-[0.18em] text-white uppercase transition-colors hover:border-brand-600 hover:bg-brand-600 disabled:cursor-not-allowed disabled:border-stone-300 disabled:bg-stone-300"
        >
          {menyimpan ? "Menyimpan..." : "Simpan promo"}
        </button>
        {status !== "none" && (
          <button
            type="button"
            onClick={hentikan}
            disabled={menyimpan}
            className="border border-ink/20 px-5 py-2 font-mono text-[12px] tracking-[0.18em] indent-[0.18em] text-stone-600 uppercase transition-colors hover:border-red-400 hover:text-red-600 disabled:cursor-not-allowed"
          >
            Hentikan promo
          </button>
        )}
        {pesan && (
          <span
            role={pesan.jenis === "galat" ? "alert" : "status"}
            className={`text-sm ${pesan.jenis === "galat" ? "text-red-700" : "text-emerald-700"}`}
          >
            {pesan.teks}
          </span>
        )}
      </div>
    </li>
  );
}

export default function AdminPromoEditor({ produk }: { produk: Produk }) {
  const aktif = produk.varian.filter((v) => v.aktif !== false);

  return (
    <section className="mt-12 border-t border-ink/10 pt-10">
      <h2 className="text-lg font-semibold tracking-tight text-ink">Harga promo</h2>
      <p className="mt-2 text-sm leading-relaxed text-stone-600">
        Harga promo tampil dengan harga normal dicoret. Tanpa tanggal mulai, promo
        langsung berlaku. Tanpa tanggal berakhir, promo jalan terus sampai
        dihentikan. Pesanan yang sudah dibuat tidak ikut berubah saat promo
        diubah atau berakhir.
      </p>

      <ul className="mt-4 divide-y divide-ink/10 border-y border-ink/10">
        {aktif.map((v) => (
          <BarisPromo key={v.slug} varian={v} />
        ))}
      </ul>
    </section>
  );
}
