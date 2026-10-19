import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  catatPesananBaru,
  masihBolehPesan,
  pakaiJatahRajaOngkir,
  tanggalWib,
} from "./jatah";

const ENV = {
  UPSTASH_REDIS_REST_URL: "https://redis.uji",
  UPSTASH_REDIS_REST_TOKEN: "token-uji",
  RAJAONGKIR_JATAH_HARIAN: "5",
  RAJAONGKIR_JATAH_PER_IP: "3",
  MAKS_PESANAN_PER_IP: "2",
};
const SEKARANG = new Date("2026-10-19T03:00:00Z");

let isi: Map<string, number>;

function upstashPalsu() {
  isi = new Map();

  return vi.fn(async (url: string, init: RequestInit) => {
    const badan = JSON.parse(String(init.body));

    if (url.endsWith("/pipeline")) {
      const hasil = (badan as (string | number)[][]).map(([cmd, kunci]) => {
        if (cmd === "INCR") {
          const n = (isi.get(String(kunci)) ?? 0) + 1;
          isi.set(String(kunci), n);
          return { result: n };
        }
        return { result: 1 };
      });
      return new Response(JSON.stringify(hasil));
    }

    const [cmd, kunci] = badan as string[];
    if (cmd === "GET") {
      const n = isi.get(kunci);
      return new Response(JSON.stringify({ result: n === undefined ? null : String(n) }));
    }
    return new Response(JSON.stringify({ result: null }));
  });
}

beforeEach(() => {
  vi.stubGlobal("fetch", upstashPalsu());
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("jatah RajaOngkir", () => {
  it("satu jaringan cuma boleh sekian panggilan per hari", async () => {
    const hasil = [];
    for (let i = 0; i < 4; i++) hasil.push(await pakaiJatahRajaOngkir(ENV, "1.2.3.4", SEKARANG));

    expect(hasil).toEqual([true, true, true, false]);
  });

  it("jaringan yang kena batas tidak ikut menghabiskan jatah bersama", async () => {
    for (let i = 0; i < 6; i++) await pakaiJatahRajaOngkir(ENV, "1.2.3.4", SEKARANG);

    expect(isi.get("jatah:rajaongkir:2026-10-19")).toBe(3);
    expect(await pakaiJatahRajaOngkir(ENV, "5.6.7.8", SEKARANG)).toBe(true);
  });

  it("jatah bersama harian menahan banyak jaringan sekaligus", async () => {
    const hasil = [];
    for (const ip of ["a", "b", "c", "d", "e", "f"]) hasil.push(await pakaiJatahRajaOngkir(ENV, ip, SEKARANG));

    expect(hasil).toEqual([true, true, true, true, true, false]);
  });

  it("hari dihitung dengan jam WIB, jadi lewat pukul 17.00 UTC sudah hari berikutnya", () => {
    expect(tanggalWib(new Date("2026-10-19T16:59:00Z"))).toBe("2026-10-19");
    expect(tanggalWib(new Date("2026-10-19T17:00:00Z"))).toBe("2026-10-20");
  });

  it("kalau Redis mati atau belum dipasang, pembeli tetap boleh lewat", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new Error("jaringan putus");
    }));
    expect(await pakaiJatahRajaOngkir(ENV, "1.2.3.4", SEKARANG)).toBe(true);
    expect(await pakaiJatahRajaOngkir({}, "1.2.3.4", SEKARANG)).toBe(true);
  });
});

describe("batas pesanan per jaringan", () => {
  it("hanya pesanan yang berhasil dibuat yang dihitung", async () => {
    expect(await masihBolehPesan(ENV, "1.2.3.4", SEKARANG)).toBe(true);
    await catatPesananBaru(ENV, "1.2.3.4", SEKARANG);
    expect(await masihBolehPesan(ENV, "1.2.3.4", SEKARANG)).toBe(true);
    await catatPesananBaru(ENV, "1.2.3.4", SEKARANG);
    expect(await masihBolehPesan(ENV, "1.2.3.4", SEKARANG)).toBe(false);
    expect(await masihBolehPesan(ENV, "5.6.7.8", SEKARANG)).toBe(true);
  });

  it("hitungannya mulai lagi di jendela 6 jam berikutnya", async () => {
    await catatPesananBaru(ENV, "1.2.3.4", SEKARANG);
    await catatPesananBaru(ENV, "1.2.3.4", SEKARANG);

    const nanti = new Date(SEKARANG.getTime() + 6 * 3600 * 1000);
    expect(await masihBolehPesan(ENV, "1.2.3.4", nanti)).toBe(true);
  });
});
