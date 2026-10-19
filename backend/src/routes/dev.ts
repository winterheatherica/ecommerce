import { env } from "cloudflare:workers";
import { Elysia, t } from "elysia";

import { bypassAdmin } from "../lib/auth";
import { adminDariCookie } from "../db/admin";
import { buatKoneksi, tutup } from "../lib/db";
import { tandaiTerbayar } from "../db/pesanan";

export const devRoutes = new Elysia({ prefix: "/api/dev" })
  .onBeforeHandle(async ({ set, headers }) => {
    const wadah = env as unknown as Record<string, unknown>;
    if (bypassAdmin(wadah)) return;

    const sql = buatKoneksi(wadah);

    try {
      if (await adminDariCookie(sql, headers.cookie)) return;
    } finally {
      await tutup(sql);
    }

    set.status = 404;
    return { error: "not_found", message: "Endpoint tidak ditemukan" };
  })
  .post(
    "/pay/:orderNo",
    async ({ params, body, set }) => {
      const sql = buatKoneksi(env as unknown as Record<string, unknown>);

      try {
        const hasil = await tandaiTerbayar(
          sql,
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
      } finally {
        await tutup(sql);
      }
    },
    {
      params: t.Object({ orderNo: t.String({ maxLength: 40 }) }),
      body: t.Object({
        payment_method: t.Optional(t.String({ maxLength: 40 })),
      }),
    },
  );
