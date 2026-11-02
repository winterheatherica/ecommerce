import type { Metadata } from "next";

import AdminBannerEditor from "@/app/components/admin-banner-editor";
import { ambilSitusAdmin } from "@/app/lib/api";

export const metadata: Metadata = { title: "Banner promo" };

export default async function BannerAdminPage() {
  const situs = await ambilSitusAdmin();

  return <AdminBannerEditor awal={situs.banners ?? []} />;
}
