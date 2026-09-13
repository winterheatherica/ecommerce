import { describe, expect, it } from "vitest";

import { cariOpsi, opsiOngkir } from "./shipping";

describe("opsiOngkir", () => {
  it("mengembalikan tiga kurir untuk tujuan yang dikenal", () => {
    const hasil = opsiOngkir("50001", 100);

    expect(hasil).toHaveLength(3);
    expect(hasil.map((o) => o.courier)).toEqual(["JNE", "J&T", "SiCepat"]);
  });

  it("mengembalikan daftar kosong untuk tujuan yang tidak dikenal", () => {
    expect(opsiOngkir("tidak-ada", 100)).toEqual([]);
  });

  it("menagih lebih mahal untuk zona yang lebih jauh", () => {
    const bandung = opsiOngkir("50001", 100)[0].cost;
    const surabaya = opsiOngkir("50008", 100)[0].cost;
    const medan = opsiOngkir("50011", 100)[0].cost;

    expect(surabaya).toBeGreaterThan(bandung);
    expect(medan).toBeGreaterThan(surabaya);
  });

  it("membulatkan berat ke atas per kilogram", () => {
    const satuGram = opsiOngkir("50001", 1)[0].cost;
    const seribuGram = opsiOngkir("50001", 1000)[0].cost;
    const seribuSatu = opsiOngkir("50001", 1001)[0].cost;

    expect(satuGram).toBe(seribuGram);
    expect(seribuSatu).toBeGreaterThan(seribuGram);
  });

  it("membulatkan biaya ke kelipatan 500", () => {
    for (const o of opsiOngkir("50010", 2300)) {
      expect(o.cost % 500).toBe(0);
    }
  });

  it("selalu memberi etd", () => {
    for (const o of opsiOngkir("50004", 500)) {
      expect(o.etd).toMatch(/^\d+-\d+$/);
    }
  });
});

describe("cariOpsi", () => {
  it("menemukan kombinasi kurir dan layanan yang cocok", () => {
    const o = cariOpsi("50001", 100, "JNE", "REG");

    expect(o).not.toBeNull();
    expect(o?.courier).toBe("JNE");
    expect(o?.service).toBe("REG");
  });

  it("menolak layanan yang tidak dimiliki kurir itu", () => {
    expect(cariOpsi("50001", 100, "JNE", "BEST")).toBeNull();
  });

  it("menolak kurir yang tidak dikenal", () => {
    expect(cariOpsi("50001", 100, "Ninja", "REG")).toBeNull();
  });
});
