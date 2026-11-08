import { afterAll, beforeEach, describe, expect, it } from "vitest";

import type { Sql } from "../lib/db";
import { bersihkan, koneksiTes, pecahUkuran } from "../test/db";
import { daftarProduk, satuProduk, satuProdukAdmin } from "./produk";
import { perbaruiVarian } from "./varian";

const sql: Sql = koneksiTes();
const KUCING = "bye-bye-cat-50g";
const LINK = "https://shopee.co.id/product/72015932/1";
const SALIN_SHOPEE = "2026-10-19T14:00:00+07:00";
const SALIN_TOKOPEDIA = "2026-10-27T05:40:00+07:00";

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

async function salinan(
  slug: string,
  shopee: [number, number] | null,
  tokopedia: [number, number] | null,
) {
  await sql`
    update product_variants
    set shopee_rating = ${shopee?.[0] ?? null},
        shopee_rating_count = ${shopee?.[1] ?? null},
        shopee_rating_at = ${shopee ? SALIN_SHOPEE : null}::timestamptz,
        tokopedia_rating = ${tokopedia?.[0] ?? null},
        tokopedia_rating_count = ${tokopedia?.[1] ?? null},
        tokopedia_rating_at = ${tokopedia ? SALIN_TOKOPEDIA : null}::timestamptz
    where slug = ${slug}
  `;
}

async function ulasan(
  slug: string,
  sumber: "shopee" | "tokopedia",
  bintang: number,
  tanggal: string,
  opsi: { presisi?: "day" | "month" | "over_year"; sembunyi?: boolean } = {},
) {
  await sql`
    insert into reviews (variant_id, source, rating, author_name, body, reviewed_at, reviewed_precision, is_hidden)
    select id, ${sumber}, ${bintang}, 'Pembeli', 'Mantap', ${tanggal}::timestamptz,
      ${opsi.presisi ?? "day"}, ${opsi.sembunyi ?? false}
    from product_variants
    where slug = ${slug}
  `;
}

describe("angka rating di toko ikut ulasan baru", () => {
  it("ulasan yang ditulis sesudah tanggal salinan menambah jumlah dan rata-rata, per sumber", async () => {
    await pecahUkuran(sql, KUCING, [ukuran("uji-50g", "50 g"), ukuran("uji-80g", "80 g")]);
    await salinan("uji-50g", [4.8, 100], [4.7, 200]);
    await salinan("uji-80g", [5, 10], null);

    await ulasan("uji-50g", "shopee", 1, "2026-10-20T09:00:00+07:00");
    await ulasan("uji-50g", "shopee", 5, "2026-10-19T10:00:00+07:00");
    await ulasan("uji-50g", "shopee", 2, "2026-10-21T09:00:00+07:00", { sembunyi: true });
    await ulasan("uji-50g", "tokopedia", 5, "2026-10-25T09:00:00+07:00");
    await ulasan("uji-50g", "tokopedia", 3, "2026-11-01T09:00:00+07:00");
    await ulasan("uji-50g", "tokopedia", 1, "2026-11-02T09:00:00+07:00", { presisi: "over_year" });
    await ulasan("uji-80g", "shopee", 4, "2026-11-05T09:00:00+07:00");
    await ulasan("uji-80g", "tokopedia", 5, "2026-11-05T09:00:00+07:00");

    const produk = await satuProduk(sql, KUCING);

    expect(
      produk?.variants.map((v) => [v.slug, v.shopee_rating_count, v.tokopedia_rating_count]),
    ).toEqual([
      ["uji-50g", 101, 201],
      ["uji-80g", 11, null],
    ]);
    expect(produk?.variants[0].shopee_rating).toBeCloseTo(481 / 101, 10);
    expect(produk?.variants[0].tokopedia_rating).toBeCloseTo(943 / 201, 10);
    expect(produk?.variants[1].shopee_rating).toBeCloseTo(54 / 11, 10);
    expect(produk?.variants[1].tokopedia_rating).toBeNull();

    expect(produk?.shopee_rating_count).toBe(112);
    expect(produk?.shopee_rating).toBeCloseTo(535 / 112, 10);
    expect(produk?.tokopedia_rating_count).toBe(201);
    expect(produk?.tokopedia_rating).toBeCloseTo(943 / 201, 10);
    expect(produk?.rating_count).toBe(313);
    expect(produk?.rating).toBeCloseTo(1478 / 313, 10);

    const { data } = await daftarProduk(sql, { limit: 100, offset: 0 });
    expect(data.find((p) => p.slug === KUCING)?.rating_count).toBe(313);
  });

  it("admin tetap melihat angka salinan, ditambah jumlah ulasan baru per ukuran", async () => {
    await pecahUkuran(sql, KUCING, [ukuran("uji-50g", "50 g"), ukuran("uji-80g", "80 g")]);
    await salinan("uji-50g", [4.8, 100], [4.7, 200]);
    await salinan("uji-80g", [5, 10], null);
    await ulasan("uji-50g", "shopee", 1, "2026-10-20T09:00:00+07:00");
    await ulasan("uji-50g", "tokopedia", 3, "2026-11-01T09:00:00+07:00");
    await ulasan("uji-80g", "shopee", 4, "2026-11-05T09:00:00+07:00");

    const admin = await satuProdukAdmin(sql, KUCING);

    expect(
      admin?.variants.map((v) => [
        v.slug,
        v.shopee_rating,
        v.shopee_rating_count,
        v.shopee_new_reviews,
        v.tokopedia_rating_count,
        v.tokopedia_new_reviews,
      ]),
    ).toEqual([
      ["uji-50g", 4.8, 100, 1, 200, 1],
      ["uji-80g", 5, 10, 1, null, 0],
    ]);
    expect(admin?.shopee_rating_count).toBe(112);
  });

  it("rata-rata gabungan dibulatkan sekali saja di tampilan, jadi 4,7492 tidak naik jadi 4,75", async () => {
    await pecahUkuran(sql, KUCING, [ukuran("uji-50g", "50 g"), ukuran("uji-80g", "80 g")]);
    await salinan("uji-50g", null, [4.74, 4884]);
    await salinan("uji-80g", null, [4.79, 1095]);

    const produk = await satuProduk(sql, KUCING);

    expect(produk?.tokopedia_rating_count).toBe(5979);
    expect(produk?.tokopedia_rating).toBeCloseTo((4.74 * 4884 + 4.79 * 1095) / 5979, 10);
    expect(produk?.tokopedia_rating).toBeLessThan(4.75);
  });
});

describe("memperbarui angka salinan dari admin", () => {
  it("tanggal salinan cuma maju kalau angkanya berubah, dan ulasan lama tidak terhitung dua kali", async () => {
    await salinan(KUCING, [4.8, 100], [4.7, 50]);
    await ulasan(KUCING, "shopee", 5, "2026-10-25T09:00:00+07:00");
    expect((await satuProduk(sql, KUCING))?.shopee_rating_count).toBe(101);

    const sama = await perbaruiVarian(sql, KUCING, {
      shopee_url: LINK,
      shopee_rating: 4.8,
      shopee_rating_count: 100,
      tokopedia_rating: 4.7,
      tokopedia_rating_count: 50,
    });
    if (!sama.ok) throw new Error("simpan angka yang sama gagal");
    expect(new Date(sama.varian.shopee_rating_at ?? 0).toISOString()).toBe(
      new Date(SALIN_SHOPEE).toISOString(),
    );
    expect(new Date(sama.varian.tokopedia_rating_at ?? 0).toISOString()).toBe(
      new Date(SALIN_TOKOPEDIA).toISOString(),
    );
    expect((await satuProduk(sql, KUCING))?.shopee_rating_count).toBe(101);

    const naik = await perbaruiVarian(sql, KUCING, { shopee_rating: 4.8, shopee_rating_count: 105 });
    if (!naik.ok) throw new Error("simpan angka baru gagal");
    expect(new Date(naik.varian.shopee_rating_at ?? 0).getTime()).toBeGreaterThan(
      new Date(SALIN_SHOPEE).getTime(),
    );
    expect(new Date(naik.varian.tokopedia_rating_at ?? 0).toISOString()).toBe(
      new Date(SALIN_TOKOPEDIA).toISOString(),
    );
    expect((await satuProduk(sql, KUCING))?.shopee_rating_count).toBe(105);
  });
});
