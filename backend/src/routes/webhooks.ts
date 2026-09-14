import { env } from "cloudflare:workers";
import { Elysia } from "elysia";

import { buatKoneksi, tutup, type Sql } from "../lib/db";
import {
  ambilPesanan,
  gagalkanPembayaran,
  tandaiTerbayar,
} from "../db/pesanan";
import { bacaKonfig, samaAman, tandaTanganCallback } from "../lib/tripay";

type Callback = {
  reference?: string;
  merchant_ref?: string;
  payment_method?: string;
  payment_method_code?: string;
  total_amount?: number;
  status?: string;
  is_closed_payment?: number;
};

async function catat(
  sql: Sql,
  isi: Callback,
  mentah: string,
): Promise<number> {
  const [baris] = await sql<{ id: number }[]>`
    insert into webhook_events (provider, external_id, event_type, payload, processed)
    values (
      'tripay',
      ${isi.merchant_ref ?? null},
      ${isi.status ?? null},
      ${mentah}::jsonb,
      false
    )
    returning id::int as id
  `;

  return baris.id;
}

async function tandaiDiproses(sql: Sql, id: number): Promise<void> {
  await sql`update webhook_events set processed = true where id = ${id}`;
}

export const webhookRoutes = new Elysia().post(
  "/api/webhooks/tripay",
  async ({ body, headers, set }) => {
    const wadah = env as unknown as Record<string, unknown>;
    const konfig = bacaKonfig(wadah);

    if (!konfig) {
      set.status = 503;
      return { error: "payment_unconfigured" };
    }

    const mentah = typeof body === "string" ? body : "";
    const dikirim = headers["x-callback-signature"];
    const diharapkan = await tandaTanganCallback(konfig, mentah);

    if (!dikirim || !samaAman(dikirim, diharapkan)) {
      set.status = 401;
      return { error: "invalid_signature" };
    }

    let isi: Callback;

    try {
      isi = JSON.parse(mentah) as Callback;
    } catch {
      set.status = 400;
      return { error: "bad_request" };
    }

    const sql = buatKoneksi(wadah);

    try {
      const idPeristiwa = await catat(sql, isi, mentah);

      if (!isi.merchant_ref) {
        return { received: true, ignored: true };
      }

      if (isi.status !== "PAID") {
        if (isi.status === "EXPIRED" || isi.status === "FAILED") {
          await gagalkanPembayaran(sql, isi.merchant_ref, "EXPIRED");
          await tandaiDiproses(sql, idPeristiwa);
          return { received: true, expired: true };
        }

        return { received: true, ignored: true };
      }

      const pesanan = await ambilPesanan(sql, isi.merchant_ref);

      if (!pesanan) {
        return { received: true, ignored: true };
      }

      if (isi.total_amount !== pesanan.total) {
        console.error(
          "[tripay] nominal tidak cocok",
          isi.merchant_ref,
          "callback:",
          isi.total_amount,
          "pesanan:",
          pesanan.total,
        );

        set.status = 409;
        return { received: true, error: "amount_mismatch" };
      }

      const hasil = await tandaiTerbayar(
        sql,
        isi.merchant_ref,
        isi.payment_method ?? isi.payment_method_code ?? null,
      );

      if (hasil.ok) await tandaiDiproses(sql, idPeristiwa);

      return { received: true, applied: hasil.ok && !hasil.sudahPernah };
    } finally {
      await tutup(sql);
    }
  },
  {
    parse: ({ request }) => request.text(),
  },
);
