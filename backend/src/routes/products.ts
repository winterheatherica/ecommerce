import { env } from "cloudflare:workers";
import { Elysia, t } from "elysia";

import { buatKoneksi } from "../lib/db";
import { daftarProduk, satuProduk } from "../db/produk";

const BATAS_BAWAAN = 24;

export const productRoutes = new Elysia({ prefix: "/api/products" })
  .get(
    "/",
    async ({ query }) => {
      const { category, search, featured, limit = BATAS_BAWAAN, offset = 0 } = query;
      const sql = buatKoneksi(env as unknown as Record<string, unknown>);

      try {
        const hasil = await daftarProduk(sql, {
          category,
          featured,
          search,
          limit,
          offset,
        });

        return { ...hasil, limit, offset };
      } finally {
        await sql.end();
      }
    },
    {
      query: t.Object({
        category: t.Optional(t.String({ maxLength: 40 })),
        featured: t.Optional(t.BooleanString()),
        search: t.Optional(t.String({ maxLength: 80 })),
        limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100 })),
        offset: t.Optional(t.Numeric({ minimum: 0 })),
      }),
    },
  )
  .get(
    "/:slug",
    async ({ params, set }) => {
      const sql = buatKoneksi(env as unknown as Record<string, unknown>);

      try {
        const produk = await satuProduk(sql, params.slug);

        if (!produk) {
          set.status = 404;
          return { error: "not_found", message: "Produk tidak ditemukan" };
        }

        return produk;
      } finally {
        await sql.end();
      }
    },
    {
      params: t.Object({
        slug: t.String({ maxLength: 120 }),
      }),
    },
  );
