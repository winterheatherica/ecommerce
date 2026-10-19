import { afterAll, beforeEach, describe, expect, it } from "vitest";

import type { Sql } from "../lib/db";
import { koneksiTes } from "../test/db";
import { sapuPeristiwaWebhook } from "./webhook";

const sql: Sql = koneksiTes();

beforeEach(async () => {
  await sql`delete from webhook_events`;
});

afterAll(async () => {
  await sql.end();
});

async function catat(nomor: string, hariLalu: number) {
  await sql`
    insert into webhook_events (provider, external_id, event_type, payload, processed, received_at)
    values ('doku', ${nomor}, 'SUCCESS', ${sql.json({ nomor })}, true, now() - make_interval(days => ${hariLalu}))
  `;
}

describe("sapuPeristiwaWebhook", () => {
  it("menghapus catatan yang lebih tua dari 90 hari dan menyisakan yang baru", async () => {
    await catat("lama", 91);
    await catat("pas-89", 89);
    await catat("baru", 1);

    expect(await sapuPeristiwaWebhook(sql)).toBe(1);

    const sisa = await sql<{ external_id: string }[]>`select external_id from webhook_events order by external_id`;
    expect(sisa.map((s) => s.external_id)).toEqual(["baru", "pas-89"]);
  });

  it("tidak menghapus apa pun kalau semuanya masih baru", async () => {
    await catat("baru", 0);
    expect(await sapuPeristiwaWebhook(sql)).toBe(0);
  });
});
