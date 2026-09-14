import { env } from "cloudflare:workers";
import { Elysia } from "elysia";

import { daftarChannel } from "../lib/payment";
import { bacaKonfig } from "../lib/tripay";

export const paymentRoutes = new Elysia().get(
  "/api/payment-channels",
  async ({ set }) => {
    const konfig = bacaKonfig(env as unknown as Record<string, unknown>);

    if (!konfig) {
      set.status = 503;
      return {
        error: "payment_unconfigured",
        message: "Pembayaran belum dikonfigurasi",
      };
    }

    const hasil = await daftarChannel(konfig);

    if (!hasil.ok) {
      set.status = 502;
      return { error: "payment_gateway_error", message: hasil.pesan };
    }

    return {
      data: hasil.data
        .filter((c) => c.active)
        .map((c) => ({
          code: c.code,
          name: c.name,
          group: c.group,
          icon_url: c.icon_url,
          minimum_amount: c.minimum_amount,
          maximum_amount: c.maximum_amount,
        })),
      sandbox: konfig.sandbox,
    };
  },
);
