import { createHash, createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";

import {
  CADANGAN_MENIT,
  JALUR_NOTIFIKASI,
  bacaKonfig,
  dasarDoku,
  digestBadan,
  hpInternasional,
  kepalaPermintaan,
  menitBayar,
  namaMetode,
  notifikasiSah,
  stempelWaktu,
  stringKomponen,
  tandaTangan,
  type KepalaNotifikasi,
  type KonfigDoku,
} from "./doku";

const KONFIG: KonfigDoku = {
  clientId: "BRN-0001-1234567890123",
  secretKey: "SK-uji-bukan-kunci-asli",
  sandbox: true,
};

const BADAN = JSON.stringify({
  order: { amount: 58000, invoice_number: "MNK-ABC123" },
  payment: { payment_due_date: 355 },
});

describe("komponen tanda tangan", () => {
  it("menyusun baris sesuai urutan dokumentasi DOKU tanpa baris baru di akhir", () => {
    const hasil = stringKomponen({
      clientId: "MCH-0001-10791114622547",
      requestId: "cc682442-6c22-493e-8121-b9ef6b3fa728",
      timestamp: "2020-08-11T08:45:42Z",
      target: "/doku-virtual-account/v2/payment-code",
      digest: "5WIYK2TJg6iiZ0d5v4IXSR0EkYEkYOezJIma3Ufli5s=",
    });

    expect(hasil).toBe(
      [
        "Client-Id:MCH-0001-10791114622547",
        "Request-Id:cc682442-6c22-493e-8121-b9ef6b3fa728",
        "Request-Timestamp:2020-08-11T08:45:42Z",
        "Request-Target:/doku-virtual-account/v2/payment-code",
        "Digest:5WIYK2TJg6iiZ0d5v4IXSR0EkYEkYOezJIma3Ufli5s=",
      ].join("\n"),
    );
    expect(hasil.endsWith("\n")).toBe(false);
  });

  it("tidak menyertakan baris Digest untuk permintaan tanpa badan", () => {
    const hasil = stringKomponen({
      clientId: "a",
      requestId: "b",
      timestamp: "c",
      target: "/orders/v1/status/MNK-1",
    });

    expect(hasil.split("\n")).toHaveLength(4);
    expect(hasil).not.toContain("Digest");
  });

  it("stempel waktu UTC tanpa milidetik, seperti contoh DOKU", () => {
    expect(stempelWaktu(new Date("2026-10-17T03:38:28.517Z"))).toBe(
      "2026-10-17T03:38:28Z",
    );
  });
});

describe("digest dan HMAC sama dengan implementasi independen node:crypto", () => {
  it("digest = base64 dari SHA-256 badan", async () => {
    const harapan = createHash("sha256").update(BADAN, "utf8").digest("base64");
    expect(await digestBadan(BADAN)).toBe(harapan);
  });

  it("digest tetap benar untuk huruf di luar ASCII", async () => {
    const badan = JSON.stringify({ name: "Kaos Kaki Ñandú · 80 g" });
    const harapan = createHash("sha256").update(badan, "utf8").digest("base64");
    expect(await digestBadan(badan)).toBe(harapan);
  });

  it("tanda tangan = HMACSHA256= ditambah base64 HMAC string komponen", async () => {
    const komponen = stringKomponen({
      clientId: KONFIG.clientId,
      requestId: "req-1",
      timestamp: "2026-10-17T03:38:28Z",
      target: "/checkout/v1/payment",
      digest: await digestBadan(BADAN),
    });

    const harapan = createHmac("sha256", KONFIG.secretKey)
      .update(komponen, "utf8")
      .digest("base64");

    expect(await tandaTangan(KONFIG.secretKey, komponen)).toBe(`HMACSHA256=${harapan}`);
  });

  it("kepala permintaan memakai digest dari badan yang persis dikirim", async () => {
    const waktu = new Date("2026-10-17T03:38:28.900Z");
    const kepala = await kepalaPermintaan(KONFIG, "/checkout/v1/payment", BADAN, "req-2", waktu);

    const komponen = [
      `Client-Id:${KONFIG.clientId}`,
      "Request-Id:req-2",
      "Request-Timestamp:2026-10-17T03:38:28Z",
      "Request-Target:/checkout/v1/payment",
      `Digest:${createHash("sha256").update(BADAN).digest("base64")}`,
    ].join("\n");

    expect(kepala).toEqual({
      "Client-Id": KONFIG.clientId,
      "Request-Id": "req-2",
      "Request-Timestamp": "2026-10-17T03:38:28Z",
      Signature: `HMACSHA256=${createHmac("sha256", KONFIG.secretKey).update(komponen).digest("base64")}`,
    });
  });
});

describe("notifikasiSah", () => {
  async function kepalaDari(
    badan: string,
    clientId = KONFIG.clientId,
  ): Promise<KepalaNotifikasi> {
    const timestamp = "2026-10-17T04:00:00Z";
    const requestId = "notif-1";
    const signature = await tandaTangan(
      KONFIG.secretKey,
      stringKomponen({
        clientId,
        requestId,
        timestamp,
        target: JALUR_NOTIFIKASI,
        digest: await digestBadan(badan),
      }),
    );

    return { clientId, requestId, timestamp, signature };
  }

  it("menerima notifikasi yang ditandatangani dengan secret key yang sama", async () => {
    const kepala = await kepalaDari(BADAN);
    expect(await notifikasiSah(KONFIG, kepala, BADAN, JALUR_NOTIFIKASI)).toBe(true);
  });

  it("menolak kalau badannya diubah satu karakter saja", async () => {
    const kepala = await kepalaDari(BADAN);
    const diubah = BADAN.replace("58000", "58001");
    expect(await notifikasiSah(KONFIG, kepala, diubah, JALUR_NOTIFIKASI)).toBe(false);
  });

  it("menolak kalau ditandatangani untuk jalur lain", async () => {
    const kepala = await kepalaDari(BADAN);
    expect(await notifikasiSah(KONFIG, kepala, BADAN, "/api/webhooks/lain")).toBe(false);
  });

  it("menolak secret key yang berbeda", async () => {
    const kepala = await kepalaDari(BADAN);
    const lain = { ...KONFIG, secretKey: "SK-orang-lain" };
    expect(await notifikasiSah(lain, kepala, BADAN, JALUR_NOTIFIKASI)).toBe(false);
  });

  it("menolak Client-Id milik merchant lain walau tanda tangannya dibuat ulang", async () => {
    const kepala = await kepalaDari(BADAN, "BRN-9999-0000000000000");
    expect(await notifikasiSah(KONFIG, kepala, BADAN, JALUR_NOTIFIKASI)).toBe(false);
  });

  it("menolak kalau ada kepala yang hilang", async () => {
    for (const hilang of ["clientId", "requestId", "timestamp", "signature"] as const) {
      const kepala = await kepalaDari(BADAN);
      delete kepala[hilang];
      expect(await notifikasiSah(KONFIG, kepala, BADAN, JALUR_NOTIFIKASI), hilang).toBe(false);
    }
  });
});

describe("bacaKonfig", () => {
  it("kosong kalau salah satu kunci belum dipasang", () => {
    expect(bacaKonfig({})).toBeUndefined();
    expect(bacaKonfig({ DOKU_CLIENT_ID: "BRN-1" })).toBeUndefined();
    expect(bacaKonfig({ DOKU_CLIENT_ID: "BRN-1", DOKU_SECRET_KEY: "   " })).toBeUndefined();
  });

  it("sandbox kecuali DOKU_SANDBOX persis false, supaya salah ketik tidak menagih uang asli", () => {
    const dasar = { DOKU_CLIENT_ID: " BRN-1 ", DOKU_SECRET_KEY: " SK-1 " };

    expect(bacaKonfig(dasar)).toEqual({ clientId: "BRN-1", secretKey: "SK-1", sandbox: true });
    expect(bacaKonfig({ ...dasar, DOKU_SANDBOX: "False" })?.sandbox).toBe(true);
    expect(bacaKonfig({ ...dasar, DOKU_SANDBOX: "false" })?.sandbox).toBe(false);
  });

  it("alamat API ikut mode sandbox", () => {
    expect(dasarDoku({ ...KONFIG, sandbox: true })).toBe("https://api-sandbox.doku.com");
    expect(dasarDoku({ ...KONFIG, sandbox: false })).toBe("https://api.doku.com");
  });
});

describe("pembantu", () => {
  it("nomor HP jadi format 62 yang diminta DOKU", () => {
    expect(hpInternasional("0812-3456-7890")).toBe("6281234567890");
    expect(hpInternasional("+62 812 3456 7890")).toBe("6281234567890");
    expect(hpInternasional("6281234567890")).toBe("6281234567890");
  });

  it("batas bayar DOKU berakhir sebelum pesanan kedaluwarsa di toko", () => {
    const sekarang = new Date("2026-10-17T00:00:00Z");
    const enamJam = new Date("2026-10-17T06:00:00Z").toISOString();

    expect(menitBayar(enamJam, sekarang)).toBe(360 - CADANGAN_MENIT);
  });

  it("batas bayar minimal satu menit walau pesanan hampir habis", () => {
    const sekarang = new Date("2026-10-17T00:00:00Z");
    const duaMenit = new Date("2026-10-17T00:02:00Z").toISOString();

    expect(menitBayar(duaMenit, sekarang)).toBe(1);
  });

  it("nama metode yang terbaca manusia, dan kode mentah untuk metode yang tidak dikenal", () => {
    expect(namaMetode("VIRTUAL_ACCOUNT_BCA")).toBe("BCA Virtual Account");
    expect(namaMetode("VIRTUAL_ACCOUNT_BRI")).toBe("BRI Virtual Account");
    expect(namaMetode("ONLINE_TO_OFFLINE_ALFA")).toBe("Alfamart");
    expect(namaMetode("EMONEY_DANA")).toBe("DANA");
    expect(namaMetode("EMONEY_SHOPEE_PAY")).toBe("EMONEY_SHOPEE_PAY");
    expect(namaMetode(undefined)).toBeNull();
  });
});
