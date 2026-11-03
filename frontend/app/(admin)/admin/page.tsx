import type { Metadata } from "next";

import BingkaiLaporan from "@/app/components/admin-laporan-bingkai";
import IsiLaporan from "@/app/components/admin-laporan";
import { ambilLaporan } from "@/app/lib/api";
import { bacaPilihan, hariIniWib, kueriApi } from "@/app/lib/laporan";

export const metadata: Metadata = { title: "Laporan penjualan" };

const satu = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function LaporanPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const q = await searchParams;
  const pilihan = bacaPilihan({ periode: satu(q.periode), dari: satu(q.dari), sampai: satu(q.sampai) }, hariIniWib());
  const kueri = kueriApi(pilihan);
  const laporan = await ambilLaporan(kueri);

  return (
    <BingkaiLaporan
      key={`${pilihan.periode}-${laporan.range.from}-${laporan.range.to}`}
      pilihan={pilihan}
      rentang={laporan.range}
      unduh={{
        excel: `/api/admin/reports/orders.xlsx?${kueri}`,
        csv: `/api/admin/reports/orders.csv?${kueri}`,
      }}
    >
      <IsiLaporan laporan={laporan} />
    </BingkaiLaporan>
  );
}
