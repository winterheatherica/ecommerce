import { afterAll, beforeEach, describe, expect, it } from "vitest";

import type { Sql } from "../lib/db";
import { periksaUlasanShopee } from "../lib/ulasan";
import { bacaMigrasi, bersihkan, koneksiTes, pecahUkuran } from "../test/db";
import { satuProduk, satuProdukAdmin } from "./produk";
import { tambahUlasanShopee, ubahTampilUlasan } from "./ulasan";

const sql: Sql = koneksiTes();
const KUCING = "bye-bye-cat-50g";

beforeEach(async () => {
  await bersihkan(sql);
});

afterAll(async () => {
  await sql.end();
});

const ukuran = (slug: string, label: string) => ({
  slug,
  label,
  price: 35000,
  weight_g: 50,
  stock: 5,
});

async function ulasan(slug: string, nama: string, tanggal: string, teks = "Mantap") {
  const periksa = periksaUlasanShopee({
    rating: 5,
    author_name: nama,
    body: teks,
    reviewed_at: tanggal,
  });
  if (!periksa.ok) throw new Error("data uji tidak lolos");
  const hasil = await tambahUlasanShopee(sql, slug, periksa.bersih);
  if (!hasil) throw new Error("varian uji tidak ada");
  return hasil;
}

describe("ulasan di halaman produk", () => {
  it("menampilkan ulasan semua ukuran aktif, terbaru dulu, lengkap dengan label ukurannya", async () => {
    await pecahUkuran(sql, KUCING, [
      ukuran("uji-50g", "50 g"),
      ukuran("uji-80g", "80 g"),
      ukuran("uji-mati", "220 ml"),
    ]);
    await sql`update product_variants set is_active = false where slug = 'uji-mati'`;

    await ulasan("uji-50g", "pertama", "2026-09-01");
    await ulasan("uji-80g", "kedua", "2026-10-01");
    await ulasan("uji-mati", "ketiga", "2026-10-05");

    const produk = await satuProduk(sql, KUCING);

    expect(produk?.reviews.map((r) => [r.author_name, r.variant_label, r.source])).toEqual([
      ["k*****a", "80 g", "shopee"],
      ["p*****a", "50 g", "shopee"],
    ]);
  });

  it("ulasan yang disembunyikan admin hilang dari toko tapi tetap terlihat di admin", async () => {
    const a = await ulasan(KUCING, "tampil", "2026-09-01");
    const b = await ulasan(KUCING, "sembunyi", "2026-09-02");

    const disembunyikan = await ubahTampilUlasan(sql, b.id, true);
    expect(disembunyikan?.is_hidden).toBe(true);

    const toko = await satuProduk(sql, KUCING);
    expect(toko?.reviews.map((r) => r.id)).toEqual([a.id]);

    const admin = await satuProdukAdmin(sql, KUCING);
    expect(admin?.reviews?.map((r) => [r.id, r.is_hidden])).toEqual([
      [b.id, true],
      [a.id, false],
    ]);
  });

  it("varian yang tidak ada ditolak, dan ulasan Shopee tanpa teks ditolak database", async () => {
    const periksa = periksaUlasanShopee({
      rating: 4,
      author_name: "x",
      body: "ok",
      reviewed_at: "2026-09-01",
    });
    expect(periksa.ok && (await tambahUlasanShopee(sql, "tidak-ada", periksa.bersih))).toBeUndefined();

    const kosong = await sql`
      insert into reviews (variant_id, source, rating, author_name, reviewed_at)
      select id, 'shopee', 5, 'a*****b', now() from product_variants where slug = ${KUCING}
    `.then(
      () => true,
      () => false,
    );
    expect(kosong).toBe(false);
  });
});

describe("impor ulasan Shopee 19 Oktober", () => {
  it("masuk lewat slug varian dan tidak dobel kalau dijalankan dua kali", async () => {
    const impor = bacaMigrasi("0033_isi_ulasan_shopee.sql");
    await sql.unsafe(impor).simple();
    await sql.unsafe(impor).simple();

    const baris = await sql<{ n: number; unik: number; berteks: number }[]>`
      select count(*)::int as n,
        count(distinct external_id)::int as unik,
        count(*) filter (where body is not null or follow_up is not null)::int as berteks
      from reviews
    `;
    expect(baris[0].n).toBeGreaterThan(0);
    expect(baris[0].n).toBe(baris[0].unik);
    expect(baris[0].berteks).toBe(baris[0].n);

    const produk = await satuProduk(sql, KUCING);
    expect(produk?.reviews.length).toBeGreaterThan(0);
    expect(produk?.reviews.every((r) => r.author_name.includes("*"))).toBe(true);
  });
});
