import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import type { BannerBersih } from "../lib/banner";
import type { Sql } from "../lib/db";
import { koneksiTes } from "../test/db";
import { simpanBanner } from "./banner";
import { ambilSitus } from "./situs";

const sql: Sql = koneksiTes();
let asli: BannerBersih[];

const tanpaId = (daftar: (BannerBersih & { id: number })[]): BannerBersih[] =>
  daftar.map(({ id: _id, ...b }) => b);

const banner = (ubah: Partial<BannerBersih> = {}): BannerBersih => ({
  cloudinary_id: "menik-store/banner/uji",
  static_path: null,
  version: 1730000000,
  width: 1200,
  height: 600,
  alt: "Promo uji",
  link: "/produk",
  ...ubah,
});

beforeAll(async () => {
  asli = tanpaId((await ambilSitus(sql)).banners);
});

afterEach(async () => {
  await simpanBanner(sql, asli);
});

afterAll(async () => {
  await sql.end();
});

describe("banner promo", () => {
  it("migrasi mengisi tiga banner contoh dari file bawaan", () => {
    expect(asli.map((b) => b.static_path)).toEqual([
      "/banner-promo/contoh-1.webp",
      "/banner-promo/contoh-2.webp",
      "/banner-promo/contoh-3.webp",
    ]);
    expect(asli.every((b) => b.width === 1200 && b.height === 600 && b.cloudinary_id === null)).toBe(true);
  });

  it("menyimpan ulang seluruh daftar dengan urutan baru", async () => {
    const baru = [banner({ cloudinary_id: "menik-store/banner/kedua", link: null }), banner(), asli[0]];

    await simpanBanner(sql, baru);

    expect(tanpaId((await ambilSitus(sql)).banners)).toEqual(baru);
  });

  it("bisa dikosongkan", async () => {
    await simpanBanner(sql, []);

    expect((await ambilSitus(sql)).banners).toEqual([]);
  });

  it("database sendiri menolak banner tanpa gambar dan link ke situs lain lewat //", async () => {
    await expect(
      sql`insert into promo_banners (alt) values ('Tanpa gambar')`,
    ).rejects.toThrow(/promo_banners_satu_sumber/);
    await expect(
      sql`insert into promo_banners (static_path, alt, link) values ('/banner-promo/x.webp', 'Link aneh', '//situs-lain.com')`,
    ).rejects.toThrow(/promo_banners_link_check/);
  });
});
