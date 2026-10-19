import { describe, expect, it } from "vitest";

import { periksaUlasanShopee, samarkanPengulas } from "./ulasan";

const SEKARANG = new Date("2026-10-19T12:00:00Z");

describe("samarkanPengulas", () => {
  it("menyisakan huruf pertama dan terakhir seperti Shopee", () => {
    expect(samarkanPengulas("rafiianindito229")).toBe("r*****9");
    expect(samarkanPengulas("  budi  ")).toBe("b*****i");
    expect(samarkanPengulas("ab")).toBe("a*");
  });

  it("nama yang sudah disamarkan Shopee dibiarkan apa adanya", () => {
    expect(samarkanPengulas("r*****3")).toBe("r*****3");
  });
});

describe("periksaUlasanShopee", () => {
  const dasar = {
    rating: 5,
    author_name: "pembeliasli",
    body: "  Barang sampai, mantap  ",
    reviewed_at: "2026-10-01T08:00:00+07:00",
  };

  it("menyamarkan nama, membuang spasi tepi, dan menyeragamkan tanggal ke UTC", () => {
    const hasil = periksaUlasanShopee(dasar, SEKARANG);

    expect(hasil.ok && hasil.bersih).toEqual({
      rating: 5,
      author_name: "p*****i",
      body: "Barang sampai, mantap",
      follow_up: null,
      reviewed_at: "2026-10-01T01:00:00.000Z",
    });
  });

  it("boleh cuma berisi update penilaian, tapi tidak boleh kosong sama sekali", () => {
    expect(periksaUlasanShopee({ ...dasar, body: null, follow_up: "Update: ampuh" }, SEKARANG).ok).toBe(true);
    expect(periksaUlasanShopee({ ...dasar, body: "   ", follow_up: null }, SEKARANG).ok).toBe(false);
  });

  it("menolak bintang di luar 1 sampai 5, tanggal ngawur, dan tanggal di masa depan", () => {
    expect(periksaUlasanShopee({ ...dasar, rating: 0 }, SEKARANG).ok).toBe(false);
    expect(periksaUlasanShopee({ ...dasar, rating: 4.5 }, SEKARANG).ok).toBe(false);
    expect(periksaUlasanShopee({ ...dasar, reviewed_at: "kemarin" }, SEKARANG).ok).toBe(false);
    expect(periksaUlasanShopee({ ...dasar, reviewed_at: "2026-12-01" }, SEKARANG).ok).toBe(false);
  });
});
