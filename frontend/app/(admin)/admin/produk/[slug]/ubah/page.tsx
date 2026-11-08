import { notFound } from "next/navigation";

import AdminProductForm from "@/app/components/admin-product-form";
import { ambilSatuProdukAdmin } from "@/app/lib/api";
import { alamatDaftarProduk, rapikanCari } from "@/app/lib/cari-produk";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string | string[] }>;
};

export default async function UbahProdukPage({ params, searchParams }: Props) {
  const [{ slug }, { q }] = await Promise.all([params, searchParams]);
  const produk = await ambilSatuProdukAdmin(slug);

  if (!produk) notFound();

  return <AdminProductForm awal={produk} kembali={alamatDaftarProduk(rapikanCari(q))} />;
}
