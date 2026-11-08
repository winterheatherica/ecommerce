import { notFound } from "next/navigation";

import AdminProductForm from "@/app/components/admin-product-form";
import { ambilNamaMarketplace, ambilSatuProdukAdmin } from "@/app/lib/api";
import { alamatDaftarProduk, rapikanCari } from "@/app/lib/cari-produk";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string | string[] }>;
};

export default async function UbahProdukPage({ params, searchParams }: Props) {
  const [{ slug }, { q }] = await Promise.all([params, searchParams]);
  const [produk, namaMarketplace] = await Promise.all([
    ambilSatuProdukAdmin(slug),
    ambilNamaMarketplace(slug).catch(() => []),
  ]);

  if (!produk) notFound();

  return (
    <AdminProductForm
      awal={produk}
      kembali={alamatDaftarProduk(rapikanCari(q))}
      namaMarketplace={namaMarketplace}
    />
  );
}
