import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { NextConfig } from "next";

function alamatApi(): string {
  const dariEnv = process.env.API_URL?.trim();
  if (dariEnv) return dariEnv;

  if (process.env.NODE_ENV !== "production") return "http://localhost:8787";

  const isi = readFileSync(join(process.cwd(), "wrangler.jsonc"), "utf8");
  const cocok = isi.match(/"API_URL"\s*:\s*"([^"]+)"/);

  if (!cocok) {
    throw new Error(
      "API_URL tidak ditemukan di wrangler.jsonc. Rewrite /api/* dipanggang saat build, jadi build sengaja digagalkan daripada menghasilkan alamat yang salah.",
    );
  }

  return cocok[1];
}

const ASAL_API = new URL(alamatApi()).origin;
const MODE_DEV = process.env.NODE_ENV !== "production";

const GOOGLE_ADS = {
  script:
    "https://www.googletagmanager.com https://googleads.g.doubleclick.net https://www.googleadservices.com https://www.google.com",
  img: "https://googleads.g.doubleclick.net https://www.google.com https://www.google.co.id",
  frame: "https://bid.g.doubleclick.net https://td.doubleclick.net https://www.googletagmanager.com",
  connect:
    "https://googleads.g.doubleclick.net https://www.google.com https://www.google.co.id https://pagead2.googlesyndication.com https://www.googleadservices.com",
};

const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${MODE_DEV ? " 'unsafe-eval'" : ""} https://challenges.cloudflare.com ${GOOGLE_ADS.script}`,
  `frame-src https://challenges.cloudflare.com ${GOOGLE_ADS.frame}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: https://res.cloudinary.com ${GOOGLE_ADS.img}`,
  "font-src 'self' data:",
  `connect-src 'self' ${GOOGLE_ADS.connect}`,
  "object-src 'none'",
  "base-uri 'self'",
  `form-action 'self' ${ASAL_API}`,
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const nextConfig: NextConfig = {
  images: {
    loader: "custom",
    loaderFile: "./app/lib/image-loader.ts",
    deviceSizes: [384, 640, 828, 1200],
    imageSizes: [96, 128, 256],
    qualities: [75, 92],
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "x-content-type-options", value: "nosniff" },
          { key: "referrer-policy", value: "strict-origin-when-cross-origin" },
          { key: "x-frame-options", value: "DENY" },
          { key: "content-security-policy", value: CSP },
          {
            key: "strict-transport-security",
            value: "max-age=31536000; includeSubDomains",
          },
          {
            key: "permissions-policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
      {
        source: "/admin/:path*",
        headers: [{ key: "x-robots-tag", value: "noindex, nofollow" }],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/",
        has: [{ type: "host", value: "www.menikstore.my.id" }],
        destination: "https://menikstore.my.id/",
        permanent: true,
      },
      {
        source: "/:path+",
        has: [{ type: "host", value: "www.menikstore.my.id" }],
        destination: "https://menikstore.my.id/:path+",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${alamatApi()}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
