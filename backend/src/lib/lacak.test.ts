import { describe, expect, it } from "vitest";

import {
  MAKS_PERISTIWA,
  hpAkhir,
  kodeKurirLacak,
  perluDilacak,
  rapikanLacak,
  waktuWib,
} from "./lacak";
import type { LacakRO } from "./rajaongkir";

const SEKARANG = new Date("2026-10-21T10:00:00.000Z");

describe("kodeKurirLacak", () => {
  it("memetakan kode kurir pesanan ke kode RajaOngkir", () => {
    expect(kodeKurirLacak("JNE")).toBe("jne");
    expect(kodeKurirLacak("JNT")).toBe("jnt");
    expect(kodeKurirLacak("J&T")).toBe("jnt");
    expect(kodeKurirLacak(" sicepat ")).toBe("sicepat");
    expect(kodeKurirLacak("POS")).toBe("pos");
  });
});

describe("hpAkhir", () => {
  it("mengambil 5 digit terakhir, apa pun formatnya", () => {
    expect(hpAkhir("0821-1141-3740")).toBe("13740");
    expect(hpAkhir("+62 821 1141 3740")).toBe("13740");
    expect(hpAkhir("1234")).toBeNull();
  });
});

describe("waktuWib", () => {
  it("membaca tanggal dan jam kurir sebagai WIB", () => {
    expect(waktuWib("2026-10-21", "15:40")).toBe("2026-10-21T08:40:00.000Z");
    expect(waktuWib("2026-10-21", "15:40:30")).toBe("2026-10-21T08:40:30.000Z");
    expect(waktuWib("21-10-2026", "9.05")).toBe("2026-10-21T02:05:00.000Z");
  });

  it("jam boleh menempel di tanggal, dan tanpa jam dianggap tengah malam", () => {
    expect(waktuWib("2026-10-21 15:40:00", null)).toBe("2026-10-21T08:40:00.000Z");
    expect(waktuWib("2026-10-21", "")).toBe("2026-10-20T17:00:00.000Z");
  });

  it("mengembalikan null untuk tanggal yang tidak dikenal", () => {
    expect(waktuWib("", "10:00")).toBeNull();
    expect(waktuWib("kemarin", "10:00")).toBeNull();
    expect(waktuWib("2026-13-40", "10:00")).toBeNull();
    expect(waktuWib(null, null)).toBeNull();
  });
});

const DALAM_PERJALANAN: LacakRO = {
  delivered: false,
  summary: { status: "ON PROCESS" },
  delivery_status: { status: "ON PROCESS", pod_receiver: "", pod_date: "", pod_time: "" },
  manifest: [
    {
      manifest_description: "SHIPMENT RECEIVED AT [DEPOK]",
      manifest_date: "2026-10-20",
      manifest_time: "12:10",
      city_name: "DEPOK",
    },
    {
      manifest_description: "RECEIVED AT [JAKARTA, SMART POINT CIPAYUNG]",
      manifest_date: "2026-10-21",
      manifest_time: "03:43",
      city_name: "JAKARTA",
    },
    {
      manifest_description: "  PROCESSED AT   SORTING CENTER [DEPOK]  ",
      manifest_date: "2026-10-20",
      manifest_time: "17:20",
      city_name: " ",
    },
  ],
};

describe("rapikanLacak", () => {
  it("mengurutkan riwayat dari yang terbaru dan merapikan spasi", () => {
    const hasil = rapikanLacak(DALAM_PERJALANAN, SEKARANG);

    expect(hasil.events.map((e) => e.description)).toEqual([
      "RECEIVED AT [JAKARTA, SMART POINT CIPAYUNG]",
      "PROCESSED AT SORTING CENTER [DEPOK]",
      "SHIPMENT RECEIVED AT [DEPOK]",
    ]);
    expect(hasil.events[1].city).toBeNull();
    expect(hasil).toMatchObject({
      delivered: false,
      receiver: null,
      delivered_at: null,
      status: "ON PROCESS",
      fetched_at: SEKARANG.toISOString(),
    });
  });

  it("paket sampai: penerima dan jam terima diambil dari bukti terima kurir", () => {
    const hasil = rapikanLacak(
      {
        ...DALAM_PERJALANAN,
        delivered: true,
        delivery_status: {
          status: "DELIVERED",
          pod_receiver: " RAFII ANINDITO ",
          pod_date: "2026-10-21",
          pod_time: "15:40",
        },
      },
      SEKARANG,
    );

    expect(hasil.delivered).toBe(true);
    expect(hasil.receiver).toBe("RAFII ANINDITO");
    expect(hasil.delivered_at).toBe("2026-10-21T08:40:00.000Z");
  });

  it("kalau jam terima kosong, dipakai jam riwayat terbaru", () => {
    const hasil = rapikanLacak(
      { ...DALAM_PERJALANAN, delivered: "true", delivery_status: { status: "DELIVERED" } },
      SEKARANG,
    );

    expect(hasil.delivered).toBe(true);
    expect(hasil.receiver).toBeNull();
    expect(hasil.delivered_at).toBe("2026-10-20T20:43:00.000Z");
  });

  it("status DELIVERED tetap dianggap sampai walau flag delivered kosong", () => {
    const hasil = rapikanLacak(
      { manifest: [], delivery_status: { status: "delivered", pod_receiver: "SATPAM" } },
      SEKARANG,
    );

    expect(hasil.delivered).toBe(true);
    expect(hasil.receiver).toBe("SATPAM");
    expect(hasil.delivered_at).toBeNull();
  });

  it("tahan terhadap data kosong, keterangan kosong, dan riwayat yang terlalu panjang", () => {
    expect(rapikanLacak({}, SEKARANG)).toEqual({
      delivered: false,
      receiver: null,
      delivered_at: null,
      status: null,
      events: [],
      fetched_at: SEKARANG.toISOString(),
    });

    const banyak = Array.from({ length: MAKS_PERISTIWA + 10 }, (_, i) => ({
      manifest_description: i === 0 ? " " : `SCAN ${i}`,
      manifest_date: "2026-10-20",
      manifest_time: `${String(Math.floor(i / 60)).padStart(2, "0")}:${String(i % 60).padStart(2, "0")}`,
      city_name: "DEPOK",
    }));
    const hasil = rapikanLacak({ manifest: banyak }, SEKARANG);

    expect(hasil.events).toHaveLength(MAKS_PERISTIWA);
    expect(hasil.events[0].description).toBe(`SCAN ${MAKS_PERISTIWA + 9}`);
    expect(hasil.events.some((e) => e.description === "")).toBe(false);
  });
});

describe("perluDilacak", () => {
  const dasar = {
    status: "SHIPPED",
    tracking_number: "300380022869426",
    delivered_at: null,
    tracking_checked_at: null,
  };

  it("hanya pesanan dikirim yang punya resi dan belum sampai", () => {
    expect(perluDilacak(dasar, 3, SEKARANG)).toBe(true);
    expect(perluDilacak({ ...dasar, status: "PAID" }, 3, SEKARANG)).toBe(false);
    expect(perluDilacak({ ...dasar, status: "DELIVERED" }, 3, SEKARANG)).toBe(false);
    expect(perluDilacak({ ...dasar, tracking_number: null }, 3, SEKARANG)).toBe(false);
    expect(perluDilacak({ ...dasar, delivered_at: "2026-10-21T08:40:00.000Z" }, 3, SEKARANG)).toBe(false);
  });

  it("menunggu jeda sejak pengecekan terakhir", () => {
    expect(perluDilacak({ ...dasar, tracking_checked_at: "2026-10-21T07:30:00.000Z" }, 3, SEKARANG)).toBe(false);
    expect(perluDilacak({ ...dasar, tracking_checked_at: "2026-10-21T07:00:00.000Z" }, 3, SEKARANG)).toBe(true);
  });
});
