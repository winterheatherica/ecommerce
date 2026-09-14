import { env } from "cloudflare:workers";
import { Elysia, t } from "elysia";

import { buatKoneksi, tutup } from "../lib/db";
import { buatPesanan, cariPesanan, simpanPembayaran } from "../db/pesanan";
import { buatTransaksi } from "../lib/payment";
import { umurPesananJam } from "../lib/orders";
import { opsiUntuk } from "../lib/ongkir";
import { bacaKonfig } from "../lib/tripay";
import {
  BADAN_PADAT,
  ambilPembatas,
  kunciIp,
  lolos,
} from "../lib/ratelimit";

function wadahEnv() {
  return env as unknown as Record<string, string>;
}

export const orderRoutes = new Elysia({ prefix: "/api/orders" })
  .get(
    "/:orderNo",
    async ({ params, set }) => {
      const sql = buatKoneksi(wadahEnv());

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
    async ({ body, set, request }) => {
      const wadah = wadahEnv();

      const pembatas = ambilPembatas(
        wadah as unknown as Record<string, unknown>,
        "PESANAN_LIMIT",
      );

      if (!(await lolos(pembatas, kunciIp(request, "pesanan")))) {
        set.status = 429;
        set.headers["retry-after"] = "60";
        return BADAN_PADAT;
      }

      const sql = buatKoneksi(wadah);

      try {
        const hasil = await buatPesanan(
          sql,
          body,
          umurPesananJam(wadah as unknown as Record<string, unknown>),
          async (destId, weightG) => {
            const opsi = await opsiUntuk(
              sql,
              wadah as unknown as Record<string, unknown>,
              destId,
              weightG,
            );
            return opsi.ok ? opsi.opsi : null;
          },
        );

        if (!hasil.ok) {
          set.status = hasil.status;
          return hasil.badan;
        }

        set.status = 201;
        return {
          order_no: hasil.pesanan.order_no,
          status: hasil.pesanan.status,
          total: hasil.pesanan.total,
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
        email: t.String({ minLength: 5, maxLength: 160 }),
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
  )
  .post(
    "/:orderNo/pay",
    async ({ params, body, set, request }) => {
      const wadah = wadahEnv();

      const pembatas = ambilPembatas(
        wadah as unknown as Record<string, unknown>,
        "PESANAN_LIMIT",
      );

      if (!(await lolos(pembatas, kunciIp(request, "bayar")))) {
        set.status = 429;
        set.headers["retry-after"] = "60";
        return BADAN_PADAT;
      }

      const konfig = bacaKonfig(wadah as unknown as Record<string, unknown>);

      if (!konfig) {
        set.status = 503;
        return {
          error: "payment_unconfigured",
          message: "Pembayaran belum dikonfigurasi",
        };
      }

      const sql = buatKoneksi(wadah);

      try {
        const pesanan = await cariPesanan(sql, params.orderNo);

        if (!pesanan) {
          set.status = 404;
          return { error: "not_found", message: "Pesanan tidak ditemukan" };
        }

        if (pesanan.status !== "PENDING") {
          set.status = 409;
          return {
            error: "invalid_status",
            message: `Pesanan ini tidak sedang menunggu pembayaran (${pesanan.status})`,
          };
        }

        if (pesanan.payment_url) {
          return {
            checkout_url: pesanan.payment_url,
            channel: pesanan.payment_channel,
            reused: true,
          };
        }

        const asal = new URL(request.url).origin;
        const toko = wadah.STOREFRONT_URL ?? "http://localhost:3000";

        const item = pesanan.items.map((i) => ({
          sku: i.slug,
          name: i.name_snapshot,
          price: i.price_snapshot,
          quantity: i.qty,
        }));

        if (pesanan.shipping_cost > 0) {
          item.push({
            sku: "ongkir",
            name: `Ongkir ${pesanan.courier} ${pesanan.service}`,
            price: pesanan.shipping_cost,
            quantity: 1,
          });
        }

        const hasil = await buatTransaksi(konfig, {
          order_no: pesanan.order_no,
          method: body.method,
          amount: pesanan.total,
          customer_name: pesanan.customer_name,
          customer_email: pesanan.email ?? "",
          customer_phone: pesanan.phone,
          expires_at: pesanan.expires_at ?? new Date().toISOString(),
          items: item,
          callback_url: `${asal}/api/webhooks/tripay`,
          return_url: `${toko}/order/${pesanan.order_no}`,
        });

        if (!hasil.ok) {
          set.status = hasil.status === 502 ? 502 : 422;
          return { error: "payment_gateway_error", message: hasil.pesan };
        }

        await simpanPembayaran(sql, pesanan.order_no, {
          reference: hasil.data.reference,
          url: hasil.data.checkout_url,
          channel: body.method,
          method: hasil.data.payment_name,
        });

        return {
          checkout_url: hasil.data.checkout_url,
          channel: body.method,
          reused: false,
        };
      } finally {
        await tutup(sql);
      }
    },
    {
      params: t.Object({ orderNo: t.String({ maxLength: 40 }) }),
      body: t.Object({ method: t.String({ minLength: 2, maxLength: 40 }) }),
    },
  );
