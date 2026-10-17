import { env } from "cloudflare:workers";
import { Elysia } from "elysia";

import { METODE_BAYAR, bacaKonfig } from "../lib/doku";

export const paymentRoutes = new Elysia().get("/api/payment-channels", () => {
  const konfig = bacaKonfig(env as unknown as Record<string, unknown>);

  return {
    configured: konfig !== undefined,
    sandbox: konfig?.sandbox ?? true,
    data: METODE_BAYAR.map((m) => ({ code: m.code, name: m.name, group: m.group })),
  };
});
