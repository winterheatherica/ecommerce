import { describe, expect, it } from "vitest";

import {
  KATEGORI,
  TURUNAN_VARIAN,
  periksaPerubahan,
  periksaProdukBaru,
  rapikanCaraPakai,
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
    const hasil = periksaPerubahan({ name: "Nama Baru" });

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(Object.keys(hasil.bersih)).toEqual(["name"]);
  });

  it("tidak memuat apa pun kalau tidak ada yang dikirim", () => {
    const hasil = periksaPerubahan({});

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(Object.keys(hasil.bersih)).toHaveLength(0);
  });

  it("menolak kategori tidak sah", () => {
    const hasil = periksaPerubahan({ category: "ngawur" });

    expect(hasil.ok).toBe(false);
    if (hasil.ok) return;
    expect(hasil.badan.error).toBe("invalid_category");
  });

  it("menerima semua kategori yang dipakai storefront", () => {
    for (const kategori of KATEGORI) {
      const hasil = periksaPerubahan({ category: kategori });
      expect(hasil.ok, kategori).toBe(true);
    }
  });

  it("menolak harga, berat, dan stok karena itu turunan varian", () => {
    for (const field of TURUNAN_VARIAN) {
      const hasil = periksaPerubahan({ [field]: 1 });

      expect(hasil.ok, field).toBe(false);
      if (hasil.ok) return;
      expect(hasil.status).toBe(422);
      expect(hasil.badan.error).toBe("derived_field");
      expect(hasil.badan.field).toBe(field);
    }
  });

  it("menolak stok nol juga, bukan cuma angka yang terisi", () => {
    const hasil = periksaPerubahan({ stock: 0 });

    expect(hasil.ok).toBe(false);
    if (hasil.ok) return;
    expect(hasil.badan.error).toBe("derived_field");
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

  it("cara pakai yang tidak dikirim tidak ikut diubah, null berarti dihapus", () => {
    const tanpa = periksaPerubahan({ name: "Nama" });
    const hapus = periksaPerubahan({ usage_instructions: null });

    expect(tanpa.ok && "usage_instructions" in tanpa.bersih).toBe(false);
    expect(hapus.ok && hapus.bersih.usage_instructions).toBeNull();
  });
});

describe("rapikanCaraPakai", () => {
  it("satu langkah per baris: spasi dirapikan, baris kosong dibuang, akhir baris Windows diseragamkan", () => {
    const mentah = "Gel:\r\n  Sebarkan   gel di sudut  \r\n\r\n\rUlangi tiap 3 hari\n\n";

    expect(rapikanCaraPakai(mentah)).toBe("Gel:\nSebarkan gel di sudut\nUlangi tiap 3 hari");
  });

  it("isian yang cuma spasi dianggap kosong", () => {
    expect(rapikanCaraPakai("   \n \r\n ")).toBeNull();
    expect(rapikanCaraPakai(null)).toBeNull();
  });

  it("produk baru tanpa cara pakai tersimpan sebagai null, bukan teks kosong", () => {
    const hasil = periksaProdukBaru(baru());

    expect(hasil.ok && hasil.bersih.usage_instructions).toBeNull();
  });
});
