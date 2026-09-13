import { describe, expect, it } from "vitest";

import {
  bersihkanHp,
  gabungkanItem,
  kedaluwarsa,
  nomorPesananBaru,
} from "./orders";

describe("nomorPesananBaru", () => {
  it("berawalan MNK- dan panjangnya tetap", () => {
    const nomor = nomorPesananBaru();

    expect(nomor).toMatch(/^MNK-[A-Z2-9]{8}$/);
  });

  it("tidak memakai huruf yang mudah tertukar angka", () => {
    const gabungan = Array.from({ length: 200 }, nomorPesananBaru).join("");

    for (const huruf of ["I", "O", "0", "1"]) {
      expect(gabungan.slice(4), huruf).not.toContain(huruf);
    }
  });

  it("acak, tidak berurutan", () => {
    const kumpulan = new Set(Array.from({ length: 500 }, nomorPesananBaru));

    expect(kumpulan.size).toBe(500);
  });
});

describe("bersihkanHp", () => {
  it("membuang spasi dan tanda hubung", () => {
    expect(bersihkanHp("0812-3456-7890")).toBe("081234567890");
    expect(bersihkanHp("0812 3456 7890")).toBe("081234567890");
    expect(bersihkanHp("0812-3456 7890")).toBe("081234567890");
  });

  it("membiarkan nomor yang sudah bersih apa adanya", () => {
    expect(bersihkanHp("081234567890")).toBe("081234567890");
  });

  it("tidak membuang tanda plus di nomor internasional", () => {
    expect(bersihkanHp("+62 812-3456-7890")).toBe("+6281234567890");
  });
});

describe("kedaluwarsa", () => {
  const lampau = new Date(Date.now() - 60_000).toISOString();
  const depan = new Date(Date.now() + 60_000).toISOString();

  it("PENDING yang lewat batas dianggap kedaluwarsa", () => {
    expect(kedaluwarsa("PENDING", lampau)).toBe(true);
  });

  it("PENDING yang belum lewat batas belum kedaluwarsa", () => {
    expect(kedaluwarsa("PENDING", depan)).toBe(false);
  });

  it("pesanan yang sudah dibayar tidak pernah kedaluwarsa", () => {
    expect(kedaluwarsa("PAID", lampau)).toBe(false);
    expect(kedaluwarsa("SHIPPED", lampau)).toBe(false);
  });

  it("tanpa batas waktu berarti tidak kedaluwarsa", () => {
    expect(kedaluwarsa("PENDING", null)).toBe(false);
  });
});

describe("gabungkanItem", () => {
  it("menjumlahkan slug yang sama", () => {
    const hasil = gabungkanItem([
      { slug: "a", qty: 2 },
      { slug: "b", qty: 1 },
      { slug: "a", qty: 3 },
    ]);

    expect(hasil).toEqual([
      { slug: "a", qty: 5 },
      { slug: "b", qty: 1 },
    ]);
  });

  it("mengurutkan berdasarkan slug supaya urutan kunci selalu sama", () => {
    const hasil = gabungkanItem([
      { slug: "z", qty: 1 },
      { slug: "m", qty: 1 },
      { slug: "a", qty: 1 },
    ]);

    expect(hasil.map((i) => i.slug)).toEqual(["a", "m", "z"]);
  });
});
