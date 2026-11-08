import { describe, expect, it } from "vitest";

import { buatFeedGoogle, waktuGoogle, type BarisFeed } from "./feed-google";

const SITUS = "https://menikstore.my.id";
const AWAN = "dokzc5ogk";
const SEKARANG = new Date("2026-11-08T05:00:00Z");

function baris(ubah: Partial<BarisFeed> = {}): BarisFeed {
  return {
    product_slug: "bye-bye-cat-gel",
    name: "Bye Bye Cat Gel  - Gel Pengusir & Training Kucing",
    description: "Gel <alami>\n untuk kucing",
    brand: "Bye Bye",
    product_type: "Hewan > Kucing",
    variant_slug: "bye-bye-cat-80g",
    label: "80 g",
    jumlah_ukuran: 2,
    price: 59000,
    promo_price: null,
    promo_starts_at: null,
    promo_ends_at: null,
    promo_status: "none",
    stock: 5,
    weight_g: 120,
    images: [
      { cloudinary_id: "menik-store/produk/kucing-80", version: 123 },
      { cloudinary_id: "menik-store/produk/kucing", version: null },
    ],
    ...ubah,
  };
}

function feed(...daftar: BarisFeed[]): string {
  return buatFeedGoogle(daftar, { situs: SITUS, awan: AWAN, sekarang: SEKARANG });
}

function nilai(xml: string, tag: string): string[] {
  return [...xml.matchAll(new RegExp(`<g:${tag}>([^<]*)</g:${tag}>`, "g"))].map((m) => m[1]);
}

describe("feed Google Merchant Center", () => {
  it("satu item per ukuran: link memilih ukuran, judul ditambah ukuran, teks di-escape", () => {
    const xml = feed(baris());

    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml).toContain('xmlns:g="http://base.google.com/ns/1.0"');
    expect(nilai(xml, "id")).toEqual(["bye-bye-cat-80g"]);
    expect(nilai(xml, "item_group_id")).toEqual(["bye-bye-cat-gel"]);
    expect(nilai(xml, "title")).toEqual(["Bye Bye Cat Gel - Gel Pengusir &amp; Training Kucing 80 g"]);
    expect(nilai(xml, "description")).toEqual(["Gel &lt;alami&gt; untuk kucing"]);
    expect(nilai(xml, "link")).toEqual([`${SITUS}/produk/bye-bye-cat-gel?ukuran=bye-bye-cat-80g`]);
    expect(nilai(xml, "image_link")).toEqual([
      "https://res.cloudinary.com/dokzc5ogk/image/upload/v123/menik-store/produk/kucing-80",
    ]);
    expect(nilai(xml, "additional_image_link")).toEqual([
      "https://res.cloudinary.com/dokzc5ogk/image/upload/menik-store/produk/kucing",
    ]);
    expect(nilai(xml, "availability")).toEqual(["in_stock"]);
    expect(nilai(xml, "price")).toEqual(["59000 IDR"]);
    expect(nilai(xml, "sale_price")).toEqual([]);
    expect(nilai(xml, "condition")).toEqual(["new"]);
    expect(nilai(xml, "brand")).toEqual(["Bye Bye"]);
    expect(nilai(xml, "size")).toEqual(["80 g"]);
    expect(nilai(xml, "product_type")).toEqual(["Hewan &gt; Kucing"]);
    expect(nilai(xml, "shipping_weight")).toEqual(["120 g"]);
  });

  it("produk satu ukuran tanpa item_group_id, size, dan parameter ukuran di link", () => {
    const xml = feed(baris({ product_slug: "cicago-gel", variant_slug: "cicago-gel", jumlah_ukuran: 1, name: "Cicago Gel 70g" }));

    expect(nilai(xml, "item_group_id")).toEqual([]);
    expect(nilai(xml, "size")).toEqual([]);
    expect(nilai(xml, "title")).toEqual(["Cicago Gel 70g"]);
    expect(nilai(xml, "link")).toEqual([`${SITUS}/produk/cicago-gel`]);
  });

  it("ukuran yang sudah tertulis di nama tidak ditulis dua kali, tapi huruf yang kebetulan sama tidak dihitung", () => {
    expect(nilai(feed(baris({ name: "Gel Pengusir Musang 80 g" })), "title")).toEqual(["Gel Pengusir Musang 80 g"]);
    expect(nilai(feed(baris({ name: "Gel Pengusir Musang 80g" })), "title")).toEqual(["Gel Pengusir Musang 80g"]);
    expect(nilai(feed(baris({ name: "Alat pengusir kucing", label: "A" })), "title")).toEqual([
      "Alat pengusir kucing A",
    ]);
  });

  it("promo aktif dan terjadwal jadi sale_price dengan periode WIB; promo selesai diabaikan", () => {
    const aktif = feed(
      baris({
        promo_price: 45000,
        promo_status: "active",
        promo_starts_at: "2026-11-01T00:00:00+07:00",
        promo_ends_at: "2026-12-01T00:00:00+07:00",
      }),
    );
    expect(nilai(aktif, "price")).toEqual(["59000 IDR"]);
    expect(nilai(aktif, "sale_price")).toEqual(["45000 IDR"]);
    expect(nilai(aktif, "sale_price_effective_date")).toEqual(["2026-11-01T00:00+0700/2026-12-01T00:00+0700"]);

    const tanpaMulai = feed(
      baris({ promo_price: 45000, promo_status: "active", promo_ends_at: "2026-12-01T00:00:00+07:00" }),
    );
    expect(nilai(tanpaMulai, "sale_price_effective_date")).toEqual(["2026-11-08T12:00+0700/2026-12-01T00:00+0700"]);

    const tanpaAkhir = feed(baris({ promo_price: 45000, promo_status: "active" }));
    expect(nilai(tanpaAkhir, "sale_price")).toEqual(["45000 IDR"]);
    expect(nilai(tanpaAkhir, "sale_price_effective_date")).toEqual([]);

    const terjadwal = feed(
      baris({
        promo_price: 45000,
        promo_status: "scheduled",
        promo_starts_at: "2026-11-20T00:00:00+07:00",
        promo_ends_at: "2026-11-27T00:00:00+07:00",
      }),
    );
    expect(nilai(terjadwal, "sale_price")).toEqual(["45000 IDR"]);
    expect(nilai(terjadwal, "sale_price_effective_date")).toEqual(["2026-11-20T00:00+0700/2026-11-27T00:00+0700"]);

    const terjadwalTanpaAkhir = feed(
      baris({ promo_price: 45000, promo_status: "scheduled", promo_starts_at: "2026-11-20T00:00:00+07:00" }),
    );
    expect(nilai(terjadwalTanpaAkhir, "sale_price")).toEqual([]);

    const selesai = feed(baris({ promo_price: 45000, promo_status: "ended" }));
    expect(nilai(selesai, "sale_price")).toEqual([]);
  });

  it("stok habis jadi out_of_stock, merek kosong tidak ditulis, tanpa foto dilewati, foto tambahan maks 10", () => {
    const banyakFoto = Array.from({ length: 13 }, (_, i) => ({ cloudinary_id: `menik-store/produk/f${i}`, version: null }));
    const xml = feed(
      baris({ stock: 0, brand: null, images: banyakFoto }),
      baris({ variant_slug: "tanpa-foto", images: [] }),
    );

    expect(nilai(xml, "id")).toEqual(["bye-bye-cat-80g"]);
    expect(nilai(xml, "availability")).toEqual(["out_of_stock"]);
    expect(nilai(xml, "brand")).toEqual([]);
    expect(nilai(xml, "additional_image_link")).toHaveLength(10);
  });

  it("waktu ditulis dalam WIB dengan zona +0700", () => {
    expect(waktuGoogle("2026-10-31T17:00:00Z")).toBe("2026-11-01T00:00+0700");
    expect(waktuGoogle(new Date("2026-11-30T16:59:00Z"))).toBe("2026-11-30T23:59+0700");
  });
});
