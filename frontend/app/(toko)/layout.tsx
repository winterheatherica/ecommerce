import SiteHeader from "@/app/components/site-header";
import SiteFooter from "@/app/components/site-footer";
import { adaSesi } from "@/app/lib/akun";

export default async function TokoLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const masuk = await adaSesi();

  return (
    <>
      <SiteHeader masuk={masuk} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}
