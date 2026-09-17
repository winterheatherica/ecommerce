import type { MetadataRoute } from "next";

import { bolehDiindeks, tautan } from "@/app/lib/seo";

export default function robots(): MetadataRoute.Robots {
  if (!bolehDiindeks()) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/checkout", "/keranjang", "/order/", "/bayar/"],
    },
    sitemap: tautan("/sitemap.xml"),
    host: tautan("/"),
  };
}
