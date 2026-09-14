import { afterAll, beforeEach, describe, expect, it } from "vitest";

import type { Sql } from "../lib/db";
import { koneksiTes } from "../test/db";
import { ambilTarifTersimpan, simpanTarif } from "./ongkir";
import type { OpsiOngkir } from "../lib/shipping";

const sql: Sql = koneksiTes();

const OPSI: OpsiOngkir[] = [
  { courier: "SICEPAT", service: "REG", cost: 8000, etd: "1-2 hari" },
  { courier: "JNE", service: "CTC", cost: 10000, etd: "1 hari" },
];

beforeEach(async () => {
  await sql`delete from shipping_quotes`;
});

afterAll(async () => {
  await sql.end();
});

describe("simpan dan ambil tarif", () => {
  it("kembali sebagai array, bukan string JSON", async () => {
    await simpanTarif(sql, "17683", 150, "jne:jnt", OPSI);
    const hasil = await ambilTarifTersimpan(sql, "17683", 150, "jne:jnt", 24);

    expect(Array.isArray(hasil)).toBe(true);
    expect(hasil).toEqual(OPSI);
  });

  it("berat di bawah 1 kg berbagi entri yang sama", async () => {
    await simpanTarif(sql, "17683", 150, "jne", OPSI);

    expect(await ambilTarifTersimpan(sql, "17683", 900, "jne", 24)).toEqual(OPSI);
  });

  it("berat di atas 1 kg jadi entri berbeda", async () => {
    await simpanTarif(sql, "17683", 150, "jne", OPSI);

    expect(await ambilTarifTersimpan(sql, "17683", 1500, "jne", 24)).toBeUndefined();
  });

  it("kurir berbeda tidak saling memakai", async () => {
    await simpanTarif(sql, "17683", 150, "jne", OPSI);

    expect(await ambilTarifTersimpan(sql, "17683", 150, "pos", 24)).toBeUndefined();
  });

  it("menimpa entri lama untuk kunci yang sama", async () => {
    await simpanTarif(sql, "17683", 150, "jne", OPSI);
    await simpanTarif(sql, "17683", 150, "jne", [OPSI[0]]);

    expect(await ambilTarifTersimpan(sql, "17683", 150, "jne", 24)).toHaveLength(1);
  });

  it("tarif kedaluwarsa dianggap tidak ada", async () => {
    await simpanTarif(sql, "17683", 150, "jne", OPSI);
    await sql`update shipping_quotes set fetched_at = now() - interval '30 hours'`;

    expect(await ambilTarifTersimpan(sql, "17683", 150, "jne", 24)).toBeUndefined();
  });
});
