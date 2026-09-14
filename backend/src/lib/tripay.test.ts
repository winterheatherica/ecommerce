import { describe, expect, it } from "vitest";

import {
  bacaKonfig,
  bentukFormulir,
  dasarTripay,
  hmacHex,
  samaAman,
  tandaTanganTransaksi,
  type KonfigTripay,
} from "./tripay";

const CONTOH_DOKUMEN = {
  privateKey: "ytf6ooi2gmlNPfpchd94jDOk8hRWOu",
  merchantCode: "T0001",
  merchantRef: "INV55567",
  amount: 1500000,
  hasil: "9f167eba844d1fcb369404e2bda53702e2f78f7aa12e91da6715414e65b8c86a",
};

function konfig(ubah: Partial<KonfigTripay> = {}): KonfigTripay {
  return {
    apiKey: "api-uji",
    privateKey: CONTOH_DOKUMEN.privateKey,
    merchantCode: CONTOH_DOKUMEN.merchantCode,
    sandbox: true,
    ...ubah,
  };
}

describe("tandaTanganTransaksi", () => {
  it("cocok dengan contoh resmi di dokumentasi Tripay", async () => {
    const tanda = await tandaTanganTransaksi(
      konfig(),
      CONTOH_DOKUMEN.merchantRef,
      CONTOH_DOKUMEN.amount,
    );

    expect(tanda).toBe(CONTOH_DOKUMEN.hasil);
  });

  it("berubah kalau nominalnya berubah", async () => {
    const a = await tandaTanganTransaksi(konfig(), "INV1", 10000);
    const b = await tandaTanganTransaksi(konfig(), "INV1", 10001);

    expect(a).not.toBe(b);
  });

  it("berubah kalau nomor pesanannya berubah", async () => {
    const a = await tandaTanganTransaksi(konfig(), "INV1", 10000);
    const b = await tandaTanganTransaksi(konfig(), "INV2", 10000);

    expect(a).not.toBe(b);
  });

  it("berubah kalau private key-nya berbeda", async () => {
    const a = await tandaTanganTransaksi(konfig(), "INV1", 10000);
    const b = await tandaTanganTransaksi(
      konfig({ privateKey: "kunci-lain" }),
      "INV1",
      10000,
    );

    expect(a).not.toBe(b);
  });

  it("selalu 64 karakter heksadesimal", async () => {
    const tanda = await hmacHex("kunci", "pesan apa saja");

    expect(tanda).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("bacaKonfig", () => {
  const lengkap = {
    TRIPAY_API_KEY: "a",
    TRIPAY_PRIVATE_KEY: "b",
    TRIPAY_MERCHANT_CODE: "c",
  };

  it("membaca tiga kredensial yang dibutuhkan", () => {
    const k = bacaKonfig(lengkap);

    expect(k).toBeDefined();
    expect(k?.apiKey).toBe("a");
    expect(k?.privateKey).toBe("b");
    expect(k?.merchantCode).toBe("c");
  });

  it("default ke sandbox supaya uang sungguhan tidak tersentuh tanpa sengaja", () => {
    expect(bacaKonfig(lengkap)?.sandbox).toBe(true);
  });

  it("hanya keluar dari sandbox kalau ditulis persis 'false'", () => {
    expect(bacaKonfig({ ...lengkap, TRIPAY_SANDBOX: "false" })?.sandbox).toBe(
      false,
    );
    expect(bacaKonfig({ ...lengkap, TRIPAY_SANDBOX: "true" })?.sandbox).toBe(
      true,
    );
    expect(bacaKonfig({ ...lengkap, TRIPAY_SANDBOX: "0" })?.sandbox).toBe(true);
  });

  it("membuang spasi dan baris baru yang ikut tertempel", () => {
    const k = bacaKonfig({
      TRIPAY_API_KEY: "  a  ",
      TRIPAY_PRIVATE_KEY: "b\n",
      TRIPAY_MERCHANT_CODE: " T39114 ",
    });

    expect(k?.apiKey).toBe("a");
    expect(k?.privateKey).toBe("b");
    expect(k?.merchantCode).toBe("T39114");
  });

  it("undefined kalau ada kredensial yang hilang atau kosong", () => {
    expect(bacaKonfig({})).toBeUndefined();
    expect(bacaKonfig({ TRIPAY_API_KEY: "a" })).toBeUndefined();
    expect(bacaKonfig({ ...lengkap, TRIPAY_PRIVATE_KEY: "" })).toBeUndefined();
  });
});

describe("dasarTripay", () => {
  it("memisahkan alamat sandbox dan produksi", () => {
    expect(dasarTripay(konfig({ sandbox: true }))).toContain("api-sandbox");
    expect(dasarTripay(konfig({ sandbox: false }))).not.toContain("sandbox");
  });
});

describe("samaAman", () => {
  it("benar untuk teks yang sama", () => {
    expect(samaAman("abc123", "abc123")).toBe(true);
  });

  it("salah untuk teks berbeda atau panjang berbeda", () => {
    expect(samaAman("abc123", "abc124")).toBe(false);
    expect(samaAman("abc", "abcd")).toBe(false);
    expect(samaAman("", "a")).toBe(false);
  });
});

describe("bentukFormulir", () => {
  it("meratakan order_items jadi kunci bersarang", () => {
    const form = bentukFormulir({ method: "QRIS", amount: 68000 }, [
      { sku: "bye-bye-cat-50g", name: "Bye Bye Cat", price: 49000, quantity: 1 },
    ]);

    expect(form.get("method")).toBe("QRIS");
    expect(form.get("amount")).toBe("68000");
    expect(form.get("order_items[0][sku]")).toBe("bye-bye-cat-50g");
    expect(form.get("order_items[0][price]")).toBe("49000");
    expect(form.get("order_items[0][quantity]")).toBe("1");
  });

  it("memberi indeks berurutan untuk beberapa item", () => {
    const form = bentukFormulir({}, [
      { sku: "a", name: "A", price: 1000, quantity: 1 },
      { sku: "b", name: "B", price: 2000, quantity: 3 },
    ]);

    expect(form.get("order_items[1][sku]")).toBe("b");
    expect(form.get("order_items[1][quantity]")).toBe("3");
    expect(form.get("order_items[2][sku]")).toBeNull();
  });
});
