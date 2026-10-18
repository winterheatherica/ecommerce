import { afterAll, beforeEach, describe, expect, it } from "vitest";

import type { Sql } from "../lib/db";
import { bersihkan, koneksiTes } from "../test/db";
import { daftarProduk, perbaruiProduk, satuProduk, satuProdukAdmin } from "./produk";

const sql: Sql = koneksiTes();
const KUCING = "bye-bye-cat-50g";
const LANGKAH = "Sebarkan gel di sudut\nUlangi tiap 3 hari";

beforeEach(async () => {
  await bersihkan(sql);
});

afterAll(async () => {
  await sql.end();
});

describe("cara pakai produk", () => {
  it("terbaca di halaman produk dan di admin", async () => {
    await perbaruiProduk(sql, KUCING, { usage_instructions: LANGKAH });

    expect((await satuProduk(sql, KUCING))?.usage_instructions).toBe(LANGKAH);
    expect((await satuProdukAdmin(sql, KUCING))?.usage_instructions).toBe(LANGKAH);
  });

  it("tidak ikut di daftar produk, supaya respons katalog tetap ringan", async () => {
    await perbaruiProduk(sql, KUCING, { usage_instructions: LANGKAH });
    const { data } = await daftarProduk(sql, { limit: 100, offset: 0 });

    expect(data.length).toBeGreaterThan(0);
    expect(data.some((p) => "usage_instructions" in p)).toBe(false);
  });

  it("bisa dihapus lagi dengan null", async () => {
    await perbaruiProduk(sql, KUCING, { usage_instructions: LANGKAH });
    await perbaruiProduk(sql, KUCING, { usage_instructions: null });

    expect((await satuProduk(sql, KUCING))?.usage_instructions).toBeNull();
  });

  it("database menolak teks kosong, jadi kosong selalu berarti null", async () => {
    await expect(
      sql`update products set usage_instructions = '' where slug = ${KUCING}`,
    ).rejects.toMatchObject({ code: "23514" });
  });
});
