import { env } from "cloudflare:workers";
import { Elysia, t } from "elysia";

import { buatKoneksi, tutup, type Sql } from "../lib/db";
import { tandaiTerbayar } from "../db/pesanan";

type Peristiwa = {
  external_id: string | null;
  status: string | null;
  payload: unknown;
};

async function catat(sql: Sql, p: Peristiwa): Promise<number> {
  const [baris] = await sql<{ id: number }[]>`
    insert into webhook_events (provider, external_id, event_type, payload, processed)
    values ('xendit', ${p.external_id}, ${p.status}, ${JSON.stringify(p.payload)}::jsonb, false)
    returning id::int as id
  `;

  return baris.id;
}

async function tandaiDiproses(sql: Sql, id: number): Promise<void> {
  await sql`update webhook_events set processed = true where id = ${id}`;
}

function samaAman(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  let beda = 0;
  for (let i = 0; i < a.length; i++) {
    beda |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return beda === 0;
}

export const webhookRoutes = new Elysia().post(
  "/api/webhooks/xendit",
  async ({ body, headers, set }) => {
    const wadah = env as unknown as Record<string, string>;
    const token = headers["x-callback-token"];
    const diharapkan = wadah.XENDIT_CALLBACK_TOKEN;

    if (!diharapkan || !token || !samaAman(token, diharapkan)) {
      set.status = 401;
      return { error: "unauthorized", message: "Token callback tidak cocok" };
    }

    const sql = buatKoneksi(wadah);

    const peristiwa: Peristiwa = {
      external_id: body.external_id ?? null,
      status: body.status ?? null,
      payload: body,
    };

    try {
      const idPeristiwa = await catat(sql, peristiwa);

      if (body.status !== "PAID" || !body.external_id) {
        return { received: true, ignored: true };
      }

      const hasil = await tandaiTerbayar(
        sql,
        body.external_id,
        body.payment_method ?? null,
      );

      if (hasil.ok) await tandaiDiproses(sql, idPeristiwa);

      return { received: true, applied: hasil.ok && !hasil.sudahPernah };
    } finally {
      await tutup(sql);
    }
  },
  {
    headers: t.Object({
      "x-callback-token": t.Optional(t.String({ maxLength: 200 })),
    }),
    body: t.Object({
      external_id: t.Optional(t.String({ maxLength: 80 })),
      status: t.Optional(t.String({ maxLength: 40 })),
      payment_method: t.Optional(t.String({ maxLength: 40 })),
      amount: t.Optional(t.Number()),
    }),
  },
);
