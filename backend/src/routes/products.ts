import { Elysia, t } from "elysia";

import { products } from "../data/products";

const BATAS_BAWAAN = 24;

export const productRoutes = new Elysia({ prefix: "/api/products" })
  .get(
    "/",
    ({ query }) => {
      const { category, search, featured, limit = BATAS_BAWAAN, offset = 0 } = query;

      let hasil = products.filter((p) => p.is_active);

      if (category) {
        hasil = hasil.filter((p) => p.category === category);
      }

      if (featured) {
        hasil = hasil.filter((p) => p.is_featured);
      }

      if (search) {
        const kata = search.trim().toLowerCase();
        hasil = hasil.filter((p) => p.name.toLowerCase().includes(kata));
      }

      hasil = hasil.sort((a, b) => a.sort_order - b.sort_order);

      return {
        data: hasil.slice(offset, offset + limit),
        total: hasil.length,
        limit,
        offset,
      };
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
    ({ params, set }) => {
      const produk = products.find(
        (p) => p.slug === params.slug && p.is_active,
      );

      if (!produk) {
        set.status = 404;
        return { error: "not_found", message: "Produk tidak ditemukan" };
      }

      return produk;
    },
    {
      params: t.Object({
        slug: t.String({ maxLength: 120 }),
      }),
    },
  );
