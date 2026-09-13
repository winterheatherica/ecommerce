import { env } from "cloudflare:workers";
import { Elysia, t } from "elysia";

import { buatKoneksi, type Sql } from "../lib/db";
import { tandaiTerbayar } from "../db/pesanan";

type Peristiwa = {
  external_id: string | null;
  status: string | null;
  payload: unknown;
};

async function catat(sql: Sql, p: Peristiwa, diproses: boolean): Promise<void> {
  await sql`
    insert into webhook_events (provider, external_id, event_type, payload, processed)
    values ('xendit', ${p.external_id}, ${p.status}, ${JSON.stringify(p.payload)}::jsonb, ${diproses})
  `;
}

export const webhookRoutes = new Elysia().post(
  "/api/webhooks/xendit",
  async ({ body, headers, set }) => {
    const wadah = env as unknown as Record<string, string>;
    const token = headers["x-callback-token"];
    const diharapkan = wadah.XENDIT_CALLBACK_TOKEN;

    if (!diharapkan || token !== diharapkan) {
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
      if (body.status !== "PAID" || !body.external_id) {
        await catat(sql, peristiwa, false);
        return { received: true, ignored: true };
      }

      const hasil = await tandaiTerbayar(
        sql,
        body.external_id,
        body.payment_method ?? null,
      );

      await catat(sql, peristiwa, hasil.ok);

      return { received: true, applied: hasil.ok && !hasil.sudahPernah };
    } finally {
      await sql.end();
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
