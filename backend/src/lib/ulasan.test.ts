import { describe, expect, it } from "vitest";

import { PENGULAS_TANPA_NAMA, periksaUlasanImpor, samarkanPengulas } from "./ulasan";

const SEKARANG = new Date("2026-10-19T12:00:00Z");

describe("samarkanPengulas", () => {
  it("menyisakan huruf pertama dan terakhir seperti Shopee", () => {
    expect(samarkanPengulas("rafiianindito229")).toBe("r*****9");
    expect(samarkanPengulas("  budi  ")).toBe("b*****i");
    expect(samarkanPengulas("ab")).toBe("a*");
  });

  it("nama yang sudah disamarkan Shopee atau Tokopedia dibiarkan apa adanya", () => {
    expect(samarkanPengulas("r*****3")).toBe("r*****3");
    expect(samarkanPengulas("V***t")).toBe("V***t");
  });

  it("nama kosong diganti sebutan umum", () => {
    expect(samarkanPengulas("   ")).toBe(PENGULAS_TANPA_NAMA);
  });
});

describe("periksaUlasanImpor", () => {
  const dasar = {
    rating: 5,
    author_name: "pembeliasli",
    body: "  Barang sampai, mantap  ",
    reviewed_at: "2026-10-01T08:00:00+07:00",
  };

  it("bawaannya Shopee: menyamarkan nama, membuang spasi tepi, dan menyeragamkan tanggal ke UTC", () => {
    const hasil = periksaUlasanImpor(dasar, SEKARANG);

    expect(hasil.ok && hasil.bersih).toEqual({
      source: "shopee",
      rating: 5,
      author_name: "p*****i",
      body: "Barang sampai, mantap",
      follow_up: null,
      reviewed_at: "2026-10-01T01:00:00.000Z",
      source_product: null,
      source_url: null,
    });
  });

  it("ulasan Tokopedia menyimpan nama produk dan link asalnya", () => {
    const hasil = periksaUlasanImpor(
      {
        ...dasar,
        source: "tokopedia",
        source_product: "  Gel Pengusir dan training Kucing 100gr ",
        source_url: "https://www.tokopedia.com/menikstore/gel-pengusir-kucing",
      },
      SEKARANG,
    );

    expect(hasil.ok && hasil.bersih).toMatchObject({
      source: "tokopedia",
      source_product: "Gel Pengusir dan training Kucing 100gr",
      source_url: "https://www.tokopedia.com/menikstore/gel-pengusir-kucing",
    });
  });

  it("link Tokopedia harus benar-benar ke tokopedia.com, dan Shopee mengabaikan isian asal", () => {
    expect(
      periksaUlasanImpor({ ...dasar, source: "tokopedia", source_url: "https://tokopedia.evil.test/x" }, SEKARANG).ok,
    ).toBe(false);
    expect(
      periksaUlasanImpor({ ...dasar, source: "tokopedia", source_url: "http://www.tokopedia.com/x" }, SEKARANG).ok,
    ).toBe(false);

    const shopee = periksaUlasanImpor(
      { ...dasar, source: "shopee", source_product: "x", source_url: "https://www.tokopedia.com/x" },
      SEKARANG,
    );
    expect(shopee.ok && [shopee.bersih.source_product, shopee.bersih.source_url]).toEqual([null, null]);
  });

  it("boleh cuma berisi update penilaian, tapi tidak boleh kosong sama sekali", () => {
    expect(periksaUlasanImpor({ ...dasar, body: null, follow_up: "Update: ampuh" }, SEKARANG).ok).toBe(true);
    expect(periksaUlasanImpor({ ...dasar, body: "   ", follow_up: null }, SEKARANG).ok).toBe(false);
  });

  it("menolak bintang di luar 1 sampai 5, tanggal ngawur, dan tanggal di masa depan", () => {
    expect(periksaUlasanImpor({ ...dasar, rating: 0 }, SEKARANG).ok).toBe(false);
    expect(periksaUlasanImpor({ ...dasar, rating: 4.5 }, SEKARANG).ok).toBe(false);
    expect(periksaUlasanImpor({ ...dasar, reviewed_at: "kemarin" }, SEKARANG).ok).toBe(false);
    expect(periksaUlasanImpor({ ...dasar, reviewed_at: "2026-12-01" }, SEKARANG).ok).toBe(false);
  });
});
