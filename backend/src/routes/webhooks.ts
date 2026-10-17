import { env } from "cloudflare:workers";
import { Elysia } from "elysia";

import { buatKoneksi, tutup, type Sql } from "../lib/db";
import {
  ambilPesanan,
  gagalkanPembayaran,
  tandaiTerbayar,
} from "../db/pesanan";
import { JALUR_NOTIFIKASI, bacaKonfig, namaMetode, notifikasiSah } from "../lib/doku";

type NotifikasiDoku = {
  order?: { invoice_number?: string; amount?: number | string };
  transaction?: { status?: string; date?: string };
  channel?: { id?: string };
  service?: { id?: string };
};

async function catat(
  sql: Sql,
  nomor: string | null,
  status: string | null,
  mentah: string,
): Promise<number> {
  const [baris] = await sql<{ id: number }[]>`
    insert into webhook_events (provider, external_id, event_type, payload, processed)
    values ('doku', ${nomor}, ${status}, ${sql.json(JSON.parse(mentah))}, false)
    returning id::int as id
  `;

  return baris.id;
}

async function tandaiDiproses(sql: Sql, id: number): Promise<void> {
  await sql`update webhook_events set processed = true where id = ${id}`;
}

export const webhookRoutes = new Elysia().post(
  JALUR_NOTIFIKASI,
  async ({ body, headers, set, request }) => {
    const wadah = env as unknown as Record<string, unknown>;
    const konfig = bacaKonfig(wadah);

    if (!konfig) {
      set.status = 503;
      return { error: "payment_unconfigured" };
    }

    const mentah = typeof body === "string" ? body : "";

    const sah = await notifikasiSah(
      konfig,
      {
        clientId: headers["client-id"],
        requestId: headers["request-id"],
        timestamp: headers["request-timestamp"],
        signature: headers["signature"],
      },
      mentah,
      new URL(request.url).pathname,
    );

    if (!sah) {
      set.status = 401;
      return { error: "invalid_signature" };
    }

    let isi: NotifikasiDoku;

    try {
      isi = JSON.parse(mentah) as NotifikasiDoku;
    } catch {
      set.status = 400;
      return { error: "bad_request" };
    }

    const nomor = isi.order?.invoice_number ?? null;
    const status = isi.transaction?.status ?? null;
    const sql = buatKoneksi(wadah);

    try {
      const idPeristiwa = await catat(sql, nomor, status, mentah);

      if (!nomor) return { received: true, ignored: true };

      if (status === "EXPIRED") {
        await gagalkanPembayaran(sql, nomor, "EXPIRED");
        await tandaiDiproses(sql, idPeristiwa);
        return { received: true, expired: true };
      }

      if (status !== "SUCCESS") return { received: true, ignored: true };

      const pesanan = await ambilPesanan(sql, nomor);

      if (!pesanan) return { received: true, ignored: true };

      if (Number(isi.order?.amount) !== pesanan.total) {
        console.error("[doku] nominal tidak cocok", nomor, {
          notifikasi: isi.order?.amount,
          pesanan: pesanan.total,
        });

        set.status = 409;
        return { received: true, error: "amount_mismatch" };
      }

      const hasil = await tandaiTerbayar(
        sql,
        nomor,
        namaMetode(isi.channel?.id) ?? namaMetode(isi.service?.id) ?? "DOKU",
      );

      if (!hasil.ok) {
        console.error(
          "[doku] uang masuk tapi pesanan tidak bisa ditandai lunas, cek manual",
          nomor,
          hasil.alasan,
        );
        return { received: true, applied: false, error: hasil.alasan };
      }

      await tandaiDiproses(sql, idPeristiwa);
      return { received: true, applied: !hasil.sudahPernah };
    } finally {
      await tutup(sql);
    }
  },
  {
    parse: ({ request }) => request.text(),
  },
);
