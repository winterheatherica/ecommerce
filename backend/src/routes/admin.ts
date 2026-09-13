import { env } from "cloudflare:workers";
import { Elysia, t } from "elysia";

import { products } from "../data/products";
import { orderItems, orders, type Order } from "../data/orders";
import { periksaAdmin } from "../lib/auth";
import { buatProduk, ubahProduk } from "../lib/products";
import { sapuKedaluwarsa } from "../lib/orders";

const STATUS = [
  "PENDING",
  "PAID",
  "SHIPPED",
  "DELIVERED",
  "EXPIRED",
  "CANCELLED",
] as const;

function lengkapi(o: Order) {
  return {
    ...o,
    items: orderItems
      .filter((i) => i.order_id === o.id)
      .map(({ order_id: _abaikan, ...sisa }) => sisa),
  };
}

export const adminRoutes = new Elysia({ prefix: "/api/admin" })
  .onBeforeHandle(({ set }) => {
    const hasil = periksaAdmin(env as unknown as Record<string, unknown>);

    if (!hasil.lolos) {
      set.status = hasil.status;
      return hasil.badan;
    }
  })
  .get(
    "/orders",
    ({ query }) => {
      const { status, limit = 50, offset = 0 } = query;

      sapuKedaluwarsa();

      let hasil = [...orders];
      if (status) hasil = hasil.filter((o) => o.status === status);

      hasil.sort((a, b) => b.created_at.localeCompare(a.created_at));

      return {
        data: hasil.slice(offset, offset + limit).map(lengkapi),
        total: hasil.length,
      };
    },
    {
      query: t.Object({
        status: t.Optional(t.Union(STATUS.map((s) => t.Literal(s)))),
        limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100 })),
        offset: t.Optional(t.Numeric({ minimum: 0 })),
      }),
    },
  )
  .patch(
    "/orders/:orderNo/ship",
    ({ params, body, set }) => {
      const cari = params.orderNo.trim().toUpperCase();
      const pesanan = orders.find((o) => o.order_no.toUpperCase() === cari);

      if (!pesanan) {
        set.status = 404;
        return { error: "not_found", message: "Pesanan tidak ditemukan" };
      }

      if (pesanan.status !== "PAID") {
        set.status = 409;
        return {
          error: "invalid_status",
          message: `Hanya pesanan berstatus PAID yang bisa dikirim (sekarang ${pesanan.status})`,
        };
      }

      pesanan.tracking_number = body.tracking_number.trim();
      pesanan.status = "SHIPPED";
      pesanan.shipped_at = new Date().toISOString();

      return lengkapi(pesanan);
    },
    {
      params: t.Object({ orderNo: t.String({ maxLength: 40 }) }),
      body: t.Object({
        tracking_number: t.String({ minLength: 4, maxLength: 60 }),
      }),
    },
  )
  .post("/orders/sweep", () => {
    const disapu = sapuKedaluwarsa();

    return {
      swept: disapu.length,
      order_nos: disapu,
    };
  })
  .get(
    "/products",
    () => ({
      data: [...products].sort((a, b) => a.sort_order - b.sort_order),
      total: products.length,
    }),
  )
  .get(
    "/products/:slug",
    ({ params, set }) => {
      const produk = products.find((p) => p.slug === params.slug);

      if (!produk) {
        set.status = 404;
        return { error: "not_found", message: "Produk tidak ditemukan" };
      }

      return produk;
    },
    { params: t.Object({ slug: t.String({ maxLength: 120 }) }) },
  )
  .post(
    "/products",
    ({ body, set }) => {
      const hasil = buatProduk(body);

      if (!hasil.ok) {
        set.status = hasil.status;
        return hasil.badan;
      }

      set.status = 201;
      return hasil.produk;
    },
    {
      body: t.Object({
        slug: t.String({ minLength: 1, maxLength: 120 }),
        name: t.String({ minLength: 3, maxLength: 200 }),
        description: t.Optional(t.String({ maxLength: 2000 })),
        price: t.Integer({ minimum: 1, maximum: 100000000 }),
        weight_g: t.Integer({ minimum: 1, maximum: 50000 }),
        stock: t.Optional(t.Integer({ minimum: 0, maximum: 100000 })),
        category: t.String({ maxLength: 40 }),
        is_featured: t.Optional(t.Boolean()),
        sold_per_month: t.Optional(t.Integer({ minimum: 0, maximum: 100000 })),
        sort_order: t.Optional(t.Integer({ minimum: 0, maximum: 10000 })),
        is_active: t.Optional(t.Boolean()),
      }),
    },
  )
  .patch(
    "/products/:slug",
    ({ params, body, set }) => {
      const hasil = ubahProduk(params.slug, body);

      if (!hasil.ok) {
        set.status = hasil.status;
        return hasil.badan;
      }

      return hasil.produk;
    },
    {
      params: t.Object({ slug: t.String({ maxLength: 120 }) }),
      body: t.Object({
        name: t.Optional(t.String({ minLength: 3, maxLength: 200 })),
        description: t.Optional(t.String({ maxLength: 2000 })),
        price: t.Optional(t.Integer({ minimum: 1, maximum: 100000000 })),
        weight_g: t.Optional(t.Integer({ minimum: 1, maximum: 50000 })),
        stock: t.Optional(t.Integer({ minimum: 0, maximum: 100000 })),
        category: t.Optional(t.String({ maxLength: 40 })),
        is_featured: t.Optional(t.Boolean()),
        sold_per_month: t.Optional(t.Integer({ minimum: 0, maximum: 100000 })),
        sort_order: t.Optional(t.Integer({ minimum: 0, maximum: 10000 })),
        is_active: t.Optional(t.Boolean()),
      }),
    },
  );
