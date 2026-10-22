import { env, waitUntil } from "cloudflare:workers";
import { Elysia } from "elysia";

import { buatKoneksi, tutup, type Sql } from "../lib/db";
import { bacaKonfigEmail, kirimEmail } from "../lib/notifikasi";
import { isiKabarPelunasan, terapkanKabarDoku } from "../db/pelunasan";
import {
  JALUR_NOTIFIKASI,
  bacaKonfig,
  notifikasiSah,
  type KabarDoku,
} from "../lib/doku";

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

    let isi: KabarDoku;

    try {
      isi = JSON.parse(mentah) as KabarDoku;
    } catch {
      set.status = 400;
      return { error: "bad_request" };
    }

    const sql = buatKoneksi(wadah);

    try {
      const idPeristiwa = await catat(
        sql,
        isi.order?.invoice_number ?? null,
        isi.transaction?.status ?? null,
        mentah,
      );

      const hasil = await terapkanKabarDoku(sql, isi);

      const surel = bacaKonfigEmail(wadah);
      const kabar = surel && (await isiKabarPelunasan(sql, hasil, surel.toko));
      if (surel && kabar) waitUntil(kirimEmail(surel, kabar));

      if (hasil.jenis === "kedaluwarsa") {
        await tandaiDiproses(sql, idPeristiwa);
        return { received: true, expired: true };
      }

      if (hasil.jenis === "nominal_beda") {
        set.status = 409;
        return { received: true, error: "amount_mismatch" };
      }

      if (hasil.jenis === "gagal_tandai") {
        return { received: true, applied: false, error: hasil.alasan };
      }

      if (hasil.jenis === "lunas") {
        await tandaiDiproses(sql, idPeristiwa);
        return { received: true, applied: hasil.baru };
      }

      return { received: true, ignored: true };
    } finally {
      await tutup(sql);
    }
  },
  {
    parse: ({ request }) => request.text(),
  },
);
