import { afterAll, beforeEach, describe, expect, it } from "vitest";

import type { Sql } from "../lib/db";
import { hashToken, tokenAcak } from "../lib/sesi";
import { koneksiTes } from "../test/db";
import { adminDariCookie, buatSesiAdmin, hapusSesiAdmin, sapuSesiAdmin, sesiAdminSah } from "./admin";

const sql: Sql = koneksiTes();

beforeEach(async () => {
  await sql`delete from admin_sessions`;
});

afterAll(async () => {
  await sql.end();
});

async function sesiBaru(jam = 12): Promise<string> {
  const token = tokenAcak();
  await buatSesiAdmin(sql, await hashToken(token), jam);
  return token;
}

describe("sesi admin", () => {
  it("token yang baru dibuat langsung sah, dan yang tersimpan cuma hash-nya", async () => {
    const token = await sesiBaru();

    expect(await sesiAdminSah(sql, token)).toBe(true);
    const [baris] = await sql<{ token_hash: string }[]>`select token_hash from admin_sessions`;
    expect(baris.token_hash).not.toBe(token);
  });

  it("dibaca dari cookie adm di antara cookie lain", async () => {
    const token = await sesiBaru();

    expect(await adminDariCookie(sql, `sid=abc; adm=${token}; lain=1`)).toBe(true);
    expect(await adminDariCookie(sql, "sid=abc")).toBe(false);
    expect(await adminDariCookie(sql, undefined)).toBe(false);
  });

  it("token acak atau kosong tidak sah", async () => {
    await sesiBaru();

    expect(await sesiAdminSah(sql, tokenAcak())).toBe(false);
    expect(await sesiAdminSah(sql, null)).toBe(false);
  });

  it("sesi yang sudah lewat masanya tidak sah dan ikut tersapu", async () => {
    const token = await sesiBaru();
    await sql`update admin_sessions set expires_at = now() - interval '1 minute'`;

    expect(await sesiAdminSah(sql, token)).toBe(false);
    expect(await sapuSesiAdmin(sql)).toBe(1);
  });

  it("keluar menghapus sesinya", async () => {
    const token = await sesiBaru();
    await hapusSesiAdmin(sql, token);

    expect(await sesiAdminSah(sql, token)).toBe(false);
  });
});
