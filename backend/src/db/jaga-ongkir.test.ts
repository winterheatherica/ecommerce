import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

import type { Sql } from "../lib/db";
import { opsiUntuk } from "../lib/ongkir";
import { koneksiTes } from "../test/db";
import { simpanTarif } from "./ongkir";

const sql: Sql = koneksiTes();
const ENV = {
  RAJAONGKIR_API_KEY: "kunci-uji",
  RAJAONGKIR_ORIGIN_ID: "12345",
  RAJAONGKIR_KURIR: "jne",
};

beforeEach(async () => {
  await sql`delete from shipping_quotes`;
});

afterAll(async () => {
  await sql.end();
});

describe("penjaga kuota RajaOngkir", () => {
  it("menolak tanpa memanggil RajaOngkir kalau jatahnya habis", async () => {
    const panggil = vi.fn();
    vi.stubGlobal("fetch", panggil);

    const hasil = await opsiUntuk(sql, ENV, "50001", 500, async () => false);

    expect(hasil).toMatchObject({ ok: false, dibatasi: true });
    expect(panggil).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("tarif yang sudah tersimpan tetap dipakai tanpa memakai jatah", async () => {
    await simpanTarif(sql, "50001", 500, "jne", [
      { courier: "JNE", service: "REG", cost: 9000, etd: "1-2" },
    ]);
    const jaga = vi.fn(async () => false);

    const hasil = await opsiUntuk(sql, ENV, "50001", 500, jaga);

    expect(hasil.ok).toBe(true);
    expect(jaga).not.toHaveBeenCalled();
  });
});
