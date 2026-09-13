"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { kosongkanKeranjang, useKeranjang } from "@/app/lib/keranjang";
import {
  ambilOngkir,
  buatPesanan,
  cariWilayah,
  type OpsiOngkir,
  type Wilayah,
} from "@/app/lib/api-client";
import { rupiah, type Produk } from "@/app/data/produk";

type Baris = { produk: Produk; qty: number };

const labelInput =
  "block font-mono text-[10px] tracking-[0.2em] text-stone-500 uppercase";
const kotakInput =
  "mt-2 w-full border border-ink/15 px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-stone-400 focus:border-brand-500 disabled:bg-stone-100";

export default function CheckoutForm({ produk }: { produk: Produk[] }) {
  const router = useRouter();
  const items = useKeranjang();

  const [nama, setNama] = useState("");
  const [telepon, setTelepon] = useState("");
  const [email, setEmail] = useState("");
  const [alamat, setAlamat] = useState("");
  const [catatan, setCatatan] = useState("");

  const [kataWilayah, setKataWilayah] = useState("");
  const [tujuan, setTujuan] = useState<Wilayah | null>(null);
  const [saran, setSaran] = useState<Wilayah[]>([]);
  const [mencariWilayah, setMencariWilayah] = useState(false);

  const [opsiOngkir, setOpsiOngkir] = useState<OpsiOngkir[]>([]);
  const [memuatOngkir, setMemuatOngkir] = useState(false);
  const [ongkirDipilih, setOngkirDipilih] = useState<OpsiOngkir | null>(null);

  const [galat, setGalat] = useState<string[]>([]);
  const [mengirim, setMengirim] = useState(false);

  const baris: Baris[] = items
    .map((i) => {
      const cocok = produk.find((p) => p.slug === i.slug);
      return cocok ? { produk: cocok, qty: i.qty } : null;
    })
    .filter((x): x is Baris => x !== null);

  const subtotal = baris.reduce((s, b) => s + b.produk.harga * b.qty, 0);
  const beratTotal = baris.reduce((s, b) => s + b.produk.beratG * b.qty, 0);
  const total = subtotal + (ongkirDipilih?.cost ?? 0);

  useEffect(() => {
    if (tujuan) {
      setSaran([]);
      return;
    }

    const q = kataWilayah.trim();
    if (q.length < 2) {
      setSaran([]);
      return;
    }

    const kendali = new AbortController();
    const timer = window.setTimeout(async () => {
      setMencariWilayah(true);
      try {
        setSaran(await cariWilayah(q, kendali.signal));
      } catch {
        setSaran([]);
      } finally {
        setMencariWilayah(false);
      }
    }, 250);

    return () => {
      kendali.abort();
      window.clearTimeout(timer);
    };
  }, [kataWilayah, tujuan]);

  useEffect(() => {
    if (!tujuan || beratTotal <= 0) {
      setOpsiOngkir([]);
      return;
    }

    const kendali = new AbortController();
    setMemuatOngkir(true);

    ambilOngkir(tujuan.id, beratTotal, kendali.signal)
      .then(setOpsiOngkir)
      .catch(() => setOpsiOngkir([]))
      .finally(() => setMemuatOngkir(false));

    return () => kendali.abort();
  }, [tujuan, beratTotal]);

  useEffect(() => {
    setOngkirDipilih(null);
  }, [tujuan, beratTotal]);

  const pilihWilayah = (w: Wilayah) => {
    setTujuan(w);
    setKataWilayah(w.label);
    setSaran([]);
  };

  const periksa = () => {
    const pesan: string[] = [];
    if (nama.trim().length < 3) pesan.push("Nama penerima belum diisi.");
    if (!/^0\d{8,13}$/.test(telepon.replace(/[\s-]/g, "")))
      pesan.push("Nomor HP tidak valid. Contoh: 081234567890.");
    if (alamat.trim().length < 10)
      pesan.push("Alamat terlalu pendek. Tulis lengkap sampai nomor rumah.");
    if (!tujuan) pesan.push("Kecamatan tujuan belum dipilih.");
    if (!ongkirDipilih) pesan.push("Layanan pengiriman belum dipilih.");
    return pesan;
  };

  const kirim = async (e: React.FormEvent) => {
    e.preventDefault();

    const pesan = periksa();
    setGalat(pesan);
    if (pesan.length > 0 || !tujuan || !ongkirDipilih) return;

    setMengirim(true);
    try {
      const hasil = await buatPesanan({
        customer_name: nama,
        phone: telepon,
        email: email || undefined,
        address: alamat,
        notes: catatan || undefined,
        dest_id: tujuan.id,
        courier: ongkirDipilih.courier,
        service: ongkirDipilih.service,
        etd: ongkirDipilih.etd,
        items: baris.map((b) => ({ slug: b.produk.slug, qty: b.qty })),
      });

      kosongkanKeranjang();
      router.push(hasil.invoice_url ?? `/order/${hasil.order_no}`);
    } catch (err) {
      setGalat([err instanceof Error ? err.message : "Pesanan gagal dibuat."]);
      setMengirim(false);
    }
  };

  if (baris.length === 0) {
    return (
      <div className="mx-auto w-full max-w-3xl px-6 pt-32 pb-24">
        <p className="font-mono text-[11px] tracking-[0.28em] text-accent-600 uppercase">
          Checkout
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Keranjang kosong
        </h1>
        <p className="mt-4 leading-relaxed text-stone-600">
          Tidak ada yang bisa di-checkout. Pilih produknya dulu.
        </p>
        <a
          href="/produk"
          className="mt-8 inline-block border border-ink px-8 py-3.5 font-mono text-[11px] tracking-[0.22em] text-ink uppercase transition-colors hover:bg-ink hover:text-white"
        >
          Lihat produk
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-6 pt-32 pb-24">
      <p className="font-mono text-[11px] tracking-[0.28em] text-accent-600 uppercase">
        Checkout
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
        Data pengiriman
      </h1>

      <form
        onSubmit={kirim}
        className="mt-12 grid gap-12 lg:grid-cols-[1fr_20rem] lg:gap-16"
      >
        <fieldset disabled={mengirim} className="space-y-8">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className={labelInput} htmlFor="nama">
                Nama penerima
              </label>
              <input
                id="nama"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Nama lengkap"
                autoComplete="name"
                className={kotakInput}
              />
            </div>
            <div>
              <label className={labelInput} htmlFor="telepon">
                Nomor HP
              </label>
              <input
                id="telepon"
                value={telepon}
                onChange={(e) => setTelepon(e.target.value)}
                placeholder="081234567890"
                inputMode="numeric"
                autoComplete="tel"
                className={kotakInput}
              />
            </div>
          </div>

          <div>
            <label className={labelInput} htmlFor="email">
              Email <span className="normal-case">(opsional)</span>
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="untuk bukti pembayaran"
              autoComplete="email"
              className={kotakInput}
            />
          </div>

          <div className="relative">
            <label className={labelInput} htmlFor="wilayah">
              Kecamatan tujuan
            </label>
            <input
              id="wilayah"
              value={kataWilayah}
              onChange={(e) => {
                setKataWilayah(e.target.value);
                setTujuan(null);
              }}
              placeholder="Ketik nama kecamatan atau kota"
              autoComplete="off"
              role="combobox"
              aria-expanded={saran.length > 0}
              aria-controls="saran-wilayah"
              className={kotakInput}
            />

            {mencariWilayah && (
              <p className="mt-2 font-mono text-[10px] tracking-[0.18em] text-stone-400 uppercase">
                Mencari...
              </p>
            )}

            {saran.length > 0 && (
              <ul
                id="saran-wilayah"
                className="absolute z-10 mt-1 w-full border border-ink/15 bg-white shadow-lg"
              >
                {saran.map((w) => (
                  <li key={w.id}>
                    <button
                      type="button"
                      onClick={() => pilihWilayah(w)}
                      className="block w-full px-4 py-3 text-left text-sm text-stone-700 transition-colors hover:bg-brand-50 hover:text-brand-700"
                    >
                      {w.label}
                      <span className="ml-2 font-mono text-xs text-stone-400">
                        {w.postal_code}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <label className={labelInput} htmlFor="alamat">
              Alamat lengkap
            </label>
            <textarea
              id="alamat"
              value={alamat}
              onChange={(e) => setAlamat(e.target.value)}
              rows={3}
              placeholder="Nama jalan, nomor rumah, RT/RW, patokan"
              autoComplete="street-address"
              className={`${kotakInput} resize-none leading-relaxed`}
            />
          </div>

          <div>
            <label className={labelInput} htmlFor="catatan">
              Catatan <span className="normal-case">(opsional)</span>
            </label>
            <input
              id="catatan"
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Titip ke satpam, dll"
              className={kotakInput}
            />
          </div>

          <div className="border-t border-ink/10 pt-8">
            <h2 className={labelInput}>Layanan pengiriman</h2>

            {!tujuan && (
              <p className="mt-4 text-sm text-stone-500">
                Pilih kecamatan tujuan dulu, ongkirnya dihitung otomatis.
              </p>
            )}

            {tujuan && memuatOngkir && (
              <p className="mt-4 font-mono text-[10px] tracking-[0.18em] text-stone-400 uppercase">
                Menghitung ongkir...
              </p>
            )}

            {tujuan && !memuatOngkir && opsiOngkir.length === 0 && (
              <p className="mt-4 text-sm text-red-600">
                Ongkir gagal dihitung. Coba pilih ulang kecamatannya.
              </p>
            )}

            {tujuan && !memuatOngkir && opsiOngkir.length > 0 && (
              <ul className="mt-4 space-y-2">
                {opsiOngkir.map((o) => {
                  const dipilih =
                    ongkirDipilih?.courier === o.courier &&
                    ongkirDipilih?.service === o.service;

                  return (
                    <li key={`${o.courier}-${o.service}`}>
                      <button
                        type="button"
                        onClick={() => setOngkirDipilih(o)}
                        aria-pressed={dipilih}
                        className={`flex w-full items-center justify-between gap-4 border px-4 py-3.5 text-left transition-colors ${
                          dipilih
                            ? "border-brand-500 bg-brand-50"
                            : "border-ink/15 hover:border-brand-400"
                        }`}
                      >
                        <span>
                          <span className="text-sm font-medium text-ink">
                            {o.courier} {o.service}
                          </span>
                          <span className="mt-0.5 block font-mono text-[11px] text-stone-500">
                            estimasi {o.etd} hari
                          </span>
                        </span>
                        <span className="font-mono text-sm text-brand-600">
                          {rupiah(o.cost)}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </fieldset>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="border border-ink/10 bg-stone-50 p-6">
            <h2 className={labelInput}>Ringkasan</h2>

            <ul className="mt-5 space-y-2">
              {baris.map(({ produk: p, qty }) => (
                <li key={p.slug} className="flex justify-between gap-3 text-sm">
                  <span className="text-stone-700">
                    {qty}&times; {p.nama}
                  </span>
                  <span className="font-mono whitespace-nowrap text-stone-500">
                    {rupiah(p.harga * qty)}
                  </span>
                </li>
              ))}
            </ul>

            <dl className="mt-5 space-y-2 border-t border-ink/10 pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-stone-600">Subtotal</dt>
                <dd className="font-mono text-ink">{rupiah(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-stone-600">Ongkir</dt>
                <dd className="font-mono text-ink">
                  {ongkirDipilih ? rupiah(ongkirDipilih.cost) : "—"}
                </dd>
              </div>
              <div className="flex justify-between border-t border-ink/10 pt-3 text-base font-semibold">
                <dt className="text-ink">Total</dt>
                <dd className="font-mono text-brand-600">{rupiah(total)}</dd>
              </div>
            </dl>

            <button
              type="submit"
              disabled={mengirim}
              className="mt-8 w-full border border-brand-500 bg-brand-500 px-8 py-3.5 font-mono text-[11px] tracking-[0.22em] text-white uppercase transition-colors hover:border-brand-600 hover:bg-brand-600 disabled:cursor-not-allowed disabled:border-stone-300 disabled:bg-stone-300"
            >
              {mengirim ? "Memproses..." : "Lanjut ke pembayaran"}
            </button>

            <a
              href="/keranjang"
              className="mt-4 block text-center font-mono text-[10px] tracking-[0.18em] text-stone-500 uppercase transition-colors hover:text-brand-600"
            >
              Kembali ke keranjang
            </a>
          </div>

          {galat.length > 0 && (
            <div role="alert" className="mt-6 border border-red-300 bg-red-50 p-5">
              <p className="font-mono text-[10px] tracking-[0.2em] text-red-700 uppercase">
                Belum bisa diproses
              </p>
              <ul className="mt-3 space-y-1.5 text-sm text-red-700">
                {galat.map((g) => (
                  <li key={g}>&middot; {g}</li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </form>
    </div>
  );
}
