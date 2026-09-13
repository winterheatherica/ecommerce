import { Elysia, t } from "elysia";

import { regions } from "../data/regions";
import { opsiOngkir } from "../lib/shipping";

export const shippingRoutes = new Elysia()
  .get(
    "/api/regions",
    ({ query }) => {
      const kata = (query.q ?? "").trim().toLowerCase();
      const batas = query.limit ?? 8;

      if (kata.length < 2) return { data: [] };

      return {
        data: regions
          .filter((r) => r.label.toLowerCase().includes(kata))
          .slice(0, batas),
      };
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
    ({ body, set }) => {
      const tujuan = regions.find((r) => r.id === body.dest_id);

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
        options: opsiOngkir(tujuan.id, body.weight_g),
      };
    },
    {
      body: t.Object({
        dest_id: t.String({ maxLength: 40 }),
        weight_g: t.Integer({ minimum: 1, maximum: 50000 }),
      }),
    },
  );
