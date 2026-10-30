import { createHash } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  UKURAN_FOTO_MAKS,
  bacaKonfigCloudinary,
  jenisFoto,
  periksaBerkas,
  tandaTangan,
  teksTandaTangan,
  unggahFoto,
} from "./cloudinary";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const JPEG = [0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46, 0x49, 0x46, 0, 1];
const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0x0d];
const WEBP = [...Buffer.from("RIFF"), 0x24, 0, 0, 0, ...Buffer.from("WEBP")];
const GIF = [...Buffer.from("GIF89a"), 0, 0, 0, 0, 0, 0];

const berkas = (kepala: number[], jenis = "image/jpeg", sisa = 64) =>
  new File([new Uint8Array([...kepala, ...new Array(sisa).fill(0)])], "foto", { type: jenis });

const KONFIG = { awan: "awan-uji", kunci: "123456", rahasia: "rahasia-uji" };

describe("bacaKonfigCloudinary", () => {
  it("aktif hanya kalau nama cloud, API key, dan secret terpasang semua", () => {
    expect(
      bacaKonfigCloudinary({
        CLOUDINARY_CLOUD_NAME: " dokzc5ogk ",
        CLOUDINARY_API_KEY: "123",
        CLOUDINARY_API_SECRET: "abc",
      }),
    ).toEqual({ awan: "dokzc5ogk", kunci: "123", rahasia: "abc" });
    expect(bacaKonfigCloudinary({ CLOUDINARY_CLOUD_NAME: "dokzc5ogk", CLOUDINARY_API_KEY: "123" })).toBeNull();
    expect(
      bacaKonfigCloudinary({
        CLOUDINARY_CLOUD_NAME: "dokzc5ogk",
        CLOUDINARY_API_KEY: "123",
        CLOUDINARY_API_SECRET: "  ",
      }),
    ).toBeNull();
  });
});

describe("tanda tangan Cloudinary", () => {
  it("mengurutkan parameter sesuai abjad", () => {
    expect(teksTandaTangan({ timestamp: "1", public_id: "a", eager: "b" })).toBe(
      "eager=b&public_id=a&timestamp=1",
    );
  });

  it("cocok dengan contoh di dokumentasi Cloudinary", async () => {
    const hasil = await tandaTangan(
      { timestamp: "1315060510", public_id: "sample_image", eager: "w_400,h_300,c_pad|w_260,h_200,c_crop" },
      "abcd",
    );

    expect(hasil).toBe("bfd09f95f331f558cbd1320e67aa8d488770583e");
  });

  it("sama dengan SHA-1 dari Node", async () => {
    const param = { public_id: "menik-store/produk/uji", timestamp: "1730000000" };

    expect(await tandaTangan(param, "rahasia")).toBe(
      createHash("sha1").update(`${teksTandaTangan(param)}rahasia`).digest("hex"),
    );
  });
});

describe("jenisFoto", () => {
  it("mengenali JPG, PNG, dan WebP dari isi berkas", () => {
    expect(jenisFoto(new Uint8Array(JPEG))).toBe("image/jpeg");
    expect(jenisFoto(new Uint8Array(PNG))).toBe("image/png");
    expect(jenisFoto(new Uint8Array(WEBP))).toBe("image/webp");
  });

  it("menolak format lain", () => {
    expect(jenisFoto(new Uint8Array(GIF))).toBeNull();
    expect(jenisFoto(new TextEncoder().encode("<svg xmlns="))).toBeNull();
    expect(jenisFoto(new Uint8Array())).toBeNull();
  });
});

describe("periksaBerkas", () => {
  it("menerima foto berdasarkan isinya, bukan tipe yang diklaim browser", async () => {
    expect(await periksaBerkas(berkas(PNG, "application/octet-stream"))).toBeNull();
    expect(await periksaBerkas(berkas(WEBP, ""))).toBeNull();
  });

  it("menolak berkas yang mengaku JPG padahal bukan", async () => {
    expect(await periksaBerkas(berkas([...Buffer.from("<html>bukan foto")], "image/jpeg"))).toBe(
      "Foto harus berformat JPG, PNG, atau WebP",
    );
  });

  it("menolak berkas kosong dan yang lebih dari 10 MB", async () => {
    expect(await periksaBerkas(new File([], "kosong", { type: "image/jpeg" }))).toBe("File foto kosong");
    expect(await periksaBerkas(berkas(JPEG, "image/jpeg", UKURAN_FOTO_MAKS))).toBe(
      "Ukuran foto maksimal 10 MB",
    );
  });
});

describe("unggahFoto", () => {
  it("mengirim berkas bertanda tangan ke folder produk dengan nama acak", async () => {
    const tangkap = vi.fn(async (_url: string, init: RequestInit) => {
      const form = init.body as FormData;

      return new Response(
        JSON.stringify({ public_id: form.get("public_id"), version: 1730000000, width: 800, height: 600 }),
        { status: 200 },
      );
    });
    vi.stubGlobal("fetch", tangkap);

    const hasil = await unggahFoto(KONFIG, berkas(JPEG));

    const [url, init] = tangkap.mock.calls[0];
    const form = init.body as FormData;
    const publicId = String(form.get("public_id"));
    const timestamp = String(form.get("timestamp"));

    expect(url).toBe("https://api.cloudinary.com/v1_1/awan-uji/image/upload");
    expect(publicId).toMatch(/^menik-store\/produk\/[0-9a-f-]{36}$/);
    expect(form.get("api_key")).toBe("123456");
    expect(form.get("signature")).toBe(
      await tandaTangan({ public_id: publicId, timestamp }, KONFIG.rahasia),
    );
    expect([...form.keys()]).not.toContain("api_secret");
    expect(JSON.stringify([...form.entries()].filter(([, v]) => typeof v === "string"))).not.toContain(
      KONFIG.rahasia,
    );
    expect(hasil).toEqual({
      ok: true,
      foto: { cloudinary_id: publicId, version: 1730000000, width: 800, height: 600 },
    });
  });

  it("meneruskan pesan galat dari Cloudinary", async () => {
    vi.stubGlobal("fetch", vi.fn(async () =>
      new Response(JSON.stringify({ error: { message: "Invalid Signature" } }), { status: 401 }),
    ));

    expect(await unggahFoto(KONFIG, berkas(JPEG))).toEqual({ ok: false, pesan: "Invalid Signature" });
  });

  it("menolak jawaban yang menaruh foto di luar folder produk", async () => {
    vi.stubGlobal("fetch", vi.fn(async () =>
      new Response(JSON.stringify({ public_id: "folder-lain/uji", version: 1 }), { status: 200 }),
    ));

    const hasil = await unggahFoto(KONFIG, berkas(JPEG));

    expect(hasil.ok).toBe(false);
  });
});
