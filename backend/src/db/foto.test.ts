import { afterAll, beforeEach, describe, expect, it } from "vitest";

import type { Sql } from "../lib/db";
import { periksaProdukBaru } from "../lib/products";
import { bacaMigrasi, bersihkan, koneksiTes, pecahUkuran } from "../test/db";
import { hapusFoto, tambahFoto, ubahUkuranFoto, urutkanFoto } from "./foto";
import { daftarProduk, satuProduk, satuProdukAdmin, simpanProdukBaru } from "./produk";

const sql: Sql = koneksiTes();
const KUCING = "bye-bye-cat-50g";
const NYAMUK = "goito-gel-nyamuk";

beforeEach(async () => {
  await bersihkan(sql);
});

afterAll(async () => {
  await sql.end();
});

const id = (nama: string) => `menik-store/produk/${nama}`;
const foto = (nama: string) => ({ cloudinary_id: id(nama), version: null, width: null, height: null });

const ukuran = (slug: string, label: string, price = 35000) => ({
  slug,
  label,
  price,
  weight_g: 50,
  stock: 5,
});

async function pasang(nama: string, varian: string | null = null, produk = KUCING) {
  const hasil = await tambahFoto(sql, produk, foto(nama), varian, 12);
  if (!hasil.ok) throw new Error(hasil.alasan);
  return hasil.foto;
}

async function fotoPublik(slug: string) {
  return (await satuProduk(sql, slug))?.images.map((f) => f.cloudinary_id);
}

describe("produk baru wajib berfoto", () => {
  const isian = {
    slug: "produk-uji",
    name: "Produk Uji",
    price: 25000,
    weight_g: 60,
    category: "kucing",
    images: [
      { cloudinary_id: id("depan"), version: 1730000000, width: 800, height: 600 },
      { cloudinary_id: id("belakang") },
    ],
  };

  it("menyimpan semua foto sesuai urutan kiriman", async () => {
    const periksa = periksaProdukBaru(isian);
    if (!periksa.ok) throw new Error(periksa.badan.message);

    const hasil = await simpanProdukBaru(sql, periksa.bersih);

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(
      hasil.produk.images.map((f) => [f.cloudinary_id, f.version, f.width, f.height, f.variant_slug]),
    ).toEqual([
      [id("depan"), 1730000000, 800, 600, null],
      [id("belakang"), null, null, null, null],
    ]);
    expect(await fotoPublik("produk-uji")).toEqual([id("depan"), id("belakang")]);
  });

  it("slug bentrok membatalkan semuanya, tidak ada foto yang tertinggal", async () => {
    const periksa = periksaProdukBaru({ ...isian, slug: KUCING });
    if (!periksa.ok) throw new Error(periksa.badan.message);

    expect(await simpanProdukBaru(sql, periksa.bersih)).toEqual({ ok: false, alasan: "slug_taken" });

    const [sisa] = await sql<{ n: number }[]>`select count(*)::int as n from product_images`;
    expect(sisa.n).toBe(0);
  });
});

describe("tambahFoto", () => {
  it("menaruh foto baru paling belakang, boleh ditandai untuk ukuran tertentu", async () => {
    await pecahUkuran(sql, KUCING, [ukuran("uji-50g", "50 g"), ukuran("uji-80g", "80 g")]);
    await pasang("umum");

    const kedua = await pasang("ukuran-80", "uji-80g");

    expect(kedua.variant_slug).toBe("uji-80g");
    expect((await satuProdukAdmin(sql, KUCING))?.images.map((f) => [f.cloudinary_id, f.variant_slug])).toEqual([
      [id("umum"), null],
      [id("ukuran-80"), "uji-80g"],
    ]);
  });

  it("menolak ukuran milik produk lain", async () => {
    expect(await tambahFoto(sql, KUCING, foto("x"), NYAMUK, 12)).toEqual({
      ok: false,
      alasan: "variant_not_found",
    });
  });

  it("menolak foto kembar, produk yang tidak ada, dan foto melebihi batas", async () => {
    await pasang("sama");

    expect(await tambahFoto(sql, KUCING, foto("sama"), null, 12)).toEqual({ ok: false, alasan: "duplicate" });
    expect(await tambahFoto(sql, "tidak-ada", foto("x"), null, 12)).toEqual({ ok: false, alasan: "not_found" });

    await pasang("dua");

    expect(await tambahFoto(sql, KUCING, foto("tiga"), null, 2)).toEqual({ ok: false, alasan: "too_many" });
  });
});

describe("urutkanFoto", () => {
  it("menyimpan urutan baru", async () => {
    const a = await pasang("a");
    const b = await pasang("b");
    const c = await pasang("c");

    expect(await urutkanFoto(sql, KUCING, [c.id, a.id, b.id])).toEqual({ ok: true });
    expect(await fotoPublik(KUCING)).toEqual([id("c"), id("a"), id("b")]);
  });

  it("menolak daftar yang kurang, berlebih, kembar, atau berisi foto produk lain", async () => {
    const a = await pasang("a");
    const b = await pasang("b");
    const lain = await pasang("lain", null, NYAMUK);

    for (const ids of [[a.id], [a.id, b.id, lain.id], [a.id, lain.id], [a.id, a.id]]) {
      expect(await urutkanFoto(sql, KUCING, ids), JSON.stringify(ids)).toEqual({
        ok: false,
        alasan: "mismatch",
      });
    }

    expect(await urutkanFoto(sql, "tidak-ada", [a.id])).toEqual({ ok: false, alasan: "not_found" });
    expect(await fotoPublik(KUCING)).toEqual([id("a"), id("b")]);
  });
});

describe("hapusFoto", () => {
  it("foto terakhir tidak boleh dihapus", async () => {
    const a = await pasang("a");

    expect(await hapusFoto(sql, a.id)).toEqual({ ok: false, alasan: "last_image" });

    await pasang("b");

    expect(await hapusFoto(sql, a.id)).toEqual({ ok: true });
    expect(await fotoPublik(KUCING)).toEqual([id("b")]);
    expect(await hapusFoto(sql, a.id)).toEqual({ ok: false, alasan: "not_found" });
  });
});

describe("ubahUkuranFoto", () => {
  it("memasang dan melepas tanda ukuran", async () => {
    await pecahUkuran(sql, KUCING, [ukuran("uji-50g", "50 g"), ukuran("uji-80g", "80 g")]);
    const a = await pasang("a");

    const pasangTanda = await ubahUkuranFoto(sql, a.id, "uji-80g");
    expect(pasangTanda.ok && pasangTanda.foto.variant_slug).toBe("uji-80g");

    const lepas = await ubahUkuranFoto(sql, a.id, null);
    expect(lepas.ok && lepas.foto.variant_slug).toBeNull();

    expect(await ubahUkuranFoto(sql, a.id, NYAMUK)).toEqual({ ok: false, alasan: "variant_not_found" });
    expect(await ubahUkuranFoto(sql, 999999, null)).toEqual({ ok: false, alasan: "not_found" });
  });
});

describe("foto di toko", () => {
  it("menyembunyikan foto ukuran yang nonaktif, admin tetap melihatnya", async () => {
    await pecahUkuran(sql, KUCING, [ukuran("uji-50g", "50 g"), ukuran("uji-80g", "80 g")]);
    await pasang("umum");
    await pasang("lima-puluh", "uji-50g");
    await pasang("delapan-puluh", "uji-80g");
    await sql`update product_variants set is_active = false where slug = 'uji-80g'`;

    expect(await fotoPublik(KUCING)).toEqual([id("umum"), id("lima-puluh")]);

    const daftar = await daftarProduk(sql, { limit: 50, offset: 0 });
    expect(daftar.data.find((p) => p.slug === KUCING)?.images).toHaveLength(2);
    expect((await satuProdukAdmin(sql, KUCING))?.images).toHaveLength(3);
  });

  it("produk tanpa foto mendapat daftar kosong, bukan null", async () => {
    expect((await satuProduk(sql, KUCING))?.images).toEqual([]);
  });
});

describe("migrasi 0041", () => {
  const jalankan = () => sql.unsafe(bacaMigrasi("0041_isi_foto_produk.sql")).simple();

  it("memasang foto ke produk dan ukurannya, mempertahankan alt lama, dan aman dijalankan ulang", async () => {
    await sql`delete from products where slug = 'bye-bye-cat-80g'`;
    await pecahUkuran(sql, KUCING, [
      ukuran("bye-bye-cat-80g", "80 g", 59000),
      ukuran("bye-bye-cat-spray-80ml", "Spray 80 ml", 39000),
      ukuran("bye-bye-cat-50g", "50 g", 49000),
    ]);
    await sql`
      insert into product_images (product_id, cloudinary_id, alt)
      select id, ${id(NYAMUK)}, 'Goito Gel lama' from products where slug = ${NYAMUK}
    `;

    await jalankan();
    const [pertama] = await sql<{ n: number }[]>`select count(*)::int as n from product_images`;
    await jalankan();
    const [kedua] = await sql<{ n: number }[]>`select count(*)::int as n from product_images`;

    expect(kedua.n).toBe(pertama.n);
    expect((await satuProdukAdmin(sql, KUCING))?.images.map((f) => [f.cloudinary_id, f.variant_slug])).toEqual([
      [id("bye-bye-cat-80g"), "bye-bye-cat-80g"],
      [id("bye-bye-cat-spray-80ml"), "bye-bye-cat-spray-80ml"],
      [id("bye-bye-cat-50g"), "bye-bye-cat-50g"],
    ]);
    expect((await satuProdukAdmin(sql, NYAMUK))?.images.map((f) => [f.cloudinary_id, f.alt])).toEqual([
      [id(NYAMUK), "Goito Gel lama"],
    ]);

    const tanpaFoto = await sql<{ slug: string }[]>`
      select slug from products p
      where not exists (select 1 from product_images i where i.product_id = p.id)
    `;
    expect(tanpaFoto).toEqual([]);
  });
});
