import type { Metadata } from "next";

import AdminStoreForm from "@/app/components/admin-store-form";
import { ambilSitusAdmin } from "@/app/lib/api";

export const metadata: Metadata = { title: "Info toko" };

export default async function InfoTokoPage() {
  const situs = await ambilSitusAdmin();

  return <AdminStoreForm awal={situs.store} />;
}
