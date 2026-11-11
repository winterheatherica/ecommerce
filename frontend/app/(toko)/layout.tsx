import Script from "next/script";

import SiteHeader from "@/app/components/site-header";
import SiteFooter from "@/app/components/site-footer";
import { adaSesi } from "@/app/lib/akun";
import { ambilSitus } from "@/app/lib/api";

export default async function TokoLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const masuk = await adaSesi();
  const { toko } = await ambilSitus();
  const iklan = toko.konversiIklan?.split("/")[0] ?? null;

  return (
    <>
      {iklan && (
        <>
          <script
            dangerouslySetInnerHTML={{
              __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag("consent","default",{ad_personalization:"denied"});gtag("js",new Date());gtag("config",${JSON.stringify(iklan)});`,
            }}
          />
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${iklan}`} strategy="afterInteractive" />
        </>
      )}
      <SiteHeader masuk={masuk} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}
