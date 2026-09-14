import { describe, expect, it } from "vitest";

import { bacaBasic, periksaAdmin, samaAman } from "./auth";

const KREDENSIAL = {
  ADMIN_USER: "menik",
  ADMIN_PASSWORD: "rahasia-panjang",
};

function basic(pengguna: string, sandi: string): string {
  return `Basic ${btoa(`${pengguna}:${sandi}`)}`;
}

describe("periksaAdmin", () => {
  it("menolak kalau tidak ada kredensial terpasang sama sekali", () => {
    const hasil = periksaAdmin({}, basic("menik", "rahasia-panjang"));

    expect(hasil.lolos).toBe(false);
  });

  it("menolak tanpa header Authorization", () => {
    expect(periksaAdmin(KREDENSIAL).lolos).toBe(false);
    expect(periksaAdmin(KREDENSIAL, "").lolos).toBe(false);
  });

  it("meloloskan kredensial yang benar", () => {
    expect(
      periksaAdmin(KREDENSIAL, basic("menik", "rahasia-panjang")).lolos,
    ).toBe(true);
  });

  it("menolak sandi yang salah", () => {
    expect(periksaAdmin(KREDENSIAL, basic("menik", "salah")).lolos).toBe(false);
  });

  it("menolak pengguna yang salah", () => {
    expect(
      periksaAdmin(KREDENSIAL, basic("orang-lain", "rahasia-panjang")).lolos,
    ).toBe(false);
  });

  it("menolak skema selain Basic", () => {
    const nilai = btoa("menik:rahasia-panjang");

    expect(periksaAdmin(KREDENSIAL, `Bearer ${nilai}`).lolos).toBe(false);
    expect(periksaAdmin(KREDENSIAL, nilai).lolos).toBe(false);
  });

  it("menolak base64 yang rusak tanpa melempar", () => {
    expect(periksaAdmin(KREDENSIAL, "Basic ###bukan-base64###").lolos).toBe(
      false,
    );
  });

  it("tetap meloloskan dev bypass di lokal", () => {
    expect(periksaAdmin({ ADMIN_DEV_BYPASS: "true" }).lolos).toBe(true);
  });

  it("bypass hanya aktif kalau ditulis persis 'true'", () => {
    expect(periksaAdmin({ ADMIN_DEV_BYPASS: "TRUE" }).lolos).toBe(false);
    expect(periksaAdmin({ ADMIN_DEV_BYPASS: "1" }).lolos).toBe(false);
  });

  it("membuang spasi di kredensial yang tersimpan", () => {
    const hasil = periksaAdmin(
      { ADMIN_USER: "  menik  ", ADMIN_PASSWORD: " rahasia-panjang \n" },
      basic("menik", "rahasia-panjang"),
    );

    expect(hasil.lolos).toBe(true);
  });

  it("memberi status 401, bukan 403 atau 500", () => {
    const hasil = periksaAdmin(KREDENSIAL);

    expect(hasil.lolos).toBe(false);
    if (hasil.lolos) return;
    expect(hasil.status).toBe(401);
  });
});

describe("bacaBasic", () => {
  it("mengurai kredensial yang sah", () => {
    expect(bacaBasic(basic("a", "b"))).toBe("a:b");
  });

  it("tidak peduli huruf besar-kecil pada kata Basic", () => {
    expect(bacaBasic(`basic ${btoa("a:b")}`)).toBe("a:b");
  });

  it("undefined untuk bentuk yang tidak dikenal", () => {
    expect(bacaBasic(undefined)).toBeUndefined();
    expect(bacaBasic("Digest abc")).toBeUndefined();
  });
});

describe("samaAman", () => {
  it("benar hanya untuk teks yang sama persis", () => {
    expect(samaAman("abc", "abc")).toBe(true);
    expect(samaAman("abc", "abd")).toBe(false);
    expect(samaAman("abc", "abcd")).toBe(false);
  });
});
