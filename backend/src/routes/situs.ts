import { env } from "cloudflare:workers";
import { Elysia } from "elysia";

import { buatKoneksi, tutup } from "../lib/db";
import { ambilSitus } from "../db/situs";

export const situsRoutes = new Elysia({ prefix: "/api" }).get("/site", async () => {
  const sql = buatKoneksi(env as unknown as Record<string, unknown>);

  try {
    return await ambilSitus(sql);
  } finally {
    await tutup(sql);
  }
});
