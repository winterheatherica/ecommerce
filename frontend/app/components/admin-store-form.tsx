"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { simpanInfoToko } from "@/app/lib/api-client";
import { kelasKotak, kelasLabel, kelasTombolKecil, kelasTombolTambah, kelasTombolUtama } from "@/app/lib/admin-ui";
import { NAMA_HARI, formatWa, teksHari, teksJam, teksLibur, type TokoAPI } from "@/app/lib/situs";

const SOSIAL_MAKS = 8;

const ALAMAT: { kolom: keyof TokoAPI; nama: string; contoh: string }[] = [
  { kolom: "address_street", nama: "Jalan", contoh: "Jl. Bhayangkara I No. 76, RT 3/RW 3" },
  { kolom: "address_village", nama: "Kelurahan", contoh: "Munjul" },
  { kolom: "address_district", nama: "Kecamatan", contoh: "Cipayung" },
  { kolom: "address_city", nama: "Kota", contoh: "Jakarta Timur" },
  { kolom: "address_province", nama: "Provinsi", contoh: "DKI Jakarta" },
  { kolom: "postal_code", nama: "Kode pos", contoh: "13850" },
];

type Isian = Omit<TokoAPI, "updated_at" | "wa_link" | "maps_url"> & { wa_link: string; maps_url: string };

function isianAwal(t: TokoAPI | null): Isian {
  return {
    wa_number: t ? formatWa(t.wa_number).tampil : "",
    wa_link: t?.wa_link ?? "",
    address_street: t?.address_street ?? "",
    address_village: t?.address_village ?? "",
    address_district: t?.address_district ?? "",
    address_city: t?.address_city ?? "",
    address_province: t?.address_province ?? "",
    postal_code: t?.postal_code ?? "",
    maps_url: t?.maps_url ?? "",
    open_days: t?.open_days ?? [1, 2, 3, 4, 5, 6],
    opens_at: t?.opens_at ?? "09:00",
    closes_at: t?.closes_at ?? "17:00",
    closed_on_holidays: t?.closed_on_holidays ?? true,
    social_links: t?.social_links ?? [],
  };
}

export default function AdminStoreForm({ awal }: { awal: TokoAPI | null }) {
  const router = useRouter();
  const [isi, setIsi] = useState<Isian>(() => isianAwal(awal));
  const [menyimpan, setMenyimpan] = useState(false);
  const [kabar, setKabar] = useState<{ ok: boolean; pesan: string } | null>(null);

  const ubah = <K extends keyof Isian>(kolom: K, nilai: Isian[K]) => {
    setIsi((lama) => ({ ...lama, [kolom]: nilai }));
    setKabar(null);
  };

  const ubahSosial = (i: number, kolom: "label" | "url", nilai: string) =>
    ubah(
      "social_links",
      isi.social_links.map((s, j) => (j === i ? { ...s, [kolom]: nilai } : s)),
    );

  const gantiHari = (h: number) =>
    ubah(
      "open_days",
      isi.open_days.includes(h) ? isi.open_days.filter((x) => x !== h) : [...isi.open_days, h].sort((a, b) => a - b),
    );

  const simpan = async (e: React.FormEvent) => {
    e.preventDefault();
    setMenyimpan(true);
    setKabar(null);

    try {
      const hasil = await simpanInfoToko({
        ...isi,
        wa_link: isi.wa_link.trim() || null,
        maps_url: isi.maps_url.trim() || null,
      });
      setIsi(isianAwal(hasil));
      setKabar({ ok: true, pesan: "Info toko tersimpan dan langsung tampil di website" });
      router.refresh();
    } catch (err) {
      setKabar({ ok: false, pesan: err instanceof Error ? err.message : "Gagal menyimpan" });
    } finally {
      setMenyimpan(false);
    }
  };

  const libur = teksLibur(isi.open_days, isi.closed_on_holidays);
  const jamSah = isi.opens_at < isi.closes_at;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Info toko</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600">
        Dipakai di footer, halaman privasi, label kirim, tombol WhatsApp, data Google, dan jawaban FAQ yang memakai
        penanda seperti {"{kota}"}.
      </p>

      <form onSubmit={simpan} className="mt-8">
        <fieldset disabled={menyimpan} className="space-y-10">
          <section className="space-y-6">
            <h2 className="text-lg font-semibold tracking-tight text-ink">WhatsApp</h2>
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className={kelasLabel} htmlFor="wa">
                  Nomor WhatsApp
                </label>
                <input
                  id="wa"
                  value={isi.wa_number}
                  onChange={(e) => ubah("wa_number", e.target.value)}
                  inputMode="tel"
                  placeholder="0813-1724-4671"
                  className={`${kelasKotak} font-mono`}
                />
              </div>
              <div>
                <label className={kelasLabel} htmlFor="wa-link">
                  Link WhatsApp <span className="normal-case">(opsional)</span>
                </label>
                <input
                  id="wa-link"
                  value={isi.wa_link}
                  onChange={(e) => ubah("wa_link", e.target.value)}
                  placeholder="https://wa.me/message/..."
                  className={`${kelasKotak} font-mono text-[13px]`}
                />
              </div>
            </div>
            <p className="text-xs leading-relaxed text-stone-500">
              Link pendek dari WhatsApp Business dipakai untuk tombol chat dan kode QR di footer. Kalau dikosongkan, tombol
              memakai wa.me dengan nomor di atas.
            </p>
          </section>

          <section className="space-y-6">
            <h2 className="text-lg font-semibold tracking-tight text-ink">Alamat</h2>
            <div className="grid gap-6 sm:grid-cols-2">
              {ALAMAT.map((a) => (
                <div key={a.kolom} className={a.kolom === "address_street" ? "sm:col-span-2" : ""}>
                  <label className={kelasLabel} htmlFor={a.kolom}>
                    {a.nama}
                  </label>
                  <input
                    id={a.kolom}
                    value={String(isi[a.kolom as keyof Isian])}
                    onChange={(e) => ubah(a.kolom as keyof Isian, e.target.value as never)}
                    placeholder={a.contoh}
                    className={kelasKotak}
                  />
                </div>
              ))}
              <div className="sm:col-span-2">
                <label className={kelasLabel} htmlFor="maps">
                  Link Google Maps <span className="normal-case">(opsional)</span>
                </label>
                <input
                  id="maps"
                  value={isi.maps_url}
                  onChange={(e) => ubah("maps_url", e.target.value)}
                  placeholder="https://maps.app.goo.gl/..."
                  className={`${kelasKotak} font-mono text-[13px]`}
                />
              </div>
            </div>
            <p className="text-xs leading-relaxed text-stone-500">
              Kota juga dipakai sebagai kota asal kirim di FAQ ({"{kota}"}). Kota asal ongkir RajaOngkir diatur terpisah di
              server.
            </p>
          </section>

          <section className="space-y-6">
            <h2 className="text-lg font-semibold tracking-tight text-ink">Jam buka</h2>
            <div>
              <p className={kelasLabel}>Hari buka</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5, 6, 7].map((h) => (
                  <label
                    key={h}
                    className={`cursor-pointer border px-3 py-2 text-sm transition-colors ${
                      isi.open_days.includes(h)
                        ? "border-brand-500 bg-brand-50 text-brand-700"
                        : "border-ink/15 text-stone-600 hover:border-brand-400"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isi.open_days.includes(h)}
                      onChange={() => gantiHari(h)}
                      className="sr-only"
                    />
                    {NAMA_HARI[h]}
                  </label>
                ))}
              </div>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className={kelasLabel} htmlFor="buka">
                  Jam buka
                </label>
                <input
                  id="buka"
                  type="time"
                  value={isi.opens_at}
                  onChange={(e) => ubah("opens_at", e.target.value)}
                  className={`${kelasKotak} font-mono`}
                />
              </div>
              <div>
                <label className={kelasLabel} htmlFor="tutup">
                  Jam tutup
                </label>
                <input
                  id="tutup"
                  type="time"
                  value={isi.closes_at}
                  onChange={(e) => ubah("closes_at", e.target.value)}
                  className={`${kelasKotak} font-mono`}
                />
              </div>
            </div>
            <label className="flex items-center gap-3 text-sm text-ink">
              <input
                type="checkbox"
                checked={isi.closed_on_holidays}
                onChange={(e) => ubah("closed_on_holidays", e.target.checked)}
                className="h-4 w-4 accent-brand-500"
              />
              Tutup saat libur nasional
            </label>
            <p className="border border-ink/10 bg-white px-4 py-3 text-sm leading-relaxed text-stone-600">
              Tampil di website:{" "}
              <span className="text-ink">
                {isi.open_days.length > 0 ? teksHari(isi.open_days) : "belum ada hari buka"},{" "}
                {jamSah ? teksJam(isi.opens_at, isi.closes_at) : "jam tutup harus setelah jam buka"}
                {libur ? `. Libur ${libur}` : ""}
              </span>
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold tracking-tight text-ink">Media sosial</h2>
            <p className="text-xs leading-relaxed text-stone-500">
              WhatsApp selalu tampil paling depan. Link di bawah ini tampil di footer dan dipakai Google untuk mengenali
              akun resmi toko.
            </p>
            {isi.social_links.map((s, i) => (
              <div key={i} className="flex flex-wrap items-end gap-3">
                <div className="w-40">
                  <label className={kelasLabel} htmlFor={`sosial-nama-${i}`}>
                    Nama
                  </label>
                  <input
                    id={`sosial-nama-${i}`}
                    value={s.label}
                    onChange={(e) => ubahSosial(i, "label", e.target.value)}
                    placeholder="Instagram"
                    className={kelasKotak}
                  />
                </div>
                <div className="min-w-60 flex-1">
                  <label className={kelasLabel} htmlFor={`sosial-link-${i}`}>
                    Link
                  </label>
                  <input
                    id={`sosial-link-${i}`}
                    value={s.url}
                    onChange={(e) => ubahSosial(i, "url", e.target.value)}
                    placeholder="https://www.instagram.com/..."
                    className={`${kelasKotak} font-mono text-[13px]`}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => ubah("social_links", isi.social_links.filter((_, j) => j !== i))}
                  className={`${kelasTombolKecil} mb-1 hover:border-red-400 hover:text-red-600`}
                >
                  Hapus
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => ubah("social_links", [...isi.social_links, { label: "", url: "" }])}
              disabled={isi.social_links.length >= SOSIAL_MAKS}
              className={kelasTombolTambah}
            >
              Tambah link
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

        <button type="submit" disabled={menyimpan} className={`${kelasTombolUtama} mt-8`}>
          {menyimpan ? "Menyimpan..." : "Simpan info toko"}
        </button>
      </form>
    </div>
  );
}
