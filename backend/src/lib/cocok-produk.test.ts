import { describe, expect, it } from "vitest";

import { cocokKunci, kunciProduk, rataTeks, tebakVarian, type VarianKatalog } from "./cocok-produk";

const KATALOG: VarianKatalog[] = [
  { slug: "bye-bye-cat-50g", label: "50 g", produk: "Bye Bye Cat Gel" },
  { slug: "bye-bye-cat-80g", label: "80 g", produk: "Bye Bye Cat Gel" },
  { slug: "bye-bye-cat-spray-80ml", label: "80 ml", produk: "Bye Bye Cat Spray" },
  { slug: "gocat-gel-refill-66g", label: "66 g", produk: "GoCat Gel Refill Ekonomis Pengusir Kucing" },
  { slug: "cicago-gel-cicak-70g", label: "70 g", produk: "Cicago Gel Pengusir Cicak Alami" },
  { slug: "bye-bye-kecoa-50gr", label: "Standar", produk: "Bye Bye Kecoa Gel 50gr Pengusir Kecoa Natural" },
  { slug: "bye-bye-mouse-gel-50g", label: "50 g", produk: "Bye Bye Mouse Gel" },
  { slug: "sangreat-leather-jacket-cleaner", label: "Standar", produk: "SanGreat Leather Jacket Cleaner and Polish" },
  { slug: "sangreat-leather-bag-cleaner", label: "Standar", produk: "SanGreat Leather Bag Cleaner & Polish" },
];

describe("rataTeks dan kunciProduk", () => {
  it("menyeragamkan satuan, huruf, aksen, dan membuang elipsis di ujung", () => {
    expect(rataTeks("Gel Pengusir Kucing Kemasan 50 GR")).toBe("gel pengusir kucing kemasan 50g");
    expect(rataTeks("Spray 80 ML ...")).toBe("spray 80ml");
    expect(rataTeks("Crème  Gel 100gram…")).toBe("creme gel 100g");
    expect(kunciProduk("Alat pengusir kucing Bye Bye Cat 50g untuk ceg...")).toBe(
      "alat pengusir kucing bye bye cat 50g untuk ceg",
    );
  });
});

describe("cocokKunci", () => {
  it("cocok persis, atau salah satu awalan yang lain kalau cukup panjang", () => {
    const panjang = kunciProduk("Alat pengusir kucing Bye Bye Cat 50g untuk cegah kucing berak");
    const terpotong = kunciProduk("Alat pengusir kucing Bye Bye Cat 50g untuk ceg...");

    expect(cocokKunci(terpotong, panjang)).toBe(true);
    expect(cocokKunci(panjang, terpotong)).toBe(true);
    expect(cocokKunci("gel", "gel pengusir tikus")).toBe(false);
  });
});

describe("tebakVarian", () => {
  it("memilih ukuran yang sama dengan yang tertulis di nama marketplace", () => {
    expect(tebakVarian("Alat pengusir kucing Bye Bye Cat 50g untuk ceg", KATALOG)).toBe("bye-bye-cat-50g");
    expect(tebakVarian("Bye Bye Cat Gel 80gr pengusir kucing", KATALOG)).toBe("bye-bye-cat-80g");
    expect(tebakVarian("Cicago Gel Pengusir Cicak 70g - Natural Lizard Repellent Gel", KATALOG)).toBe(
      "cicago-gel-cicak-70g",
    );
    expect(tebakVarian("SanGreat Leather Jacket Cleaner and Polish - Pe", KATALOG)).toBe(
      "sangreat-leather-jacket-cleaner",
    );
  });

  it("jenis hama lebih menentukan daripada ukuran yang kebetulan sama", () => {
    expect(tebakVarian("Gel Pengusir Tikus Alami Non Pestisida 50g", KATALOG)).toBe("bye-bye-mouse-gel-50g");
    expect(tebakVarian("Gel Pengusir dan Training Kucing Kemasan 50gr", KATALOG)).toBe("bye-bye-cat-50g");
  });

  it("tidak menebak kalau kemiripannya lemah atau dua kandidat sama kuat", () => {
    expect(tebakVarian("Sapu lidi panjang", KATALOG)).toBeNull();
    expect(tebakVarian("Bye Bye Cat", KATALOG)).toBeNull();
  });
});
