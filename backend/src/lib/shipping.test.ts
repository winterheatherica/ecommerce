import { describe, expect, it } from "vitest";

import { cariOpsi, opsiOngkir } from "./shipping";

describe("opsiOngkir", () => {
  it("mengembalikan tiga kurir untuk tujuan yang dikenal", () => {
    const hasil = opsiOngkir("Jawa Barat", 100);

    expect(hasil).toHaveLength(3);
    expect(hasil.map((o) => o.courier)).toEqual(["JNE", "J&T", "SiCepat"]);
  });

  it("memberi zona tengah untuk provinsi di luar tabel", () => {
    const jawaBarat = opsiOngkir("Jawa Barat", 100)[0].cost;
    const papua = opsiOngkir("Papua", 100)[0].cost;
    const sumut = opsiOngkir("Sumatera Utara", 100)[0].cost;

    expect(papua).toBeGreaterThan(jawaBarat);
    expect(papua).toBeLessThan(sumut);
  });

  it("menagih lebih mahal untuk zona yang lebih jauh", () => {
    const bandung = opsiOngkir("Jawa Barat", 100)[0].cost;
    const surabaya = opsiOngkir("Jawa Timur", 100)[0].cost;
    const medan = opsiOngkir("Sumatera Utara", 100)[0].cost;

    expect(surabaya).toBeGreaterThan(bandung);
    expect(medan).toBeGreaterThan(surabaya);
  });

  it("membulatkan berat ke atas per kilogram", () => {
    const satuGram = opsiOngkir("Jawa Barat", 1)[0].cost;
    const seribuGram = opsiOngkir("Jawa Barat", 1000)[0].cost;
    const seribuSatu = opsiOngkir("Jawa Barat", 1001)[0].cost;

    expect(satuGram).toBe(seribuGram);
    expect(seribuSatu).toBeGreaterThan(seribuGram);
  });

  it("membulatkan biaya ke kelipatan 500", () => {
    for (const o of opsiOngkir("Bali", 2300)) {
      expect(o.cost % 500).toBe(0);
    }
  });

  it("selalu memberi etd", () => {
    for (const o of opsiOngkir("DKI Jakarta", 500)) {
      expect(o.etd).toMatch(/^\d+-\d+$/);
    }
  });
});

describe("cariOpsi", () => {
  it("menemukan kombinasi kurir dan layanan yang cocok", () => {
    const o = cariOpsi("Jawa Barat", 100, "JNE", "REG");

    expect(o).not.toBeNull();
    expect(o?.courier).toBe("JNE");
    expect(o?.service).toBe("REG");
  });

  it("menolak layanan yang tidak dimiliki kurir itu", () => {
    expect(cariOpsi("Jawa Barat", 100, "JNE", "BEST")).toBeNull();
  });

  it("menolak kurir yang tidak dikenal", () => {
    expect(cariOpsi("Jawa Barat", 100, "Ninja", "REG")).toBeNull();
  });
});
