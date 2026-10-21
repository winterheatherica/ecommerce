import { env } from "cloudflare:workers";
import { Elysia, t } from "elysia";

import { buatKoneksi, tutup } from "../lib/db";
import { daftarProduk, satuProduk } from "../db/produk";
import { ULASAN_PER_HALAMAN, halamanUlasan } from "../db/ulasan";

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
        await tutup(sql);
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
        await tutup(sql);
      }
    },
    {
      params: t.Object({
        slug: t.String({ maxLength: 120 }),
      }),
    },
  )
  .get(
    "/:slug/reviews",
    async ({ params, query }) => {
      const sql = buatKoneksi(env as unknown as Record<string, unknown>);

      try {
        const baris = await halamanUlasan(sql, params.slug, {
          offset: query.offset ?? 0,
          limit: query.limit ?? ULASAN_PER_HALAMAN,
          admin: false,
        });

        return { data: baris.map(({ is_hidden: _abaikan, ...sisa }) => sisa) };
      } finally {
        await tutup(sql);
      }
    },
    {
      params: t.Object({
        slug: t.String({ maxLength: 120 }),
      }),
      query: t.Object({
        offset: t.Optional(t.Numeric({ minimum: 0, maximum: 100000 })),
        limit: t.Optional(t.Numeric({ minimum: 1, maximum: ULASAN_PER_HALAMAN })),
      }),
    },
  );
