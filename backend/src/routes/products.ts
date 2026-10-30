import { env } from "cloudflare:workers";
import { Elysia, t } from "elysia";

import { buatKoneksi, tutup } from "../lib/db";
import { namaAwan, produkDenganUrl } from "../lib/cloudinary";
import { daftarProduk, satuProduk } from "../db/produk";
import { ULASAN_PER_HALAMAN, URUTAN_ULASAN, halamanUlasan } from "../db/ulasan";

export const QUERY_ULASAN = t.Object({
  offset: t.Optional(t.Numeric({ minimum: 0, maximum: 100000 })),
  limit: t.Optional(t.Numeric({ minimum: 1, maximum: ULASAN_PER_HALAMAN })),
  urut: t.Optional(t.Union(URUTAN_ULASAN.map((u) => t.Literal(u)))),
  bintang: t.Optional(t.Numeric({ minimum: 1, maximum: 5, multipleOf: 1 })),
  sumber: t.Optional(t.Union([t.Literal("shopee"), t.Literal("tokopedia"), t.Literal("web")])),
  ukuran: t.Optional(t.String({ minLength: 1, maxLength: 120 })),
});

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

        const awan = namaAwan(env as unknown as Record<string, unknown>);

        return { ...hasil, data: hasil.data.map((p) => produkDenganUrl(awan, p)), limit, offset };
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

        return produkDenganUrl(namaAwan(env as unknown as Record<string, unknown>), produk);
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
        const hasil = await halamanUlasan(sql, params.slug, {
          offset: query.offset ?? 0,
          limit: query.limit ?? ULASAN_PER_HALAMAN,
          admin: false,
          urut: query.urut,
          bintang: query.bintang,
          sumber: query.sumber,
          ukuran: query.ukuran,
        });

        return {
          data: hasil.data.map(({ is_hidden: _abaikan, ...sisa }) => sisa),
          total: hasil.total,
        };
      } finally {
        await tutup(sql);
      }
    },
    {
      params: t.Object({
        slug: t.String({ maxLength: 120 }),
      }),
      query: QUERY_ULASAN,
    },
  );
