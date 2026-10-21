import { env } from "cloudflare:workers";
import { Elysia, t } from "elysia";

import { alamatToko, asalApi } from "../lib/alamat";
import { buatKoneksi, tutup } from "../lib/db";
import { ambilPesanan, buatPesanan, cariPesanan, simpanPembayaran } from "../db/pesanan";
import { periksaKeDoku } from "../db/pelunasan";
import { segarkanLacak } from "../db/lacak";
import { adminDariCookie } from "../db/admin";
import { COOKIE_ADMIN, bacaCookie } from "../lib/sesi";
import { BADAN_PERLU_MASUK, aksesPesanan, untukPublik } from "../lib/privasi-pesanan";
import { penggunaDariCookie } from "../db/akun";
import { JALUR_NOTIFIKASI, bacaKonfig, menitBayar } from "../lib/doku";
import { buatHalamanBayar } from "../lib/payment";
import { umurPesananJam } from "../lib/orders";
import { opsiUntuk } from "../lib/ongkir";
import {
  BADAN_PADAT,
  ambilPembatas,
  blokPembeli,
  ipPembeli,
  kunciIp,
  lolos,
  zonaToko,
} from "../lib/ratelimit";
import { catatPesananBaru, masihBolehPesan } from "../lib/jatah";
import {
  BADAN_CAPTCHA,
  bacaKonfigTurnstile,
  periksaTurnstile,
  turnstileWajib,
} from "../lib/turnstile";

function wadahEnv() {
  return env as unknown as Record<string, string>;
}

export const orderRoutes = new Elysia({ prefix: "/api/orders" })
  .get(
    "/:orderNo",
    async ({ params, set, headers }) => {
      const sql = buatKoneksi(wadahEnv());

      try {
        const pesanan = await cariPesanan(sql, params.orderNo);

        if (!pesanan) {
          set.status = 404;
          return { error: "not_found", message: "Pesanan tidak ditemukan" };
        }

        const olehAdmin = bacaCookie(headers.cookie, COOKIE_ADMIN)
          ? await adminDariCookie(sql, headers.cookie)
          : false;
        const pengguna = olehAdmin ? undefined : await penggunaDariCookie(sql, headers.cookie);
        const akses = olehAdmin ? "penuh" : aksesPesanan(pesanan.user_id, pengguna?.id ?? null);

        if (akses === "tolak") {
          set.status = 401;
          return BADAN_PERLU_MASUK;
        }

        const segar = await segarkanLacak(sql, wadahEnv(), pesanan);

        return { ...untukPublik(segar, akses), dilihat_admin: olehAdmin };
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
    async ({ body, set, request, headers }) => {
      const wadah = wadahEnv();

      const pembatas = ambilPembatas(
        wadah as unknown as Record<string, unknown>,
        "PESANAN_LIMIT",
      );

      if (!(await lolos(pembatas, kunciIp(request, "pesanan", wadah)))) {
        set.status = 429;
        set.headers["retry-after"] = "60";
        return BADAN_PADAT;
      }

      const blok = blokPembeli(request, wadah);
      if (!(await masihBolehPesan(wadah, blok))) {
        set.status = 429;
        set.headers["retry-after"] = "3600";
        return {
          error: "too_many_orders",
          message:
            "Terlalu banyak pesanan dari jaringan ini dalam beberapa jam terakhir. Coba lagi nanti, atau hubungi kami lewat WhatsApp.",
        };
      }

      const turnstile = bacaKonfigTurnstile(wadah);
      if (!turnstile && turnstileWajib(wadah)) {
        console.error("[turnstile] kunci captcha tidak terpasang, checkout ditolak");
        set.status = 503;
        return {
          error: "captcha_unconfigured",
          message: "Checkout sedang gangguan. Untuk sementara, pesan lewat WhatsApp ya.",
        };
      }

      if (turnstile) {
        const ip = ipPembeli(request, zonaToko(wadah));
        if (!(await periksaTurnstile(turnstile.secret, body.turnstile_token, ip))) {
          set.status = 403;
          return BADAN_CAPTCHA;
        }
      }

      const sql = buatKoneksi(wadah);

      try {
        const pengguna = await penggunaDariCookie(sql, headers.cookie);

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
          pengguna?.id ?? null,
        );

        if (!hasil.ok) {
          set.status = hasil.status;
          return hasil.badan;
        }

        await catatPesananBaru(wadah, blok);

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
        turnstile_token: t.Optional(t.String({ maxLength: 4096 })),
      }),
    },
  )
  .post(
    "/:orderNo/pay",
    async ({ params, set, request, headers }) => {
      const wadah = wadahEnv();

      const pembatas = ambilPembatas(
        wadah as unknown as Record<string, unknown>,
        "PESANAN_LIMIT",
      );

      if (!(await lolos(pembatas, kunciIp(request, "bayar", wadah)))) {
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

        const pengguna = await penggunaDariCookie(sql, headers.cookie);

        if (aksesPesanan(pesanan.user_id, pengguna?.id ?? null) === "tolak") {
          set.status = 401;
          return BADAN_PERLU_MASUK;
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

        const asal = asalApi(wadah, request);
        const toko = alamatToko(wadah);

        const item = pesanan.items.map((i) => ({
          sku: i.sku ?? i.slug,
          name: i.name_snapshot,
          price: i.price_snapshot,
          quantity: i.qty,
        }));

        if (pesanan.shipping_cost > 0) {
          item.push({
            sku: "ONGKIR",
            name: `Ongkir ${pesanan.courier} ${pesanan.service}`,
            price: pesanan.shipping_cost,
            quantity: 1,
          });
        }

        const hasil = await buatHalamanBayar(konfig, {
          invoice_number: pesanan.order_no,
          amount: pesanan.total,
          due_minutes: menitBayar(pesanan.expires_at, new Date()),
          customer: {
            name: pesanan.customer_name,
            email: pesanan.email,
            phone: pesanan.phone,
          },
          items: item,
          callback_url: `${toko}/order/${pesanan.order_no}`,
          notification_url: `${asal}${JALUR_NOTIFIKASI}`,
        });

        if (!hasil.ok) {
          set.status = hasil.status === 504 ? 504 : 502;
          return { error: "payment_gateway_error", message: hasil.pesan };
        }

        await simpanPembayaran(sql, pesanan.order_no, {
          reference: hasil.data.token_id,
          url: hasil.data.url,
          channel: "DOKU",
          method: null,
        });

        return {
          checkout_url: hasil.data.url,
          channel: "DOKU",
          reused: false,
        };
      } finally {
        await tutup(sql);
      }
    },
    {
      params: t.Object({ orderNo: t.String({ maxLength: 40 }) }),
      body: t.Optional(t.Object({ method: t.Optional(t.String({ maxLength: 40 })) })),
    },
  )
  .post(
    "/:orderNo/check-payment",
    async ({ params, set }) => {
      const wadah = wadahEnv() as unknown as Record<string, unknown>;
      const pembatas = ambilPembatas(wadah, "PESANAN_LIMIT");

      if (!(await lolos(pembatas, `cek-bayar:${params.orderNo.trim().toUpperCase()}`))) {
        set.status = 429;
        set.headers["retry-after"] = "60";
        return BADAN_PADAT;
      }

      const sql = buatKoneksi(wadahEnv());

      try {
        const sebelum = await ambilPesanan(sql, params.orderNo);

        if (!sebelum) {
          set.status = 404;
          return { error: "not_found", message: "Pesanan tidak ditemukan" };
        }

        const konfig = bacaKonfig(wadah);

        if (
          konfig &&
          sebelum.status === "PENDING" &&
          sebelum.payment_channel === "DOKU" &&
          sebelum.payment_url
        ) {
          await periksaKeDoku(sql, konfig, sebelum.order_no);
        }

        const sesudah = (await cariPesanan(sql, sebelum.order_no)) ?? sebelum;

        return { status: sesudah.status, changed: sesudah.status !== sebelum.status };
      } finally {
        await tutup(sql);
      }
    },
    {
      params: t.Object({ orderNo: t.String({ maxLength: 40 }) }),
    },
  );
