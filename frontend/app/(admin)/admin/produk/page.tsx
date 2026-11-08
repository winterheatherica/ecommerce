import AdminProducts from "@/app/components/admin-products";
import { ambilProdukAdmin } from "@/app/lib/api";
import { rapikanCari } from "@/app/lib/cari-produk";

type Props = {
  searchParams: Promise<{ q?: string | string[] }>;
};

export default async function AdminProdukPage({ searchParams }: Props) {
  const [produk, { q }] = await Promise.all([ambilProdukAdmin(), searchParams]);

  return <AdminProducts awal={produk} cariAwal={rapikanCari(q)} />;
}
