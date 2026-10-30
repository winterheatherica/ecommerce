import type { Metadata } from "next";

import AdminFaqEditor from "@/app/components/admin-faq-editor";
import { ambilSitusAdmin } from "@/app/lib/api";

export const metadata: Metadata = { title: "FAQ" };

export default async function FaqAdminPage() {
  const situs = await ambilSitusAdmin();

  return <AdminFaqEditor awal={situs.faq} />;
}
