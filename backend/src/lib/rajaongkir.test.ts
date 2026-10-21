import { afterEach, describe, expect, it, vi } from "vitest";

import { lacakResi } from "./rajaongkir";

const KONFIG = { apiKey: "kunci-uji", originId: "17485" };

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("lacakResi", () => {
  it("mengirim resi, kurir, dan 5 digit HP ke endpoint lacak dengan kunci di header", async () => {
    const tangkap = vi.fn(async (_url: string, _init: RequestInit) =>
      new Response(
        JSON.stringify({
          meta: { status: "success", code: 200, message: "Success Get Waybill" },
          data: { delivered: true, manifest: [] },
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", tangkap);

    const hasil = await lacakResi(KONFIG, " 300380022869426 ", "jne", "13740");

    expect(hasil).toEqual({ ok: true, data: { delivered: true, manifest: [] } });

    const [url, init] = tangkap.mock.calls[0];
    const alamat = new URL(url);
    expect(`${alamat.origin}${alamat.pathname}`).toBe("https://rajaongkir.komerce.id/api/v1/track/waybill");
    expect(Object.fromEntries(alamat.searchParams)).toEqual({
      awb: "300380022869426",
      courier: "jne",
      last_phone_number: "13740",
    });
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>).key).toBe("kunci-uji");
    expect(Object.fromEntries(new URLSearchParams(init.body as URLSearchParams))).toEqual({
      awb: "300380022869426",
      courier: "jne",
      last_phone_number: "13740",
    });
  });

  it("tanpa nomor HP, parameter HP tidak dikirim", async () => {
    const tangkap = vi.fn(async (_url: string, _init: RequestInit) =>
      new Response(JSON.stringify({ meta: { status: "success" }, data: {} }), { status: 200 }),
    );
    vi.stubGlobal("fetch", tangkap);

    await lacakResi(KONFIG, "JP1234567890", "jnt", null);

    expect(new URL(tangkap.mock.calls[0][0]).searchParams.has("last_phone_number")).toBe(false);
  });

  it("meneruskan pesan penolakan dari RajaOngkir", async () => {
    vi.stubGlobal("fetch", vi.fn(async () =>
      new Response(
        JSON.stringify({ meta: { status: "error", code: 404, message: "Waybill not found" }, data: null }),
        { status: 404 },
      ),
    ));

    expect(await lacakResi(KONFIG, "123", "jne", "13740")).toEqual({
      ok: false,
      status: 404,
      pesan: "Waybill not found",
    });
  });

  it("kalau RajaOngkir diam, log tidak memuat resi maupun digit HP", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new DOMException("timeout", "TimeoutError");
    }));
    const catat = vi.spyOn(console, "error").mockImplementation(() => {});

    const hasil = await lacakResi(KONFIG, "300380022869426", "jne", "13740");

    expect(hasil).toMatchObject({ ok: false, status: 504 });
    const isiLog = JSON.stringify(catat.mock.calls.map((c) => c.slice(0, 2)));
    expect(isiLog).toContain("/api/v1/track/waybill");
    expect(isiLog).not.toContain("300380022869426");
    expect(isiLog).not.toContain("13740");
  });
});
