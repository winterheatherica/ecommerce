import { afterAll, beforeEach, describe, expect, it } from "vitest";

import type { Sql } from "../lib/db";
import { bersihkan, koneksiTes } from "../test/db";
import { perbaruiVarian, tambahVarian } from "./varian";

const sql: Sql = koneksiTes();
const KUCING = "bye-bye-cat-50g";

beforeEach(async () => {
  await bersihkan(sql);
});

afterAll(async () => {
  await sql.end();
});

function ukuran(slug: string, sku: string | null = null) {
  return {
    slug,
    sku,
    label: "120 g",
    price: 79000,
    weight_g: 120,
    stock: 5,
    sort_order: null,
  };
}

async function jumlahVarian(): Promise<number> {
  const [r] = await sql<{ n: number }[]>`select count(*)::int as n from product_variants`;
  return r.n;
}

describe("SKU varian", () => {
  it("setiap varian hasil fixture sudah punya SKU tiga digit yang unik", async () => {
    const baris = await sql<{ sku: string }[]>`select sku from product_variants`;
    const unik = new Set(baris.map((b) => b.sku));

    expect(baris.length).toBeGreaterThan(0);
    expect(unik.size).toBe(baris.length);
    for (const b of baris) expect(b.sku).toMatch(/^\d{3}$/);
  });

  it("varian baru tanpa SKU dapat nomor berikutnya", async () => {
    const sebelum = await jumlahVarian();
    const hasil = await tambahVarian(sql, KUCING, ukuran("kucing-120g"));

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(hasil.varian.sku).toBe(String(sebelum + 1).padStart(3, "0"));
  });

  it("SKU yang diisi manual dipakai apa adanya dan tidak memakan nomor otomatis", async () => {
    const sebelum = await jumlahVarian();

    const manual = await tambahVarian(sql, KUCING, ukuran("kucing-120g", "GOCAT-120"));
    const otomatis = await tambahVarian(sql, KUCING, ukuran("kucing-200g"));

    expect(manual.ok && manual.varian.sku).toBe("GOCAT-120");
    expect(otomatis.ok && otomatis.varian.sku).toBe(
      String(sebelum + 1).padStart(3, "0"),
    );
  });

  it("menolak SKU kembar saat menambah, dan membedakannya dari slug kembar", async () => {
    await tambahVarian(sql, KUCING, ukuran("kucing-120g", "GOCAT-120"));

    const skuKembar = await tambahVarian(sql, KUCING, ukuran("kucing-200g", "GOCAT-120"));
    const slugKembar = await tambahVarian(sql, KUCING, ukuran("kucing-120g", "GOCAT-999"));

    expect(skuKembar).toEqual({ ok: false, alasan: "sku_taken" });
    expect(slugKembar).toEqual({ ok: false, alasan: "slug_taken" });
  });

  it("menolak mengganti SKU menjadi milik varian lain", async () => {
    await tambahVarian(sql, KUCING, ukuran("kucing-120g", "GOCAT-120"));

    const hasil = await perbaruiVarian(sql, KUCING, { sku: "GOCAT-120" });

    expect(hasil).toEqual({ ok: false, alasan: "sku_taken" });
  });

  it("mengganti SKU sendiri berhasil", async () => {
    const hasil = await perbaruiVarian(sql, KUCING, { sku: "GOCAT-50" });

    expect(hasil.ok && hasil.varian.sku).toBe("GOCAT-50");
  });

  it("melapor tidak ditemukan untuk varian yang tidak ada", async () => {
    const hasil = await perbaruiVarian(sql, "tidak-ada", { stock: 1 });

    expect(hasil).toEqual({ ok: false, alasan: "not_found" });
  });

  it("melapor tidak ditemukan saat menambah ke produk yang tidak ada", async () => {
    const hasil = await tambahVarian(sql, "tidak-ada", ukuran("apa-saja"));

    expect(hasil).toEqual({ ok: false, alasan: "not_found" });
  });
});
