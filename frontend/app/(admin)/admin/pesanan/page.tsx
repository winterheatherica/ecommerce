import AdminOrders from "@/app/components/admin-orders";
import { ambilDaftarPesanan } from "@/app/lib/api";

type Props = {
  searchParams: Promise<{ status?: string }>;
};

export default async function AdminPesananPage({ searchParams }: Props) {
  const { status = "" } = await searchParams;
  const pesanan = await ambilDaftarPesanan(status || undefined);

  return <AdminOrders pesanan={pesanan} status={status} />;
}
