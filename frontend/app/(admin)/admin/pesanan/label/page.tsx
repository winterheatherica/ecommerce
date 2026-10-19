import type { Metadata } from "next";
import Link from "next/link";

import PrintButton from "@/app/components/print-button";
import ShippingLabel from "@/app/components/shipping-label";
import { ambilDaftarPesanan, ambilPesananAdmin, type Pesanan } from "@/app/lib/api";
import { ringkasPaket } from "@/app/lib/paket";

export const metadata: Metadata = {
  title: "Cetak label",
};

const MAKS_SEKALI_CETAK = 50;

type Props = {
  searchParams: Promise<{ no?: string | string[]; status?: string }>;
};

function urutanKirim(a: Pesanan, b: Pesanan): number {
  return (a.paid_at ?? a.created_at).localeCompare(b.paid_at ?? b.created_at);
}

export default async function CetakLabelPage({ searchParams }: Props) {
  const { no, status } = await searchParams;
  const diminta = (Array.isArray(no) ? no : no ? [no] : []).slice(
    0,
    MAKS_SEKALI_CETAK,
  );

  let pesanan: Pesanan[] = [];
  let hilang = 0;

  if (diminta.length > 0) {
    const hasil = await Promise.all(diminta.map((n) => ambilPesananAdmin(n)));
    pesanan = hasil.filter((p): p is Pesanan => p !== null);
    hilang = diminta.length - pesanan.length;
  } else if (status === "PAID") {
    pesanan = (await ambilDaftarPesanan("PAID")).sort(urutanKirim);
  }

  const tanpaPaket = [
    ...new Set(pesanan.flatMap((p) => ringkasPaket(p.items).produkTanpaDimensi)),
  ];

  return (
    <div>
      <style>{`
        @page { size: 100mm 150mm; margin: 0; }
        @media print { html, body { background: #fff !important; } }
      `}</style>

      <div className="mx-auto max-w-3xl print:hidden">
        <Link
          href="/admin/pesanan?status=PAID"
          className="font-mono text-[12px] tracking-[0.2em] text-stone-500 uppercase transition-colors hover:text-brand-600"
        >
          &larr; Kembali ke pesanan
        </Link>

        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-ink">
          Cetak label kirim
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">
          Label ini ditempel di paket sebelum di-drop ke kurir, jadi belum ada
          resinya. Setelah dapat struk dari kurir, isi resinya di halaman
          pesanan.
        </p>

        {pesanan.length > 0 ? (
          <div className="mt-6 flex flex-wrap items-center gap-4 border border-ink/10 bg-white px-5 py-4">
            <PrintButton label={`Cetak ${pesanan.length} label`} />
            <p className="flex-1 text-sm leading-relaxed text-stone-600">
              Di jendela cetak, pilih printer thermal, kertas 100 &times; 150
              mm, margin none, dan skala 100%.
            </p>
          </div>
        ) : (
          <p className="mt-6 border border-ink/10 bg-white px-5 py-8 text-center text-sm text-stone-500">
            {diminta.length > 0
              ? "Nomor pesanan tidak ditemukan."
              : "Tidak ada pesanan yang perlu dikirim."}
          </p>
        )}

        {tanpaPaket.length > 0 && (
          <div className="mt-4 border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-900">
            <p>
              Dimensi paket belum diatur untuk produk ini, jadi dimensinya di
              label dikosongkan untuk ditulis tangan. Beratnya tetap terisi,
              memakai berat produk kalau berat paketnya kosong:
            </p>
            <ul className="mt-2 list-disc pl-5">
              {tanpaPaket.map((nama) => (
                <li key={nama}>{nama}</li>
              ))}
            </ul>
            <p className="mt-2">
              Isi di editor ukuran pada halaman ubah produk supaya label
              berikutnya terisi otomatis.
            </p>
          </div>
        )}

        {hilang > 0 && pesanan.length > 0 && (
          <p className="mt-4 border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {hilang} nomor pesanan tidak ditemukan dan dilewati.
          </p>
        )}
      </div>

      <div className="mt-10 flex flex-col items-center gap-8 print:mt-0 print:block">
        {pesanan.map((p) => (
          <div
            key={p.order_no}
            className="shadow-md ring-1 ring-stone-300 print:break-after-page print:shadow-none print:ring-0 print:last:break-after-auto"
          >
            <ShippingLabel pesanan={p} />
          </div>
        ))}
      </div>
    </div>
  );
}
