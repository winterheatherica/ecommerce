import { env } from "cloudflare:workers";
import { Elysia } from "elysia";

import { bannerPublik } from "../lib/banner";
import { namaAwan } from "../lib/cloudinary";
import { buatKoneksi, tutup } from "../lib/db";
import { ambilSitus } from "../db/situs";

export const situsRoutes = new Elysia({ prefix: "/api" }).get("/site", async () => {
  const wadah = env as unknown as Record<string, unknown>;
  const sql = buatKoneksi(wadah);

  try {
    const situs = await ambilSitus(sql);
    return { ...situs, banners: bannerPublik(namaAwan(wadah), situs.banners) };
  } finally {
    await tutup(sql);
  }
});
