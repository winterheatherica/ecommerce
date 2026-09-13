import { env } from "cloudflare:workers";
import { Elysia, t } from "elysia";

import { buatKoneksi, tutup } from "../lib/db";
import { buatPesanan, cariPesanan } from "../db/pesanan";

export const orderRoutes = new Elysia({ prefix: "/api/orders" })
  .get(
    "/:orderNo",
    async ({ params, set }) => {
      const sql = buatKoneksi(env as unknown as Record<string, unknown>);

      try {
        const pesanan = await cariPesanan(sql, params.orderNo);

        if (!pesanan) {
          set.status = 404;
          return { error: "not_found", message: "Pesanan tidak ditemukan" };
        }

        return pesanan;
      } finally {
        await tutup(sql);
      }
    },
    {
      params: t.Object({ orderNo: t.String({ maxLength: 40 }) }),
    },
  )
  .post(
    "/",
    async ({ body, set }) => {
      const wadah = env as unknown as Record<string, string>;
      const storefront = wadah.STOREFRONT_URL ?? "http://localhost:3000";
      const sql = buatKoneksi(wadah);

      try {
        const hasil = await buatPesanan(sql, body, storefront);

        if (!hasil.ok) {
          set.status = hasil.status;
          return hasil.badan;
        }

        set.status = 201;
        return {
          order_no: hasil.pesanan.order_no,
          status: hasil.pesanan.status,
          total: hasil.pesanan.total,
          invoice_url: hasil.pesanan.xendit_invoice_url,
          expires_at: hasil.pesanan.expires_at,
        };
      } finally {
        await tutup(sql);
      }
    },
    {
      body: t.Object({
        customer_name: t.String({ minLength: 3, maxLength: 120 }),
        phone: t.String({ minLength: 9, maxLength: 20 }),
        email: t.Optional(t.String({ maxLength: 160 })),
        address: t.String({ minLength: 10, maxLength: 400 }),
        notes: t.Optional(t.String({ maxLength: 300 })),
        dest_id: t.String({ maxLength: 40 }),
        courier: t.String({ maxLength: 40 }),
        service: t.String({ maxLength: 40 }),
        items: t.Array(
          t.Object({
            slug: t.String({ maxLength: 120 }),
            qty: t.Integer({ minimum: 1, maximum: 99 }),
          }),
          { minItems: 1, maxItems: 30 },
        ),
      }),
    },
  );
