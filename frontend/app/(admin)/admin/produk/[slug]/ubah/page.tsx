import { notFound } from "next/navigation";

import AdminProductForm from "@/app/components/admin-product-form";
import { ambilSatuProdukAdmin } from "@/app/lib/api";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function UbahProdukPage({ params }: Props) {
  const { slug } = await params;
  const produk = await ambilSatuProdukAdmin(slug);

  if (!produk) notFound();

  return <AdminProductForm awal={produk} />;
}
