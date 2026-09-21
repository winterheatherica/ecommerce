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

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://assets.tripay.co.id https://res.cloudinary.com",
  "font-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
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
      { protocol: "https", hostname: "assets.tripay.co.id", pathname: "/**" },
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
