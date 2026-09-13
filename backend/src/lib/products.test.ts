import { beforeEach, describe, expect, it } from "vitest";

import { products } from "../data/products";
import { buatProduk, ubahProduk, type ProdukBaru } from "./products";

const awal = structuredClone(products);

beforeEach(() => {
  products.splice(0, products.length, ...structuredClone(awal));
});

function baru(ubah: Partial<ProdukBaru> = {}): ProdukBaru {
  return {
    slug: "produk-uji",
    name: "Produk Uji",
    price: 25000,
    weight_g: 60,
    category: "kucing",
    ...ubah,
  };
}

describe("buatProduk", () => {
  it("menambah produk baru ke katalog", () => {
    const sebelum = products.length;
    const hasil = buatProduk(baru());

    expect(hasil.ok).toBe(true);
    expect(products).toHaveLength(sebelum + 1);
  });

  it("memberi id dan urutan yang belum dipakai", () => {
    const idTertinggi = Math.max(...products.map((p) => p.id));
    const hasil = buatProduk(baru());

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(hasil.produk.id).toBe(idTertinggi + 1);
    expect(hasil.produk.sort_order).toBeGreaterThan(0);
  });

  it("menolak slug yang sudah dipakai", () => {
    const hasil = buatProduk(baru({ slug: "bye-bye-cat-50g" }));

    expect(hasil.ok).toBe(false);
    if (hasil.ok) return;
    expect(hasil.status).toBe(409);
    expect(hasil.badan.error).toBe("slug_taken");
    expect(hasil.badan.field).toBe("slug");
  });

  it("menolak slug dengan huruf besar atau spasi", () => {
    for (const slug of ["Produk Uji", "produk_uji", "produk--uji", "-produk"]) {
      const hasil = buatProduk(baru({ slug }));
      expect(hasil.ok, slug).toBe(false);
    }
  });

  it("menerima slug yang benar", () => {
    for (const slug of ["a", "produk-uji-2", "bye-bye-cat-120g"]) {
      const hasil = buatProduk(baru({ slug }));
      expect(hasil.ok, slug).toBe(true);
    }
  });

  it("menolak kategori di luar daftar", () => {
    const hasil = buatProduk(baru({ category: "burung" }));

    expect(hasil.ok).toBe(false);
    if (hasil.ok) return;
    expect(hasil.badan.error).toBe("invalid_category");
  });

  it("default: stok nol, tidak unggulan, tapi aktif", () => {
    const hasil = buatProduk(baru());

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(hasil.produk.stock).toBe(0);
    expect(hasil.produk.is_featured).toBe(false);
    expect(hasil.produk.is_active).toBe(true);
  });

  it("membersihkan spasi di nama dan slug", () => {
    const hasil = buatProduk(baru({ slug: "  Produk-Uji  ", name: "  Uji  " }));

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(hasil.produk.slug).toBe("produk-uji");
    expect(hasil.produk.name).toBe("Uji");
  });
});

describe("ubahProduk", () => {
  it("mengubah hanya field yang dikirim", () => {
    const sebelum = products.find((p) => p.slug === "bye-bye-cat-50g")!;
    const namaLama = sebelum.name;

    const hasil = ubahProduk("bye-bye-cat-50g", { price: 55000 });

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(hasil.produk.price).toBe(55000);
    expect(hasil.produk.name).toBe(namaLama);
  });

  it("menolak produk yang tidak ada", () => {
    const hasil = ubahProduk("tidak-ada", { price: 1000 });

    expect(hasil.ok).toBe(false);
    if (hasil.ok) return;
    expect(hasil.status).toBe(404);
  });

  it("menolak kategori tidak sah dan tidak mengubah apa pun", () => {
    const produk = products.find((p) => p.slug === "bye-bye-cat-50g")!;
    const kategoriLama = produk.category;
    const hargaLama = produk.price;

    const hasil = ubahProduk("bye-bye-cat-50g", {
      category: "ngawur",
      price: 1,
    });

    expect(hasil.ok).toBe(false);
    expect(produk.category).toBe(kategoriLama);
    expect(produk.price).toBe(hargaLama);
  });

  it("bisa menonaktifkan produk", () => {
    const hasil = ubahProduk("bye-bye-cat-50g", { is_active: false });

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(hasil.produk.is_active).toBe(false);
  });

  it("tidak bisa mengubah slug", () => {
    ubahProduk("bye-bye-cat-50g", {
      name: "Nama Baru",
    } as Record<string, unknown>);

    expect(products.some((p) => p.slug === "bye-bye-cat-50g")).toBe(true);
  });
});
