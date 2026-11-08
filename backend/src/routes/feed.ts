import { env } from "cloudflare:workers";
import { Elysia } from "elysia";

import { barisFeed } from "../db/feed";
import { alamatToko } from "../lib/alamat";
import { namaAwan } from "../lib/cloudinary";
import { buatKoneksi, tutup } from "../lib/db";
import { buatFeedGoogle } from "../lib/feed-google";

export const feedRoutes = new Elysia({ prefix: "/api/feeds" }).get("/google.xml", async () => {
  const wadah = env as unknown as Record<string, unknown>;
  const sql = buatKoneksi(wadah);

  try {
    const xml = buatFeedGoogle(await barisFeed(sql), {
      situs: alamatToko(wadah),
      awan: namaAwan(wadah),
      sekarang: new Date(),
    });

    return new Response(xml, {
      headers: {
        "content-type": "application/xml; charset=utf-8",
        "cache-control": "public, max-age=900",
      },
    });
  } finally {
    await tutup(sql);
  }
});
