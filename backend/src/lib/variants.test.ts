import { describe, expect, it } from "vitest";

import {
  periksaPerubahanVarian,
  periksaVarianBaru,
  type VarianBaru,
} from "./variants";

function baru(ubah: Partial<VarianBaru> = {}): VarianBaru {
  return {
    slug: "bye-bye-cat-120g",
    label: "120 g",
    price: 79000,
    weight_g: 120,
    ...ubah,
  };
}

describe("periksaVarianBaru", () => {
  it("menolak slug dengan huruf besar, spasi, atau tanda hubung ganda", () => {
    for (const slug of ["Bye Bye", "bye_bye", "bye--bye", "-bye", ""]) {
      const hasil = periksaVarianBaru(baru({ slug }));
      expect(hasil.ok, slug).toBe(false);
    }
  });

  it("menolak label kosong karena pembeli tidak akan tahu mana yang dipilih", () => {
    const hasil = periksaVarianBaru(baru({ label: "   " }));

    expect(hasil.ok).toBe(false);
    if (hasil.ok) return;
    expect(hasil.status).toBe(422);
    expect(hasil.badan.error).toBe("invalid_label");
  });

  it("stok default nol, jadi varian baru tidak langsung bisa dibeli", () => {
    const hasil = periksaVarianBaru(baru());

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(hasil.bersih.stock).toBe(0);
  });

  it("sort_order null kalau tidak diisi, biar database yang menentukan", () => {
    const hasil = periksaVarianBaru(baru());

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(hasil.bersih.sort_order).toBeNull();
  });

  it("membersihkan spasi dan huruf besar", () => {
    const hasil = periksaVarianBaru(baru({ slug: "  Bye-BYE-200g ", label: "  200 g  " }));

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(hasil.bersih.slug).toBe("bye-bye-200g");
    expect(hasil.bersih.label).toBe("200 g");
  });
});

describe("periksaPerubahanVarian", () => {
  it("hanya memuat field yang dikirim", () => {
    const hasil = periksaPerubahanVarian({ stock: 12 });

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(Object.keys(hasil.bersih)).toEqual(["stock"]);
  });

  it("tidak memuat apa pun kalau tidak ada yang dikirim", () => {
    const hasil = periksaPerubahanVarian({});

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(Object.keys(hasil.bersih)).toHaveLength(0);
  });

  it("membedakan nol dari tidak dikirim", () => {
    const hasil = periksaPerubahanVarian({ stock: 0 });

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(hasil.bersih.stock).toBe(0);
    expect("price" in hasil.bersih).toBe(false);
  });

  it("membedakan false dari tidak dikirim", () => {
    const hasil = periksaPerubahanVarian({ is_active: false });

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(hasil.bersih.is_active).toBe(false);
  });

  it("menolak label yang jadi kosong setelah spasi dibuang", () => {
    const hasil = periksaPerubahanVarian({ label: "  " });

    expect(hasil.ok).toBe(false);
    if (hasil.ok) return;
    expect(hasil.badan.error).toBe("invalid_label");
  });
});

describe("SKU varian", () => {
  it("menerima format SKU yang umum dipakai penjual", () => {
    for (const sku of ["001", "GOCAT-350", "BBC.80g", "PAKET/01", "a_b"]) {
      const hasil = periksaVarianBaru(baru({ sku }));
      expect(hasil.ok, sku).toBe(true);
    }
  });

  it("menolak spasi, awalan simbol, dan yang terlalu panjang", () => {
    for (const sku of ["GO CAT", "-001", "#12", "x".repeat(41)]) {
      const hasil = periksaVarianBaru(baru({ sku }));

      expect(hasil.ok, sku).toBe(false);
      if (hasil.ok) return;
      expect(hasil.badan.error).toBe("invalid_sku");
    }
  });

  it("SKU kosong saat menambah berarti minta nomor otomatis", () => {
    for (const sku of [undefined, "", "   "]) {
      const hasil = periksaVarianBaru(baru({ sku }));

      expect(hasil.ok).toBe(true);
      if (!hasil.ok) return;
      expect(hasil.bersih.sku).toBeNull();
    }
  });

  it("SKU kosong saat mengubah ditolak, karena setiap varian wajib punya SKU", () => {
    const hasil = periksaPerubahanVarian({ sku: "  " });

    expect(hasil.ok).toBe(false);
    if (hasil.ok) return;
    expect(hasil.badan.error).toBe("invalid_sku");
  });

  it("membuang spasi di tepi SKU", () => {
    const hasil = periksaPerubahanVarian({ sku: "  GOCAT-350 " });

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(hasil.bersih.sku).toBe("GOCAT-350");
  });
});
