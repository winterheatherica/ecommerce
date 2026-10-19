import { describe, expect, it } from "vitest";

import { bypassAdmin, kredensialAdminCocok, samaAman } from "./auth";

const ENV = { ADMIN_USER: "admin", ADMIN_PASSWORD: "rahasia-uji" };

describe("kredensialAdminCocok", () => {
  it("meloloskan username dan password yang benar", () => {
    expect(kredensialAdminCocok(ENV, "admin", "rahasia-uji")).toBe(true);
  });

  it("menolak password yang salah atau username yang salah", () => {
    expect(kredensialAdminCocok(ENV, "admin", "rahasia-ujj")).toBe(false);
    expect(kredensialAdminCocok(ENV, "admln", "rahasia-uji")).toBe(false);
    expect(kredensialAdminCocok(ENV, "", "")).toBe(false);
  });

  it("menolak semua kalau kredensial belum dipasang di server", () => {
    expect(kredensialAdminCocok({}, "admin", "rahasia-uji")).toBe(false);
    expect(kredensialAdminCocok({ ADMIN_USER: " ", ADMIN_PASSWORD: " " }, " ", " ")).toBe(false);
  });

  it("spasi di sekitar username yang diketik tidak masalah, tapi password harus persis", () => {
    expect(kredensialAdminCocok(ENV, "  admin ", "rahasia-uji")).toBe(true);
    expect(kredensialAdminCocok(ENV, "admin", " rahasia-uji")).toBe(false);
  });
});

describe("bypassAdmin", () => {
  it("hanya aktif kalau ditulis persis 'true', untuk server lokal", () => {
    expect(bypassAdmin({ ADMIN_DEV_BYPASS: "true" })).toBe(true);
    expect(bypassAdmin({ ADMIN_DEV_BYPASS: "TRUE" })).toBe(false);
    expect(bypassAdmin({})).toBe(false);
  });
});

describe("samaAman", () => {
  it("benar hanya untuk teks yang sama persis", () => {
    expect(samaAman("abc", "abc")).toBe(true);
    expect(samaAman("abc", "abd")).toBe(false);
    expect(samaAman("abc", "abcd")).toBe(false);
  });
});
