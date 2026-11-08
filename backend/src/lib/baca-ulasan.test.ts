import { afterEach, describe, expect, it, vi } from "vitest";

import {
  MODEL_BACA_ULASAN,
  bacaScreenshotUlasan,
  bacaTanggal,
  keBase64,
  periksaScreenshot,
  rapikanHasil,
  rapikanProduk,
  type PemanggilAi,
} from "./baca-ulasan";

const SEKARANG = new Date("2026-11-08T06:00:00.000Z");

afterEach(() => {
  vi.restoreAllMocks();
});

describe("bacaTanggal", () => {
  it("format Shopee hari-bulan-tahun jam:menit dibaca sebagai WIB", () => {
    expect(bacaTanggal("05-11-2026 15:34", null, null, SEKARANG)).toEqual({
      tanggal: "2026-11-05T08:34:00.000Z",
      presisi: "day",
    });
  });

  it("format TikTok nama bulan Indonesia, jam dianggap tengah hari WIB", () => {
    expect(bacaTanggal("Oktober 5, 2026", null, null, SEKARANG)).toEqual({
      tanggal: "2026-10-05T05:00:00.000Z",
      presisi: "day",
    });
    expect(bacaTanggal("Mei 29, 2026", null, null, SEKARANG).tanggal).toBe("2026-05-29T05:00:00.000Z");
    expect(bacaTanggal("5 Okt 2026", null, "09:15", SEKARANG).tanggal).toBe("2026-10-05T02:15:00.000Z");
  });

  it("tanggal tidak masuk akal ditolak, lalu memakai tanggal versi model kalau ada", () => {
    expect(bacaTanggal("31-02-2026", null, null, SEKARANG).tanggal).toBeNull();
    expect(bacaTanggal("31-02-2026", "2026-02-28", null, SEKARANG).tanggal).toBe("2026-02-28T05:00:00.000Z");
  });

  it("waktu relatif memakai tanggal hasil model; minggu dan bulan dianggap perkiraan", () => {
    expect(bacaTanggal("3 hari lalu", "2026-11-05", null, SEKARANG)).toEqual({
      tanggal: "2026-11-05T05:00:00.000Z",
      presisi: "day",
    });
    expect(bacaTanggal("2 minggu lalu", "2026-10-25", null, SEKARANG).presisi).toBe("month");
  });

  it("tanggal di masa depan dibuang", () => {
    expect(bacaTanggal("20-12-2026", null, null, SEKARANG).tanggal).toBeNull();
  });
});

describe("rapikanHasil", () => {
  it("merapikan nama, teks kosong, produk terpotong, dan tanggal", () => {
    const hasil = rapikanHasil(
      {
        reviews: [
          {
            author: "  bp.siburian17 ",
            rating: 4,
            text: "  ",
            date_text: "05-11-2026 15:34",
            date_iso: "2026-11-05",
            time: "15:34",
            product: "Alat pengusir kucing Bye Bye Cat 50g untuk ceg...",
            complete: true,
          },
          {
            author: "Fina Lubis",
            rating: 4,
            text: "Packing rapi tp ternyata kecil ya sizenya, semoga ampuh",
            date_text: "Mei 29, 2026",
            date_iso: "2026-05-29",
            time: null,
            product: "Gel Pengusir dan Training Kucing Kemasan 50gr",
            complete: true,
          },
        ],
      },
      SEKARANG,
    );

    expect(hasil).toEqual([
      {
        nama: "bp.siburian17",
        bintang: 4,
        teks: null,
        tanggal: "2026-11-05T08:34:00.000Z",
        presisi: "day",
        produk: "Alat pengusir kucing Bye Bye Cat 50g untuk ceg",
        utuh: true,
      },
      {
        nama: "Fina Lubis",
        bintang: 4,
        teks: "Packing rapi tp ternyata kecil ya sizenya, semoga ampuh",
        tanggal: "2026-05-29T05:00:00.000Z",
        presisi: "day",
        produk: "Gel Pengusir dan Training Kucing Kemasan 50gr",
        utuh: true,
      },
    ]);
  });

  it("kartu terpotong, bintang tidak sah, atau tanpa tanggal ditandai tidak utuh", () => {
    const hasil = rapikanHasil(
      {
        reviews: [
          { author: "manualproject", rating: 4, text: null, date_text: null, date_iso: null, time: null, product: null, complete: false },
          { author: "x", rating: 9, text: null, date_text: "05-11-2026", date_iso: null, time: null, product: null, complete: true },
          { author: "y", rating: 5, text: null, date_text: null, date_iso: null, time: null, product: null, complete: true },
        ],
      },
      SEKARANG,
    );

    expect(hasil?.map((u) => u.utuh)).toEqual([false, false, false]);
    expect(hasil?.[1].bintang).toBe(5);
  });

  it("bukan daftar ulasan berarti tidak terbaca", () => {
    expect(rapikanHasil({ halo: 1 }, SEKARANG)).toBeNull();
    expect(rapikanHasil(null, SEKARANG)).toBeNull();
  });

  it("elipsis di ujung nama produk dibuang, nama kosong jadi null", () => {
    expect(rapikanProduk("Cicago Gel Pengusir Cicak 70g - Natural Lizard Repellent Gel …")).toBe(
      "Cicago Gel Pengusir Cicak 70g - Natural Lizard Repellent Gel",
    );
    expect(rapikanProduk("   ")).toBeNull();
  });
});

describe("bacaScreenshotUlasan", () => {
  const gambar = { base64: "AAAA", mime: "image/png" };

  function aiPalsu(jawab: () => unknown): PemanggilAi & { masukan: Record<string, unknown>[] } {
    const masukan: Record<string, unknown>[] = [];
    return {
      masukan,
      async run(model, input) {
        masukan.push({ model, ...input });
        return jawab();
      },
    };
  }

  it("memanggil model Qwen tanpa mode berpikir dan membaca jawaban format chat", async () => {
    const ai = aiPalsu(() => ({
      choices: [
        {
          message: {
            content: JSON.stringify({
              reviews: [
                { author: "refina", rating: 5, text: null, date_text: "Juli 20, 2026", date_iso: "2026-07-20", time: null, product: "Cicago Gel", complete: true },
              ],
            }),
          },
        },
      ],
    }));

    const hasil = await bacaScreenshotUlasan(ai, gambar, SEKARANG);

    expect(hasil).toEqual({
      ok: true,
      ulasan: [
        { nama: "refina", bintang: 5, teks: null, tanggal: "2026-07-20T05:00:00.000Z", presisi: "day", produk: "Cicago Gel", utuh: true },
      ],
    });
    expect(ai.masukan[0]).toMatchObject({
      model: MODEL_BACA_ULASAN,
      chat_template_kwargs: { enable_thinking: false },
      temperature: 0,
    });
    expect(JSON.stringify(ai.masukan[0])).toContain("data:image/png;base64,AAAA");
    expect(JSON.stringify(ai.masukan[0])).toContain("Today is 2026-11-08");
  });

  it("jatah harian habis dilaporkan sebagai kuota", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const ai = aiPalsu(() => {
      throw new Error("4006: you have used up your daily free allocation of 10,000 neurons");
    });

    expect(await bacaScreenshotUlasan(ai, gambar, SEKARANG)).toMatchObject({ ok: false, alasan: "kuota" });
  });

  it("jawaban yang bukan JSON dilaporkan tidak terbaca", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const ai = aiPalsu(() => ({ choices: [{ message: { content: "maaf, tidak bisa" } }] }));

    expect(await bacaScreenshotUlasan(ai, gambar, SEKARANG)).toMatchObject({ ok: false, alasan: "tidak_terbaca" });
  });
});

describe("periksaScreenshot dan keBase64", () => {
  const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);

  it("menerima PNG dan menolak berkas yang bukan gambar", async () => {
    expect(await periksaScreenshot(new Blob([png]))).toEqual({ ok: true, mime: "image/png" });
    expect(await periksaScreenshot(new Blob(["halo dunia, ini teks"]))).toMatchObject({ ok: false });
    expect(await periksaScreenshot(new Blob([]))).toMatchObject({ ok: false });
  });

  it("base64 bisa dibalik ke byte aslinya", () => {
    const bait = new Uint8Array(70000).map((_, i) => i % 256);
    const balik = Uint8Array.from(atob(keBase64(bait)), (c) => c.charCodeAt(0));
    expect(balik).toEqual(bait);
  });
});
