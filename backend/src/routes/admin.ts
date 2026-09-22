import { env } from "cloudflare:workers";
import { Elysia, t } from "elysia";

import { periksaAdmin } from "../lib/auth";
import { buatKoneksi, tutup } from "../lib/db";
import { periksaPerubahan, periksaProdukBaru } from "../lib/products";
import {
  daftarProdukAdmin,
  perbaruiProduk,
  satuProdukAdmin,
  simpanProdukBaru,
} from "../db/produk";
import {
  batalkanPesanan,
  daftarPesanan,
  sapuKedaluwarsa,
  tandaiDikirim,
  tandaiSelesai,
  tandaiTerbayar,
  type HasilUbahStatus,
} from "../db/pesanan";
import type { StatusPesanan } from "../lib/orders";

const STATUS = [
  "PENDING",
  "PAID",
  "SHIPPED",
  "DELIVERED",
  "EXPIRED",
  "CANCELLED",
] as const;

function galatUbah(
  hasil: Extract<HasilUbahStatus, { ok: false }>,
  syarat: string,
) {
  if (hasil.alasan === "not_found") {
    return {
      status: 404,
      badan: { error: "not_found", message: "Pesanan tidak ditemukan" },
    };
  }

  return {
    status: 409,
    badan: {
      error: "invalid_status",
      message: `${syarat} (sekarang ${hasil.status})`,
    },
  };
}

function koneksi() {
  return buatKoneksi(env as unknown as Record<string, unknown>);
}

export const adminRoutes = new Elysia({ prefix: "/api/admin" })
  .onBeforeHandle(({ set, headers }) => {
    const hasil = periksaAdmin(
      env as unknown as Record<string, unknown>,
      headers.authorization,
    );

    if (!hasil.lolos) {
      set.status = hasil.status;
      return hasil.badan;
    }
  })
  .get(
    "/orders",
    async ({ query }) => {
      const { status, limit = 50, offset = 0 } = query;
      const sql = koneksi();

      try {
        return await daftarPesanan(sql, {
          status: status as StatusPesanan | undefined,
          limit,
          offset,
        });
      } finally {
        await tutup(sql);
      }
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
    async ({ params, body, set }) => {
      const sql = koneksi();

      try {
        const hasil = await tandaiDikirim(sql, params.orderNo, body.tracking_number);

        if (!hasil.ok) {
          const g = galatUbah(
            hasil,
            "Hanya pesanan berstatus PAID yang bisa dikirim",
          );
          set.status = g.status;
          return g.badan;
        }

        return hasil.pesanan;
      } finally {
        await tutup(sql);
      }
    },
    {
      params: t.Object({ orderNo: t.String({ maxLength: 40 }) }),
      body: t.Object({
        tracking_number: t.String({ minLength: 4, maxLength: 60 }),
      }),
    },
  )
  .patch(
    "/orders/:orderNo/deliver",
    async ({ params, set }) => {
      const sql = koneksi();

      try {
        const hasil = await tandaiSelesai(sql, params.orderNo);

        if (!hasil.ok) {
          const g = galatUbah(
            hasil,
            "Hanya pesanan berstatus SHIPPED yang bisa diselesaikan",
          );
          set.status = g.status;
          return g.badan;
        }

        return hasil.pesanan;
      } finally {
        await tutup(sql);
      }
    },
    { params: t.Object({ orderNo: t.String({ maxLength: 40 }) }) },
  )
  .patch(
    "/orders/:orderNo/cancel",
    async ({ params, set }) => {
      const sql = koneksi();

      try {
        const hasil = await batalkanPesanan(sql, params.orderNo);

        if (!hasil.ok) {
          const g = galatUbah(
            hasil,
            "Hanya pesanan yang belum dibayar yang bisa dibatalkan di sini",
          );
          set.status = g.status;
          return g.badan;
        }

        return hasil.pesanan;
      } finally {
        await tutup(sql);
      }
    },
    { params: t.Object({ orderNo: t.String({ maxLength: 40 }) }) },
  )
  .patch(
    "/orders/:orderNo/pay",
    async ({ params, body, set }) => {
      const sql = koneksi();

      try {
        const hasil = await tandaiTerbayar(sql, params.orderNo, body.method);

        if (!hasil.ok) {
          set.status = hasil.alasan === "not_found" ? 404 : 409;
          return {
            error: hasil.alasan,
            message:
              hasil.alasan === "not_found"
                ? "Pesanan tidak ditemukan"
                : "Hanya pesanan yang belum dibayar yang bisa ditandai lunas",
          };
        }

        return hasil.pesanan;
      } finally {
        await tutup(sql);
      }
    },
    {
      params: t.Object({ orderNo: t.String({ maxLength: 40 }) }),
      body: t.Object({ method: t.String({ minLength: 2, maxLength: 40 }) }),
    },
  )
  .post("/orders/sweep", async () => {
    const sql = koneksi();

    try {
      const disapu = await sapuKedaluwarsa(sql);

      return {
        swept: disapu.length,
        order_nos: disapu,
      };
    } finally {
      await tutup(sql);
    }
  })
  .get(
    "/products",
    async ({ query }) => {
      const sql = koneksi();

      try {
        return await daftarProdukAdmin(sql, query.limit ?? 100, query.offset ?? 0);
      } finally {
        await tutup(sql);
      }
    },
    {
      query: t.Object({
        limit: t.Optional(t.Numeric({ minimum: 1, maximum: 200 })),
        offset: t.Optional(t.Numeric({ minimum: 0 })),
      }),
    },
  )
  .get(
    "/products/:slug",
    async ({ params, set }) => {
      const sql = koneksi();

      try {
        const produk = await satuProdukAdmin(sql, params.slug);

        if (!produk) {
          set.status = 404;
          return { error: "not_found", message: "Produk tidak ditemukan" };
        }

        return produk;
      } finally {
        await tutup(sql);
      }
    },
    { params: t.Object({ slug: t.String({ maxLength: 120 }) }) },
  )
  .post(
    "/products",
    async ({ body, set }) => {
      const periksa = periksaProdukBaru(body);

      if (!periksa.ok) {
        set.status = periksa.status;
        return periksa.badan;
      }

      const sql = koneksi();

      try {
        const hasil = await simpanProdukBaru(sql, periksa.bersih);

        if (!hasil.ok) {
          set.status = 409;
          return {
            error: "slug_taken",
            message: `Slug "${periksa.bersih.slug}" sudah dipakai produk lain`,
            field: "slug",
          };
        }

        set.status = 201;
        return hasil.produk;
      } finally {
        await tutup(sql);
      }
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
    async ({ params, body, set }) => {
      const periksa = periksaPerubahan(body);

      if (!periksa.ok) {
        set.status = periksa.status;
        return periksa.badan;
      }

      const sql = koneksi();

      try {
        const produk = await perbaruiProduk(sql, params.slug, periksa.bersih);

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
