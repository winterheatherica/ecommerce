import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  if (process.env.SIAP_DIINDEKS !== "true") {
    return {
      rules: { userAgent: "*", disallow: "/" },
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/checkout", "/keranjang", "/order/", "/bayar/"],
    },
  };
}
