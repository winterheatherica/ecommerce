import { afterAll, beforeEach, describe, expect, it } from "vitest";

import type { Sql } from "../lib/db";
import { bacaMigrasi, bersihkan, koneksiTes, pecahUkuran } from "../test/db";
import { daftarProduk, satuProduk, satuProdukAdmin } from "./produk";
import { perbaruiVarian } from "./varian";

const sql: Sql = koneksiTes();
const KUCING = "bye-bye-cat-50g";
const LINK = "https://www.tokopedia.com/menikstore/gel-kucing";

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

async function isi(slug: string, shopee: [number | null, number], tokopedia: [number | null, number]) {
  await sql`
    update product_variants
    set shopee_rating = ${shopee[0]},
        shopee_rating_count = ${shopee[1]},
        tokopedia_url = ${LINK},
        tokopedia_rating = ${tokopedia[0]},
        tokopedia_rating_count = ${tokopedia[1]}
    where slug = ${slug}
  `;
}

describe("rating Tokopedia dan rating gabungan di produk", () => {
  it("gabungan menimbang semua penilaian Shopee dan Tokopedia dari ukuran aktif", async () => {
    await pecahUkuran(sql, KUCING, [
      ukuran("uji-50g", "50 g"),
      ukuran("uji-80g", "80 g"),
      ukuran("uji-220ml", "220 ml"),
    ]);
    await isi("uji-50g", [4.8, 100], [4.6, 300]);
    await isi("uji-80g", [5, 50], [null, 0]);
    await isi("uji-220ml", [1, 500], [1, 500]);
    await sql`update product_variants set is_active = false where slug = 'uji-220ml'`;

    const produk = await satuProduk(sql, KUCING);

    expect(produk?.tokopedia_rating).toBe(4.6);
    expect(produk?.tokopedia_rating_count).toBe(300);
    expect(produk?.shopee_rating).toBe(4.87);
    expect(produk?.rating).toBe(4.69);
    expect(produk?.rating_count).toBe(450);
    expect(
      produk?.variants.map((v) => [v.slug, v.tokopedia_rating, v.tokopedia_rating_count, v.tokopedia_url]),
    ).toEqual([
      ["uji-50g", 4.6, 300, LINK],
      ["uji-80g", null, 0, LINK],
    ]);
  });

  it("tanpa rating di mana pun, gabungannya null dan 0", async () => {
    const produk = await satuProduk(sql, KUCING);
    expect(produk?.tokopedia_rating).toBeNull();
    expect(produk?.tokopedia_rating_count).toBe(0);
    expect(produk?.rating).toBeNull();
    expect(produk?.rating_count).toBe(0);
  });

  it("produk yang cuma punya rating Tokopedia tetap punya rating gabungan", async () => {
    await isi(KUCING, [null, 0], [4.74, 4884]);

    const { data } = await daftarProduk(sql, { limit: 100, offset: 0 });
    const kucing = data.find((p) => p.slug === KUCING);
    expect(kucing?.rating).toBe(4.74);
    expect(kucing?.rating_count).toBe(4884);

    const admin = await satuProdukAdmin(sql, KUCING);
    expect(admin?.variants[0].tokopedia_rating_count).toBe(4884);
  });
});

describe("mengubah rating Tokopedia dari admin", () => {
  it("tanggal update Tokopedia terisi sendiri dan tidak menyentuh tanggal Shopee", async () => {
    const ubah = await perbaruiVarian(sql, KUCING, { tokopedia_rating: 4.7, tokopedia_rating_count: 20 });
    expect(ubah.ok && ubah.varian.tokopedia_rating).toBe(4.7);
    expect(ubah.ok && ubah.varian.tokopedia_rating_at).not.toBeNull();
    expect(ubah.ok && ubah.varian.shopee_rating_at).toBeNull();
  });

  it("database menolak jumlah tanpa rating dan link di luar tokopedia.com", async () => {
    expect(await perbaruiVarian(sql, KUCING, { tokopedia_rating_count: 5 })).toEqual({
      ok: false,
      alasan: "tokopedia_rating_inconsistent",
    });
    expect(await perbaruiVarian(sql, KUCING, { tokopedia_url: "https://contoh.com/x" })).toEqual({
      ok: false,
      alasan: "tokopedia_url_invalid",
    });
  });
});

describe("impor rating Tokopedia 27 Oktober", () => {
  it("terpasang lewat slug varian dan semua barisnya lolos aturan database", async () => {
    await sql.unsafe(bacaMigrasi("0039_isi_rating_tokopedia.sql")).simple();

    const [kucing] = await sql<{ rating: number; jumlah: number; url: string }[]>`
      select tokopedia_rating::float8 as rating, tokopedia_rating_count as jumlah, tokopedia_url as url
      from product_variants where slug = ${KUCING}
    `;
    expect(kucing).toEqual({
      rating: 4.74,
      jumlah: 4884,
      url: "https://www.tokopedia.com/menikstore/gel-pengusir-dan-training-kucing-kemasan-70gr-1729541557755480824",
    });
  });
});
