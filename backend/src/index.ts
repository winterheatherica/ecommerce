import { env } from "cloudflare:workers";
import { Elysia } from "elysia";
import { CloudflareAdapter } from "elysia/adapter/cloudflare-worker";

import {
  BADAN_PADAT,
  ambilPembatas,
  bebasDariBatas,
  kunciIp,
  lolos,
} from "./lib/ratelimit";

import { productRoutes } from "./routes/products";
import { shippingRoutes } from "./routes/shipping";
import { paymentRoutes } from "./routes/payment";
import { orderRoutes } from "./routes/orders";
import { webhookRoutes } from "./routes/webhooks";
import { adminRoutes } from "./routes/admin";
import { devRoutes } from "./routes/dev";

export default new Elysia({ adapter: CloudflareAdapter })
  .onRequest(async ({ request, set }) => {
    const jalur = new URL(request.url).pathname;

    if (bebasDariBatas(jalur)) return;

    const wadah = env as unknown as Record<string, unknown>;
    const pembatas = ambilPembatas(wadah, "UMUM_LIMIT");

    if (!(await lolos(pembatas, kunciIp(request, "umum")))) {
      set.status = 429;
      set.headers["retry-after"] = "60";
      return BADAN_PADAT;
    }
  })
  .onError(({ code, error, set }) => {
    if (code === "VALIDATION") {
      set.status = 422;
      return {
        error: "validation_failed",
        message: "Data yang dikirim tidak sesuai bentuk yang diharapkan",
      };
    }

    if (code === "NOT_FOUND") {
      set.status = 404;
      return { error: "not_found", message: "Endpoint tidak ditemukan" };
    }

    if (code === "PARSE") {
      set.status = 400;
      return {
        error: "bad_request",
        message: "Isi permintaan tidak bisa dibaca",
      };
    }

    console.error("[api]", code, error instanceof Error ? error.message : error);

    set.status = 500;
    return { error: "internal_error", message: "Terjadi kesalahan di server" };
  })
  .onAfterHandle(({ set }) => {
    set.headers["x-content-type-options"] = "nosniff";
    set.headers["referrer-policy"] = "no-referrer";
  })
  .get("/api/health", () => ({
    status: "ok",
    runtime: "cloudflare-worker",
  }))
  .use(productRoutes)
  .use(shippingRoutes)
  .use(paymentRoutes)
  .use(orderRoutes)
  .use(webhookRoutes)
  .use(adminRoutes)
  .use(devRoutes)
  .compile();
