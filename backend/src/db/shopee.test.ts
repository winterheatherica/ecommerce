import { afterAll, beforeEach, describe, expect, it } from "vitest";

import type { Sql } from "../lib/db";
import { bacaMigrasi, bersihkan, koneksiTes, pecahUkuran } from "../test/db";
import { daftarProduk, satuProduk, satuProdukAdmin } from "./produk";
import { perbaruiVarian } from "./varian";

const sql: Sql = koneksiTes();
const KUCING = "bye-bye-cat-50g";
const LINK = "https://shopee.co.id/product/72015932/1";

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

async function isiShopee(slug: string, rating: number | null, jumlah: number | null) {
  await sql`
    update product_variants
    set shopee_url = ${LINK},
        shopee_rating = ${rating},
        shopee_rating_count = ${jumlah},
        shopee_rating_at = now()
    where slug = ${slug}
  `;
}

describe("rating Shopee di produk", () => {
  it("gabungannya rata-rata tertimbang dari ukuran yang aktif saja", async () => {
    await pecahUkuran(sql, KUCING, [
      ukuran("uji-50g", "50 g"),
      ukuran("uji-80g", "80 g"),
      ukuran("uji-220ml", "220 ml"),
    ]);
    await isiShopee("uji-50g", 4.9, 1000);
    await isiShopee("uji-80g", 4.5, 10);
    await isiShopee("uji-220ml", 1, 500);
    await sql`update product_variants set is_active = false where slug = 'uji-220ml'`;

    const produk = await satuProduk(sql, KUCING);

    expect(produk?.shopee_rating).toBe(4.9);
    expect(produk?.shopee_rating_count).toBe(1010);
    expect(
      produk?.variants.map((v) => [v.slug, v.shopee_rating, v.shopee_rating_count]),
    ).toEqual([
      ["uji-50g", 4.9, 1000],
      ["uji-80g", 4.5, 10],
    ]);
  });

  it("tanpa data Shopee bernilai null dan 0, dan listing tanpa penilaian tidak menggeser rata-rata", async () => {
    const polos = await satuProduk(sql, KUCING);
    expect(polos?.shopee_rating).toBeNull();
    expect(polos?.shopee_rating_count).toBe(0);

    await pecahUkuran(sql, KUCING, [ukuran("uji-50g", "50 g"), ukuran("uji-80g", "80 g")]);
    await isiShopee("uji-50g", 4.8, 20);
    await isiShopee("uji-80g", null, 0);

    const produk = await satuProduk(sql, KUCING);
    expect(produk?.shopee_rating).toBe(4.8);
    expect(produk?.shopee_rating_count).toBe(20);
  });

  it("ikut terbaca di katalog dan di admin", async () => {
    await isiShopee(KUCING, 4.79, 1814);

    const { data } = await daftarProduk(sql, { limit: 100, offset: 0 });
    const kucing = data.find((p) => p.slug === KUCING);
    expect(kucing?.shopee_rating).toBe(4.79);
    expect(kucing?.variants[0].shopee_url).toBe(LINK);

    const admin = await satuProdukAdmin(sql, KUCING);
    expect(admin?.shopee_rating_count).toBe(1814);
    expect(admin?.variants[0].shopee_rating_count).toBe(1814);
  });
});

describe("mengubah rating Shopee dari admin", () => {
  it("tanggal update terisi saat rating berubah, dan tidak bergeser saat kolom lain berubah", async () => {
    const link = await perbaruiVarian(sql, KUCING, { shopee_url: LINK });
    expect(link.ok && link.varian.shopee_rating_at).toBeNull();

    const ubah = await perbaruiVarian(sql, KUCING, { shopee_rating: 4.8, shopee_rating_count: 12 });
    expect(ubah.ok && ubah.varian.shopee_rating).toBe(4.8);
    expect(ubah.ok && ubah.varian.shopee_rating_at).not.toBeNull();

    const tanggal = ubah.ok ? ubah.varian.shopee_rating_at : "x";
    const harga = await perbaruiVarian(sql, KUCING, { price: 36000 });
    expect(harga.ok && harga.varian.shopee_rating_at).toEqual(tanggal);
  });

  it("database menolak penilaian tanpa rating dan link di luar shopee.co.id", async () => {
    expect(await perbaruiVarian(sql, KUCING, { shopee_rating_count: 5 })).toEqual({
      ok: false,
      alasan: "shopee_rating_inconsistent",
    });
    expect(await perbaruiVarian(sql, KUCING, { shopee_url: "https://contoh.com/x" })).toEqual({
      ok: false,
      alasan: "shopee_url_invalid",
    });
  });
});

describe("impor rating Shopee 19 Oktober", () => {
  it("terpasang lewat slug varian dan semua barisnya lolos aturan database", async () => {
    await sql.unsafe(bacaMigrasi("0031_isi_rating_shopee.sql")).simple();

    const [kucing] = await sql<{ rating: number; jumlah: number; url: string }[]>`
      select shopee_rating::float8 as rating, shopee_rating_count as jumlah, shopee_url as url
      from product_variants where slug = ${KUCING}
    `;
    expect(kucing).toEqual({
      rating: 4.79,
      jumlah: 1814,
      url: "https://shopee.co.id/product/72015932/2214610486",
    });

    const [hitung] = await sql<{ n: number }[]>`
      select count(*)::int as n from product_variants where shopee_url is not null
    `;
    expect(hitung.n).toBeGreaterThan(1);
  });
});

describe("aturan rating di database", () => {
  it("setiap kombinasi rating dan jumlah dinilai tegas, tidak ada yang lolos karena NULL", async () => {
    const kasus: [number | null, number | null, boolean][] = [
      [null, null, true],
      [null, 0, true],
      [4.5, 12, true],
      [null, 5, false],
      [4.5, null, false],
      [4.5, 0, false],
      [0.5, 3, false],
      [null, -1, false],
    ];

    for (const [rating, jumlah, boleh] of kasus) {
      const hasil = await sql`
        update product_variants
        set shopee_rating = ${rating}, shopee_rating_count = ${jumlah}
        where slug = ${KUCING}
      `.then(
        () => true,
        () => false,
      );
      expect(hasil, `rating ${rating}, jumlah ${jumlah}`).toBe(boleh);
    }
  });
});
