import { createHash, createHmac } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { KonfigDoku } from "./doku";
import {
  bacaJawaban,
  badanCheckout,
  buatHalamanBayar,
  type PermintaanBayar,
} from "./payment";

const KONFIG: KonfigDoku = {
  clientId: "BRN-0001-1234567890123",
  secretKey: "SK-uji-bukan-kunci-asli",
  sandbox: true,
};

function permintaan(ubah: Partial<PermintaanBayar> = {}): PermintaanBayar {
  return {
    invoice_number: "MNK-ABC123",
    amount: 58000,
    due_minutes: 355,
    customer: { name: "Rina Kartika", email: "rina@contoh.test", phone: "0812-3456-7890" },
    items: [
      { sku: "012", name: "Bye Bye Cat Gel (50 g)", price: 49000, quantity: 1 },
      { sku: "ONGKIR", name: "Ongkir JNE REG", price: 9000, quantity: 1 },
    ],
    callback_url: "https://menikstore.my.id/order/MNK-ABC123",
    notification_url: "https://api.menikstore.my.id/api/webhooks/doku",
    ...ubah,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("badanCheckout", () => {
  it("hanya menawarkan enam metode yang dipasang di footer", () => {
    expect(badanCheckout(permintaan()).payment.payment_method_types).toEqual([
      "QRIS",
      "VIRTUAL_ACCOUNT_BCA",
      "VIRTUAL_ACCOUNT_BNI",
      "VIRTUAL_ACCOUNT_BANK_MANDIRI",
      "EMONEY_OVO",
      "EMONEY_DANA",
    ]);
  });

  it("jumlah rincian sama persis dengan total, karena DOKU memeriksanya", () => {
    const badan = badanCheckout(permintaan());
    const jumlah = badan.order.line_items.reduce((s, i) => s + i.price * i.quantity, 0);

    expect(jumlah).toBe(badan.order.amount);
  });

  it("notifikasi dikirim ke webhook kita dan pembeli dikembalikan ke halaman pesanan", () => {
    const badan = badanCheckout(permintaan());

    expect(badan.additional_info.override_notification_url).toBe(
      "https://api.menikstore.my.id/api/webhooks/doku",
    );
    expect(badan.order.callback_url).toBe("https://menikstore.my.id/order/MNK-ABC123");
    expect(badan.order.auto_redirect).toBe(true);
  });

  it("nomor HP memakai format 62 dan email dilewati kalau kosong", () => {
    const badan = badanCheckout(
      permintaan({ customer: { name: "Rina", email: null, phone: "0812-3456-7890" } }),
    );

    expect(badan.customer.phone).toBe("6281234567890");
    expect("email" in badan.customer).toBe(false);
  });
});

describe("bacaJawaban", () => {
  it("mengambil URL halaman bayar dan token dari jawaban sukses", async () => {
    const res = new Response(
      JSON.stringify({
        message: ["SUCCESS"],
        response: {
          payment: {
            url: "https://sandbox.doku.com/checkout-link-v2/abc",
            token_id: "abc",
            expired_date: "20261017120000",
          },
        },
      }),
      { status: 200 },
    );

    expect(await bacaJawaban(res)).toEqual({
      ok: true,
      data: {
        url: "https://sandbox.doku.com/checkout-link-v2/abc",
        token_id: "abc",
        expired_date: "20261017120000",
      },
    });
  });

  it("meneruskan pesan galat DOKU apa adanya supaya bisa dibaca di log", async () => {
    const res = new Response(
      JSON.stringify({ error_messages: ["Invalid Header Signature"] }),
      { status: 400 },
    );

    expect(await bacaJawaban(res)).toEqual({
      ok: false,
      status: 400,
      pesan: "DOKU menolak: Invalid Header Signature",
    });
  });

  it("jawaban 200 tanpa URL tetap dianggap gagal", async () => {
    const res = new Response(JSON.stringify({ message: ["SUCCESS"] }), { status: 200 });
    const hasil = await bacaJawaban(res);

    expect(hasil.ok).toBe(false);
    if (hasil.ok) return;
    expect(hasil.status).toBe(502);
  });
});

describe("buatHalamanBayar", () => {
  it("menandatangani persis body yang dikirim, ke alamat sandbox", async () => {
    const tangkap = vi.fn(async (_url: string, _init: RequestInit) =>
      new Response(
        JSON.stringify({ response: { payment: { url: "https://x/bayar", token_id: "t1" } } }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", tangkap);

    const waktu = new Date("2026-10-17T03:38:28.123Z");
    const hasil = await buatHalamanBayar(KONFIG, permintaan(), "req-9", waktu);

    expect(hasil.ok).toBe(true);
    expect(tangkap).toHaveBeenCalledTimes(1);

    const [url, init] = tangkap.mock.calls[0];
    const kepala = init.headers as Record<string, string>;
    const badanTerkirim = init.body as string;

    expect(url).toBe("https://api-sandbox.doku.com/checkout/v1/payment");
    expect(kepala["Content-Type"]).toBe("application/json");
    expect(kepala["Request-Timestamp"]).toBe("2026-10-17T03:38:28Z");

    const komponen = [
      `Client-Id:${KONFIG.clientId}`,
      "Request-Id:req-9",
      "Request-Timestamp:2026-10-17T03:38:28Z",
      "Request-Target:/checkout/v1/payment",
      `Digest:${createHash("sha256").update(badanTerkirim).digest("base64")}`,
    ].join("\n");

    expect(kepala.Signature).toBe(
      `HMACSHA256=${createHmac("sha256", KONFIG.secretKey).update(komponen).digest("base64")}`,
    );
  });

  it("memakai alamat produksi kalau sandbox dimatikan", async () => {
    const tangkap = vi.fn(
      async (_url: string, _init?: RequestInit) => new Response("{}", { status: 400 }),
    );
    vi.stubGlobal("fetch", tangkap);

    await buatHalamanBayar({ ...KONFIG, sandbox: false }, permintaan());

    expect(tangkap.mock.calls[0][0]).toBe("https://api.doku.com/checkout/v1/payment");
  });

  it("tidak memanggil DOKU sama sekali kalau rinciannya tidak sama dengan total", async () => {
    const tangkap = vi.fn();
    vi.stubGlobal("fetch", tangkap);

    const hasil = await buatHalamanBayar(KONFIG, permintaan({ amount: 60000 }));

    expect(tangkap).not.toHaveBeenCalled();
    expect(hasil.ok).toBe(false);
  });

  it("melapor 504 kalau DOKU tidak merespons", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new DOMException("timeout", "TimeoutError");
    }));

    const hasil = await buatHalamanBayar(KONFIG, permintaan());

    expect(hasil.ok).toBe(false);
    if (hasil.ok) return;
    expect(hasil.status).toBe(504);
  });
});
