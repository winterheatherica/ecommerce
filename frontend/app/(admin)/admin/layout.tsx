import type { Metadata } from "next";

import AdminNav from "@/app/components/admin-nav";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-full flex-col bg-stone-50 lg:flex-row">
      <AdminNav />
      <main className="flex-1 px-6 py-10 lg:px-10">{children}</main>
    </div>
  );
}
