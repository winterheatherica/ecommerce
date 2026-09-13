import { Elysia, t } from "elysia";

import { tandaiTerbayar } from "../lib/orders";

type Catatan = {
  id: number;
  provider: string;
  external_id: string | null;
  event_type: string | null;
  payload: unknown;
  processed: boolean;
  received_at: string;
};

export const webhookEvents: Catatan[] = [];

let idBerikut = 1;

export const webhookRoutes = new Elysia().post(
  "/api/webhooks/xendit",
  ({ body, headers, set }) => {
    const token = headers["x-callback-token"];
    const diharapkan = process.env.XENDIT_CALLBACK_TOKEN;

    if (!diharapkan || token !== diharapkan) {
      set.status = 401;
      return { error: "unauthorized", message: "Token callback tidak cocok" };
    }

    webhookEvents.push({
      id: idBerikut++,
      provider: "xendit",
      external_id: body.external_id ?? null,
      event_type: body.status ?? null,
      payload: body,
      processed: false,
      received_at: new Date().toISOString(),
    });

    if (body.status !== "PAID") {
      return { received: true, ignored: true };
    }

    if (!body.external_id) {
      return { received: true, ignored: true };
    }

    const hasil = tandaiTerbayar(body.external_id, body.payment_method ?? null);

    return { received: true, applied: hasil.ok && !hasil.sudahPernah };
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
