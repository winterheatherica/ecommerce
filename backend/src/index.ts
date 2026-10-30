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

import { buatKoneksi, tutup } from "./lib/db";
import { bacaKonfig } from "./lib/doku";
import { bacaKonfigTurnstile } from "./lib/turnstile";
import { sapuKedaluwarsa } from "./db/pesanan";
import { isiKabarPelunasan, periksaTertundaKeDoku } from "./db/pelunasan";
import { bacaKonfigEmail, kirimEmail } from "./lib/notifikasi";
import { sapuSesi } from "./db/akun";
import { sapuSesiAdmin } from "./db/admin";
import { sapuPeristiwaWebhook } from "./db/webhook";
import { lacakTerjadwal, pelacak, selesaikanOtomatis } from "./db/lacak";
import { pakaiJatahLacak } from "./lib/jatah";

import { productRoutes } from "./routes/products";
import { shippingRoutes } from "./routes/shipping";
import { paymentRoutes } from "./routes/payment";
import { orderRoutes } from "./routes/orders";
import { webhookRoutes } from "./routes/webhooks";
import { adminRoutes } from "./routes/admin";
import { devRoutes } from "./routes/dev";
import { akunRoutes } from "./routes/akun";
import { adminMasukRoutes } from "./routes/admin-masuk";
import { situsRoutes } from "./routes/situs";

const app = new Elysia({ adapter: CloudflareAdapter })
  .onRequest(async ({ request, set }) => {
    const jalur = new URL(request.url).pathname;

    if (bebasDariBatas(jalur)) return;

    const wadah = env as unknown as Record<string, unknown>;
    const pembatas = ambilPembatas(wadah, "UMUM_LIMIT");

    if (!(await lolos(pembatas, kunciIp(request, "umum", wadah)))) {
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
    set.headers["strict-transport-security"] = "max-age=31536000; includeSubDomains";
  })
  .get("/api/health", () => ({
    status: "ok",
    runtime: "cloudflare-worker",
  }))
  .get("/api/captcha", () => ({
    turnstile_site_key:
      bacaKonfigTurnstile(env as unknown as Record<string, unknown>)?.siteKey ?? null,
  }))
  .use(productRoutes)
  .use(situsRoutes)
  .use(shippingRoutes)
  .use(paymentRoutes)
  .use(orderRoutes)
  .use(webhookRoutes)
  .use(adminRoutes)
  .use(devRoutes)
  .use(akunRoutes)
  .use(adminMasukRoutes)
  .compile();

async function sapuTerjadwal(): Promise<void> {
  const wadah = env as unknown as Record<string, unknown>;
  const sql = buatKoneksi(wadah);
  const konfig = bacaKonfig(wadah);

  if (konfig) {
    try {
      const semua = await periksaTertundaKeDoku(sql, konfig);
      const berubah = semua.filter((h) => h.jenis === "lunas" || h.jenis === "kedaluwarsa");

      if (berubah.length > 0) console.log("[cron] status dari DOKU diterapkan", berubah);

      const surel = bacaKonfigEmail(wadah);

      if (surel) {
        for (const hasil of semua) {
          const kabar = await isiKabarPelunasan(sql, hasil, surel.toko);
          if (kabar) await kirimEmail(surel, kabar);
        }
      }
    } catch (e) {
      console.error("[cron] gagal mencocokkan pembayaran dengan DOKU", e);
    }
  }

  try {
    const disapu = await sapuKedaluwarsa(sql);

    if (disapu.length > 0) {
      console.log("[cron] pesanan kedaluwarsa disapu", disapu.length, disapu);
    }
  } catch (e) {
    console.error("[cron] gagal menyapu pesanan kedaluwarsa", e);
  }

  const lacak = pelacak(wadah);

  if (lacak) {
    try {
      const hasil = await lacakTerjadwal(sql, lacak, () => pakaiJatahLacak(wadah));
      if (hasil.diperbarui + hasil.gagal + hasil.dibatasi > 0) console.log("[cron] lacak resi", hasil);
    } catch (e) {
      console.error("[cron] gagal melacak resi", e);
    }
  }

  try {
    const selesai = await selesaikanOtomatis(sql);
    if (selesai.length > 0) console.log("[cron] pesanan otomatis selesai", selesai);
  } catch (e) {
    console.error("[cron] gagal menyelesaikan pesanan otomatis", e);
  }

  try {
    const peristiwa = await sapuPeristiwaWebhook(sql);
    if (peristiwa > 0) console.log("[cron] catatan webhook lama dihapus", peristiwa);
  } catch (e) {
    console.error("[cron] gagal menghapus catatan webhook lama", e);
  }

  try {
    const sesi = await sapuSesi(sql);
    if (sesi > 0) console.log("[cron] sesi kedaluwarsa dihapus", sesi);

    const sesiAdmin = await sapuSesiAdmin(sql);
    if (sesiAdmin > 0) console.log("[cron] sesi admin kedaluwarsa dihapus", sesiAdmin);
  } catch (e) {
    console.error("[cron] gagal menyapu sesi", e);
  } finally {
    await tutup(sql);
  }
}

export default {
  fetch: (request: Request) => app.fetch(request),
  scheduled(
    _jadwal: ScheduledController,
    _wadah: unknown,
    ctx: ExecutionContext,
  ) {
    ctx.waitUntil(sapuTerjadwal());
  },
};
