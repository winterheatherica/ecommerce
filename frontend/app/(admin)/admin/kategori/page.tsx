import type { Metadata } from "next";

import AdminCategoryEditor from "@/app/components/admin-category-editor";
import { ambilSitusAdmin } from "@/app/lib/api";

export const metadata: Metadata = { title: "Kategori" };

export default async function KategoriPage() {
  const situs = await ambilSitusAdmin();

  return <AdminCategoryEditor awal={situs} />;
}
