import { env } from "cloudflare:workers";
import { Elysia, t } from "elysia";

import { buatKoneksi } from "../lib/db";
import { ambilWilayah, cariWilayah } from "../db/wilayah";
import { opsiOngkir } from "../lib/shipping";

function koneksi() {
  return buatKoneksi(env as unknown as Record<string, unknown>);
}

export const shippingRoutes = new Elysia()
  .get(
    "/api/regions",
    async ({ query }) => {
      const kata = (query.q ?? "").trim();
      const batas = query.limit ?? 8;

      if (kata.length < 2) return { data: [] };

      const sql = koneksi();

      try {
        return { data: await cariWilayah(sql, kata, batas) };
      } finally {
        await sql.end();
      }
    },
    {
      query: t.Object({
        q: t.Optional(t.String({ maxLength: 80 })),
        limit: t.Optional(t.Numeric({ minimum: 1, maximum: 30 })),
      }),
    },
  )
  .post(
    "/api/shipping/cost",
    async ({ body, set }) => {
      const sql = koneksi();

      try {
        const tujuan = await ambilWilayah(sql, body.dest_id);

        if (!tujuan) {
          set.status = 404;
          return {
            error: "region_not_found",
            message: "Kecamatan tujuan tidak dikenal",
          };
        }

        return {
          dest_id: tujuan.id,
          weight_g: body.weight_g,
          options: opsiOngkir(tujuan.province, body.weight_g),
        };
      } finally {
        await sql.end();
      }
    },
    {
      body: t.Object({
        dest_id: t.String({ maxLength: 40 }),
        weight_g: t.Integer({ minimum: 1, maximum: 50000 }),
      }),
    },
  );
