import { describe, expect, it } from "vitest";

import { ambilCache, bacaKonfigRedis, kunciWilayah, simpanCache } from "./redis";

describe("bacaKonfigRedis", () => {
  const lengkap = {
    UPSTASH_REDIS_REST_URL: "https://contoh.upstash.io",
    UPSTASH_REDIS_REST_TOKEN: "token-uji",
  };

  it("membaca url dan token", () => {
    const k = bacaKonfigRedis(lengkap);

    expect(k?.url).toBe("https://contoh.upstash.io");
    expect(k?.token).toBe("token-uji");
  });

  it("membuang garis miring di ujung url", () => {
    expect(
      bacaKonfigRedis({ ...lengkap, UPSTASH_REDIS_REST_URL: "https://a.io///" })
        ?.url,
    ).toBe("https://a.io");
  });

  it("membuang spasi yang ikut tertempel", () => {
    const k = bacaKonfigRedis({
      UPSTASH_REDIS_REST_URL: "  https://a.io  ",
      UPSTASH_REDIS_REST_TOKEN: " t \n",
    });

    expect(k?.url).toBe("https://a.io");
    expect(k?.token).toBe("t");
  });

  it("undefined kalau salah satu tidak ada", () => {
    expect(bacaKonfigRedis({})).toBeUndefined();
    expect(bacaKonfigRedis({ UPSTASH_REDIS_REST_URL: "https://a.io" })).toBeUndefined();
    expect(bacaKonfigRedis({ ...lengkap, UPSTASH_REDIS_REST_TOKEN: "" })).toBeUndefined();
  });
});

describe("kunciWilayah", () => {
  it("tidak membedakan huruf besar-kecil dan spasi", () => {
    expect(kunciWilayah("  Bandung ", 8)).toBe(kunciWilayah("bandung", 8));
  });

  it("memisahkan batas hasil yang berbeda", () => {
    expect(kunciWilayah("bandung", 8)).not.toBe(kunciWilayah("bandung", 20));
  });
});

describe("cache tanpa konfigurasi", () => {
  it("membaca mengembalikan undefined, bukan melempar", async () => {
    await expect(ambilCache(undefined, "apa saja")).resolves.toBeUndefined();
  });

  it("menyimpan diam-diam dilewati, bukan melempar", async () => {
    await expect(
      simpanCache(undefined, "apa saja", { a: 1 }, 60),
    ).resolves.toBeUndefined();
  });
});
