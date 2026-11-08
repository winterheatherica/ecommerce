import { describe, expect, it } from "vitest";

import {
  cocokKunci,
  kandidatVarian,
  kunciProduk,
  rataTeks,
  tebakVarian,
  type VarianKatalog,
} from "./cocok-produk";

const KATALOG: VarianKatalog[] = [
  { slug: "bye-bye-cat-50g", label: "50 g", produk: "Bye Bye Cat Gel - Gel Pengusir dan Training Kucing" },
  { slug: "bye-bye-cat-80g", label: "80 g", produk: "Bye Bye Cat Gel - Gel Pengusir dan Training Kucing" },
  { slug: "bye-bye-cat-spray-80ml", label: "80 ml", produk: "Bye Bye Cat Spray - Spray Pengusir Kucing" },
  { slug: "gocat-gel-refill-66g", label: "66 g", produk: "GoCat Gel Refill Ekonomis 66g Pengusir Kucing" },
  { slug: "cicago-gel-cicak-70g", label: "70 g", produk: "Cicago Gel  - Gel Pengusir Cicak Alami 70g" },
  { slug: "cicago-spray-100ml", label: "100 ml", produk: "Cicago Spray  - Spray Pengusir Cicak 100ml" },
  { slug: "paket-cicago-gel-spray", label: "70g & 100ml", produk: "Paket Cicago Gel 70g dan Spray Pengusir Cicak 100ml" },
  { slug: "bye-bye-cicak-spray-80ml", label: "80 ml", produk: "Bye Bye Cicak Spray - Spray Pengusir Cicak" },
  { slug: "bye-bye-kecoa-50gr", label: "50 g", produk: "Bye Bye Kecoa Gel - Gel Pengusir Kecoa" },
  { slug: "bye-bye-mouse-gel-50g", label: "50 g", produk: "Bye Bye Mouse Gel - Gel Pengusir Tikus Alami Non Pestisida" },
  { slug: "ogoant-spray-100ml", label: "100 ml", produk: "Ogoant Spray - Spray Pengusir Semut Alami 100ml" },
  { slug: "paket-ogoant-gel-spray", label: "70g & 100ml", produk: "Paket O'Goant Spray 100ml dan Gel 70g  Pengusir Semut Alami" },
  { slug: "flygo-gel-70g", label: "70 g", produk: "FlyGo Gel  - Gel Pengusir Lalat Alami 70g" },
  { slug: "bye-bye-lalat-gel-50g", label: "50 g", produk: "Bye Bye Lalat Gel - Gel Pengusir Lalat" },
  { slug: "bye-bye-lalat-gel-80g", label: "80g", produk: "Bye Bye Lalat Gel - Gel Pengusir Lalat" },
  { slug: "spray-laba-80ml", label: "80 ml", produk: "Spray Pengusir Laba-laba" },
  { slug: "spray-laba-220ml", label: "220 ml", produk: "Spray Pengusir Laba-laba" },
  {
    slug: "sangreat-leather-jacket-cleaner",
    label: "80ml",
    produk: "Leather Jacket Cleaner and Polish - Pembersih, Perawat dan Pengkilap Jaket Kulit 80ml",
  },
  {
    slug: "sangreat-leather-shoe-cleaner",
    label: "80ml",
    produk: "SanGreat Leather Shoe Cleaner and Polish - Pembersih, Perawat dan Pengkilap Sepatu Kulit 80ml",
  },
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
  it("produk satuan menang dari paket walaupun semua katanya juga ada di nama paket", () => {
    expect(tebakVarian("Cicago Gel Pengusir Cicak 70g - Natural Lizard Repellent Gel", KATALOG)).toBe(
      "cicago-gel-cicak-70g",
    );
    expect(tebakVarian("O GOANT SPRAY - Spray Pengusir Semut Alami 100ml", KATALOG)).toBe("ogoant-spray-100ml");
  });

  it("jenis hama dan ukuran menentukan pilihan", () => {
    expect(tebakVarian("Gel Pengusir Tikus Alami Non Pestisida 50g", KATALOG)).toBe("bye-bye-mouse-gel-50g");
    expect(tebakVarian("Bye Bye Cat Gel 80gr pengusir kucing", KATALOG)).toBe("bye-bye-cat-80g");
    expect(tebakVarian("Spray Pengusir laba-laba - Spider Repellent non pestisida 80 ml", KATALOG)).toBe(
      "spray-laba-80ml",
    );
    expect(tebakVarian("SanGreat Leather Jacket Cleaner and Polish - Pe", KATALOG)).toBe(
      "sangreat-leather-jacket-cleaner",
    );
  });

  it("merek lebih dipercaya daripada ukuran yang beda antara marketplace dan toko", () => {
    expect(tebakVarian("BYE BYE LALAT GEL 70g - Gel Pengusir Lalat Alami 70g", KATALOG)).not.toBe("flygo-gel-70g");
  });

  it("tidak menebak kalau kemiripannya lemah atau dua kandidat sama kuat", () => {
    expect(tebakVarian("Sapu lidi panjang", KATALOG)).toBeNull();
    expect(tebakVarian("Bye Bye Cat Gel", KATALOG)).toBeNull();
  });
});

describe("kandidatVarian", () => {
  it("memberi paling banyak tiga kandidat terdekat, termasuk saat tebakan otomatis kosong", () => {
    const kandidat = kandidatVarian("BYE BYE LALAT GEL 70g - Gel Pengusir Lalat Alami 70g", KATALOG);

    expect(kandidat.length).toBeLessThanOrEqual(3);
    expect(kandidat).toContain("bye-bye-lalat-gel-50g");
    expect(kandidatVarian("Bye Bye Cat Gel", KATALOG).slice(0, 2).sort()).toEqual(["bye-bye-cat-50g", "bye-bye-cat-80g"]);
    expect(kandidatVarian("Sapu lidi panjang", KATALOG)).toEqual([]);
  });
});
