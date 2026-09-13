import { env } from "cloudflare:workers";
import { Elysia, t } from "elysia";

import { periksaAdmin } from "../lib/auth";
import { tandaiTerbayar } from "../lib/orders";

export const devRoutes = new Elysia({ prefix: "/api/dev" })
  .onBeforeHandle(({ set }) => {
    const hasil = periksaAdmin(env as unknown as Record<string, unknown>);

    if (!hasil.lolos) {
      set.status = 404;
      return { error: "not_found", message: "Endpoint tidak ditemukan" };
    }
  })
  .post(
    "/pay/:orderNo",
    ({ params, body, set }) => {
      const hasil = tandaiTerbayar(
        params.orderNo,
        body.payment_method ?? "SIMULASI",
      );

      if (!hasil.ok) {
        set.status = hasil.alasan === "not_found" ? 404 : 409;
        return {
          error: hasil.alasan,
          message:
            hasil.alasan === "not_found"
              ? "Pesanan tidak ditemukan"
              : "Pesanan ini tidak sedang menunggu pembayaran",
        };
      }

      return {
        order_no: hasil.pesanan.order_no,
        status: hasil.pesanan.status,
        already_paid: hasil.sudahPernah,
      };
    },
    {
      params: t.Object({ orderNo: t.String({ maxLength: 40 }) }),
      body: t.Object({
        payment_method: t.Optional(t.String({ maxLength: 40 })),
      }),
    },
  );
