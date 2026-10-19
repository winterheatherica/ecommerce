import { afterEach, describe, expect, it, vi } from "vitest";

import { bacaKonfigTurnstile, periksaTurnstile, turnstileWajib } from "./turnstile";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("bacaKonfigTurnstile", () => {
  it("aktif hanya kalau site key dan secret dua-duanya terpasang", () => {
    expect(bacaKonfigTurnstile({ TURNSTILE_SITE_KEY: "0x1", TURNSTILE_SECRET_KEY: "0x2" })).toEqual({
      siteKey: "0x1",
      secret: "0x2",
    });
    expect(bacaKonfigTurnstile({ TURNSTILE_SITE_KEY: "0x1" })).toBeNull();
    expect(bacaKonfigTurnstile({ TURNSTILE_SITE_KEY: " ", TURNSTILE_SECRET_KEY: "0x2" })).toBeNull();
  });
});

describe("periksaTurnstile", () => {
  it("mengirim secret, token, dan IP pembeli ke Cloudflare", async () => {
    const tangkap = vi.fn(async (_url: string, _init: RequestInit) =>
      new Response(JSON.stringify({ success: true }), { status: 200 }),
    );
    vi.stubGlobal("fetch", tangkap);

    expect(await periksaTurnstile("rahasia", "token-1", "36.71.20.5")).toBe(true);

    const [url, init] = tangkap.mock.calls[0];
    const badan = new URLSearchParams(init.body as URLSearchParams);
    expect(url).toBe("https://challenges.cloudflare.com/turnstile/v0/siteverify");
    expect(Object.fromEntries(badan)).toEqual({ secret: "rahasia", response: "token-1", remoteip: "36.71.20.5" });
  });

  it("menolak kalau Cloudflare bilang gagal, dan mencatat kodenya tanpa secret", async () => {
    vi.stubGlobal("fetch", vi.fn(async () =>
      new Response(JSON.stringify({ success: false, "error-codes": ["invalid-input-secret"] }), { status: 200 }),
    ));
    const catat = vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(await periksaTurnstile("rahasia", "token-palsu", null)).toBe(false);
    expect(catat).toHaveBeenCalledWith("[turnstile] ditolak", 200, ["invalid-input-secret"]);
    expect(JSON.stringify(catat.mock.calls)).not.toContain("rahasia");
  });

  it("menolak tanpa token, tanpa memanggil Cloudflare", async () => {
    const tangkap = vi.fn();
    vi.stubGlobal("fetch", tangkap);

    expect(await periksaTurnstile("rahasia", "", null)).toBe(false);
    expect(await periksaTurnstile("rahasia", undefined, null)).toBe(false);
    expect(tangkap).not.toHaveBeenCalled();
  });

  it("menolak kalau Cloudflare tidak merespons, bukan meloloskan", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new DOMException("timeout", "TimeoutError");
    }));

    expect(await periksaTurnstile("rahasia", "token-1", null)).toBe(false);
  });
});

describe("turnstileWajib", () => {
  it("wajib di produksi yang memakai https, tidak wajib di lokal", () => {
    expect(turnstileWajib({ STOREFRONT_URL: "https://menikstore.my.id" })).toBe(true);
    expect(turnstileWajib({ STOREFRONT_URL: "  https://menikstore.my.id  " })).toBe(true);
    expect(turnstileWajib({ STOREFRONT_URL: "http://localhost:3000" })).toBe(false);
    expect(turnstileWajib({})).toBe(false);
  });
});
