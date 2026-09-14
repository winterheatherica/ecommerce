import { describe, expect, it } from "vitest";

import {
  ambilPembatas,
  bebasDariBatas,
  kunciIp,
  lolos,
  type Pembatas,
} from "./ratelimit";

function permintaan(header: Record<string, string> = {}): Request {
  return new Request("https://contoh.test/api/orders", { headers: header });
}

describe("bebasDariBatas", () => {
  it("membebaskan webhook supaya Xendit tidak pernah ditolak", () => {
    expect(bebasDariBatas("/api/webhooks/xendit")).toBe(true);
  });

  it("membebaskan health check", () => {
    expect(bebasDariBatas("/api/health")).toBe(true);
  });

  it("tidak membebaskan jalur publik lain", () => {
    for (const jalur of ["/api/products", "/api/orders", "/api/regions"]) {
      expect(bebasDariBatas(jalur), jalur).toBe(false);
    }
  });
});

describe("kunciIp", () => {
  it("memakai cf-connecting-ip lebih dulu", () => {
    const k = kunciIp(
      permintaan({ "cf-connecting-ip": "1.2.3.4", "x-real-ip": "9.9.9.9" }),
      "pesanan",
    );

    expect(k).toBe("pesanan:1.2.3.4");
  });

  it("jatuh ke x-real-ip kalau cf tidak ada", () => {
    expect(kunciIp(permintaan({ "x-real-ip": "9.9.9.9" }), "umum")).toBe(
      "umum:9.9.9.9",
    );
  });

  it("tetap memberi kunci walau tanpa header ip", () => {
    expect(kunciIp(permintaan(), "umum")).toBe("umum:tanpa-ip");
  });

  it("memisahkan kuota per awalan", () => {
    const r = permintaan({ "cf-connecting-ip": "1.2.3.4" });

    expect(kunciIp(r, "umum")).not.toBe(kunciIp(r, "pesanan"));
  });
});

describe("ambilPembatas", () => {
  it("mengembalikan binding yang punya limit()", () => {
    const palsu = { limit: async () => ({ success: true }) };

    expect(ambilPembatas({ UMUM_LIMIT: palsu }, "UMUM_LIMIT")).toBe(palsu);
  });

  it("mengembalikan undefined kalau binding tidak ada", () => {
    expect(ambilPembatas({}, "UMUM_LIMIT")).toBeUndefined();
  });

  it("menolak nilai yang bukan pembatas", () => {
    expect(ambilPembatas({ UMUM_LIMIT: "bukan objek" }, "UMUM_LIMIT")).toBeUndefined();
    expect(ambilPembatas({ UMUM_LIMIT: {} }, "UMUM_LIMIT")).toBeUndefined();
  });
});

describe("lolos", () => {
  it("meloloskan semua kalau pembatas tidak terpasang", async () => {
    expect(await lolos(undefined, "umum:1.2.3.4")).toBe(true);
  });

  it("meneruskan keputusan pembatas", async () => {
    const tolak: Pembatas = { limit: async () => ({ success: false }) };
    const terima: Pembatas = { limit: async () => ({ success: true }) };

    expect(await lolos(tolak, "k")).toBe(false);
    expect(await lolos(terima, "k")).toBe(true);
  });

  it("mengirim kunci apa adanya ke pembatas", async () => {
    const dilihat: string[] = [];
    const perekam: Pembatas = {
      limit: async ({ key }) => {
        dilihat.push(key);
        return { success: true };
      },
    };

    await lolos(perekam, "pesanan:1.2.3.4");

    expect(dilihat).toEqual(["pesanan:1.2.3.4"]);
  });
});
