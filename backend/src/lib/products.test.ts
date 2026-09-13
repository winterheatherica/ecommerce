import { describe, expect, it } from "vitest";

import {
  periksaPerubahan,
  periksaProdukBaru,
  type ProdukBaru,
} from "./products";

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

describe("periksaProdukBaru", () => {
  it("menolak slug dengan huruf besar, spasi, atau tanda hubung ganda", () => {
    for (const slug of ["Produk Uji", "produk_uji", "produk--uji", "-produk", ""]) {
      const hasil = periksaProdukBaru(baru({ slug }));
      expect(hasil.ok, slug).toBe(false);
    }
  });

  it("menerima slug yang benar", () => {
    for (const slug of ["a", "produk-uji-2", "bye-bye-cat-120g"]) {
      const hasil = periksaProdukBaru(baru({ slug }));
      expect(hasil.ok, slug).toBe(true);
    }
  });

  it("menolak kategori di luar daftar", () => {
    const hasil = periksaProdukBaru(baru({ category: "burung" }));

    expect(hasil.ok).toBe(false);
    if (hasil.ok) return;
    expect(hasil.status).toBe(422);
    expect(hasil.badan.error).toBe("invalid_category");
    expect(hasil.badan.field).toBe("category");
  });

  it("default: stok nol, tidak unggulan, tapi aktif", () => {
    const hasil = periksaProdukBaru(baru());

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(hasil.bersih.stock).toBe(0);
    expect(hasil.bersih.is_featured).toBe(false);
    expect(hasil.bersih.is_active).toBe(true);
    expect(hasil.bersih.sold_per_month).toBe(0);
  });

  it("sort_order null kalau tidak diisi, biar database yang menentukan", () => {
    const hasil = periksaProdukBaru(baru());

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(hasil.bersih.sort_order).toBeNull();
  });

  it("sort_order dipakai kalau diisi", () => {
    const hasil = periksaProdukBaru(baru({ sort_order: 3 }));

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(hasil.bersih.sort_order).toBe(3);
  });

  it("membersihkan spasi dan huruf besar di slug dan nama", () => {
    const hasil = periksaProdukBaru(baru({ slug: "  Produk-Uji  ", name: "  Uji  " }));

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(hasil.bersih.slug).toBe("produk-uji");
    expect(hasil.bersih.name).toBe("Uji");
  });

  it("deskripsi kosong jadi string kosong, bukan undefined", () => {
    const hasil = periksaProdukBaru(baru());

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(hasil.bersih.description).toBe("");
  });
});

describe("periksaPerubahan", () => {
  it("hanya memuat field yang dikirim", () => {
    const hasil = periksaPerubahan({ price: 55000 });

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(Object.keys(hasil.bersih)).toEqual(["price"]);
  });

  it("tidak memuat apa pun kalau tidak ada yang dikirim", () => {
    const hasil = periksaPerubahan({});

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(Object.keys(hasil.bersih)).toHaveLength(0);
  });

  it("menolak kategori tidak sah", () => {
    const hasil = periksaPerubahan({ category: "ngawur", price: 1 });

    expect(hasil.ok).toBe(false);
    if (hasil.ok) return;
    expect(hasil.badan.error).toBe("invalid_category");
  });

  it("membersihkan spasi di nama dan deskripsi", () => {
    const hasil = periksaPerubahan({ name: "  Nama  ", description: "  Isi  " });

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(hasil.bersih.name).toBe("Nama");
    expect(hasil.bersih.description).toBe("Isi");
  });

  it("membedakan false dari tidak dikirim", () => {
    const hasil = periksaPerubahan({ is_active: false });

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(hasil.bersih.is_active).toBe(false);
    expect("is_featured" in hasil.bersih).toBe(false);
  });

  it("membedakan nol dari tidak dikirim", () => {
    const hasil = periksaPerubahan({ stock: 0 });

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(hasil.bersih.stock).toBe(0);
    expect("price" in hasil.bersih).toBe(false);
  });
});
