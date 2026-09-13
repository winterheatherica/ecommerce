import AdminProducts from "@/app/components/admin-products";
import { ambilProdukAdmin } from "@/app/lib/api";

export default async function AdminProdukPage() {
  const produk = await ambilProdukAdmin();

  return <AdminProducts awal={produk} />;
}
