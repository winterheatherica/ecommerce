import { beforeEach, describe, expect, it } from "vitest";

import { products } from "../data/products";
import { orderItems, orders } from "../data/orders";
import {
  buatPesanan,
  cariPesanan,
  kedaluwarsa,
  kedaluwarsakanSatu,
  sapuKedaluwarsa,
  tandaiTerbayar,
  type PermintaanPesanan,
} from "./orders";

const TOKO = "http://localhost:3000";

const produkAwal = structuredClone(products);
const pesananAwal = structuredClone(orders);
const itemAwal = structuredClone(orderItems);

beforeEach(() => {
  products.splice(0, products.length, ...structuredClone(produkAwal));
  orders.splice(0, orders.length, ...structuredClone(pesananAwal));
  orderItems.splice(0, orderItems.length, ...structuredClone(itemAwal));
});

function permintaan(
  ubah: Partial<PermintaanPesanan> = {},
): PermintaanPesanan {
  return {
    customer_name: "Budi Santoso",
    phone: "0812-3456-7890",
    address: "Jl. Contoh No. 1, RT 01/RW 02",
    dest_id: "50001",
    courier: "JNE",
    service: "REG",
    items: [{ slug: "bye-bye-cat-50g", qty: 1 }],
    ...ubah,
  };
}

describe("buatPesanan", () => {
  it("menghitung subtotal dari harga katalog, bukan dari kiriman pembeli", () => {
    const hasil = buatPesanan(
      permintaan({
        items: [
          { slug: "bye-bye-cat-50g", qty: 2 },
          { slug: "goito-gel-nyamuk", qty: 1 },
        ],
      }),
      TOKO,
    );

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;

    expect(hasil.pesanan.subtotal).toBe(49000 * 2 + 33000);
    expect(hasil.pesanan.total).toBe(
      hasil.pesanan.subtotal + hasil.pesanan.shipping_cost,
    );
  });

  it("menjumlahkan berat dari katalog", () => {
    const hasil = buatPesanan(
      permintaan({ items: [{ slug: "bye-bye-cat-80g", qty: 3 }] }),
      TOKO,
    );

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(hasil.pesanan.weight_g).toBe(80 * 3);
  });

  it("memotong stok sebanyak yang dipesan", () => {
    const sebelum = products.find((p) => p.slug === "bye-bye-cat-50g")!.stock;

    buatPesanan(
      permintaan({ items: [{ slug: "bye-bye-cat-50g", qty: 3 }] }),
      TOKO,
    );

    const sesudah = products.find((p) => p.slug === "bye-bye-cat-50g")!.stock;
    expect(sesudah).toBe(sebelum - 3);
  });

  it("menolak kalau stok kurang, dan tidak menyentuh stok sama sekali", () => {
    const produk = products.find((p) => p.slug === "sangreat-leather-bag-cleaner")!;
    const sebelum = produk.stock;

    const hasil = buatPesanan(
      permintaan({
        items: [{ slug: "sangreat-leather-bag-cleaner", qty: sebelum + 1 }],
      }),
      TOKO,
    );

    expect(hasil.ok).toBe(false);
    if (hasil.ok) return;

    expect(hasil.status).toBe(409);
    expect(hasil.badan.error).toBe("insufficient_stock");
    expect(hasil.badan.available).toBe(sebelum);
    expect(produk.stock).toBe(sebelum);
  });

  it("menjumlahkan slug yang sama supaya tidak bisa melewati batas stok", () => {
    const produk = products.find((p) => p.slug === "sangreat-leather-bag-cleaner")!;
    const sebelum = produk.stock;

    const hasil = buatPesanan(
      permintaan({
        items: [
          { slug: "sangreat-leather-bag-cleaner", qty: sebelum },
          { slug: "sangreat-leather-bag-cleaner", qty: 1 },
        ],
      }),
      TOKO,
    );

    expect(hasil.ok).toBe(false);
    expect(produk.stock).toBe(sebelum);
  });

  it("menolak produk yang stoknya nol", () => {
    const hasil = buatPesanan(
      permintaan({ items: [{ slug: "bye-bye-cicak-gel-80gr", qty: 1 }] }),
      TOKO,
    );

    expect(hasil.ok).toBe(false);
    if (hasil.ok) return;
    expect(hasil.badan.error).toBe("insufficient_stock");
  });

  it("menolak produk yang tidak aktif", () => {
    const produk = products.find((p) => p.slug === "bye-bye-cat-50g")!;
    produk.is_active = false;

    const hasil = buatPesanan(permintaan(), TOKO);

    expect(hasil.ok).toBe(false);
    if (hasil.ok) return;
    expect(hasil.badan.error).toBe("product_not_found");
  });

  it("menolak kecamatan tujuan yang tidak dikenal", () => {
    const hasil = buatPesanan(permintaan({ dest_id: "99999" }), TOKO);

    expect(hasil.ok).toBe(false);
    if (hasil.ok) return;
    expect(hasil.badan.error).toBe("region_not_found");
  });

  it("menolak layanan pengiriman yang tidak ada", () => {
    const hasil = buatPesanan(permintaan({ service: "KILAT" }), TOKO);

    expect(hasil.ok).toBe(false);
    if (hasil.ok) return;
    expect(hasil.badan.error).toBe("service_unavailable");
  });

  it("membekukan harga dan nama produk di item pesanan", () => {
    const hasil = buatPesanan(permintaan(), TOKO);
    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;

    const item = orderItems.find((i) => i.order_id === hasil.pesanan.id)!;
    expect(item.price_snapshot).toBe(49000);
    expect(item.name_snapshot).toBe("Alat pengusir kucing Bye Bye Cat 50g");

    const produk = products.find((p) => p.slug === "bye-bye-cat-50g")!;
    produk.price = 999000;

    expect(item.price_snapshot).toBe(49000);
  });

  it("membuat nomor pesanan acak yang tidak berurutan", () => {
    const a = buatPesanan(permintaan(), TOKO);
    const b = buatPesanan(permintaan(), TOKO);

    expect(a.ok && b.ok).toBe(true);
    if (!a.ok || !b.ok) return;

    expect(a.pesanan.order_no).not.toBe(b.pesanan.order_no);
    expect(a.pesanan.order_no).toMatch(/^MNK-[A-Z2-9]{8}$/);
  });

  it("membuat invoice dan tanggal kedaluwarsa", () => {
    const hasil = buatPesanan(permintaan(), TOKO);
    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;

    expect(hasil.pesanan.xendit_invoice_url).toContain(hasil.pesanan.order_no);
    expect(hasil.pesanan.expires_at).toBeTruthy();
    expect(new Date(hasil.pesanan.expires_at!).getTime()).toBeGreaterThan(
      Date.now(),
    );
  });

  it("membersihkan spasi dan tanda hubung di nomor HP", () => {
    const hasil = buatPesanan(
      permintaan({ phone: "0812 3456-7890" }),
      TOKO,
    );

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(hasil.pesanan.phone).toBe("081234567890");
  });

  it("selalu mulai dari status PENDING", () => {
    const hasil = buatPesanan(permintaan(), TOKO);
    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(hasil.pesanan.status).toBe("PENDING");
  });
});

describe("tandaiTerbayar", () => {
  it("mengubah PENDING jadi PAID", () => {
    const hasil = tandaiTerbayar("MNK-5RJ2NE88", "BCA");

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(hasil.pesanan.status).toBe("PAID");
    expect(hasil.pesanan.payment_method).toBe("BCA");
    expect(hasil.pesanan.paid_at).toBeTruthy();
    expect(hasil.sudahPernah).toBe(false);
  });

  it("idempoten: dipanggil dua kali tidak menimpa waktu bayar", () => {
    const pertama = tandaiTerbayar("MNK-5RJ2NE88", "BCA");
    expect(pertama.ok).toBe(true);
    if (!pertama.ok) return;

    const waktu = pertama.pesanan.paid_at;
    const kedua = tandaiTerbayar("MNK-5RJ2NE88", "QRIS");

    expect(kedua.ok).toBe(true);
    if (!kedua.ok) return;
    expect(kedua.sudahPernah).toBe(true);
    expect(kedua.pesanan.paid_at).toBe(waktu);
    expect(kedua.pesanan.payment_method).toBe("BCA");
  });

  it("menolak pesanan yang tidak ada", () => {
    const hasil = tandaiTerbayar("MNK-TIDAKADA", "BCA");

    expect(hasil.ok).toBe(false);
    if (hasil.ok) return;
    expect(hasil.alasan).toBe("not_found");
  });

  it("menolak pesanan yang sudah kedaluwarsa", () => {
    const hasil = tandaiTerbayar("MNK-VT94KD16", "BCA");

    expect(hasil.ok).toBe(false);
    if (hasil.ok) return;
    expect(hasil.alasan).toBe("invalid_status");
  });

  it("menolak pesanan yang sudah dikirim", () => {
    const hasil = tandaiTerbayar("MNK-QP61VZ07", "BCA");

    expect(hasil.ok).toBe(false);
  });

  it("tidak peduli huruf besar-kecil", () => {
    const hasil = tandaiTerbayar("mnk-5rj2ne88", "BCA");
    expect(hasil.ok).toBe(true);
  });
});

describe("cariPesanan", () => {
  it("menemukan tanpa peduli huruf besar-kecil dan spasi", () => {
    expect(cariPesanan("  mnk-7k3qx9f2  ")?.order_no).toBe("MNK-7K3QX9F2");
  });

  it("mengembalikan undefined kalau tidak ada", () => {
    expect(cariPesanan("MNK-NGAWUR1")).toBeUndefined();
  });
});

describe("kedaluwarsa", () => {
  it("menganggap PENDING yang lewat batas sebagai kedaluwarsa", () => {
    const hasil = buatPesanan(permintaan(), TOKO);
    if (!hasil.ok) throw new Error("gagal buat pesanan");

    const besokLusa = new Date(Date.now() + 48 * 60 * 60 * 1000);
    expect(kedaluwarsa(hasil.pesanan, besokLusa)).toBe(true);
    expect(kedaluwarsa(hasil.pesanan, new Date())).toBe(false);
  });

  it("tidak menganggap pesanan yang sudah dibayar sebagai kedaluwarsa", () => {
    const hasil = buatPesanan(permintaan(), TOKO);
    if (!hasil.ok) throw new Error("gagal buat pesanan");

    tandaiTerbayar(hasil.pesanan.order_no, "BCA");

    const besokLusa = new Date(Date.now() + 48 * 60 * 60 * 1000);
    expect(kedaluwarsa(hasil.pesanan, besokLusa)).toBe(false);
  });
});

describe("kedaluwarsakanSatu", () => {
  it("mengubah status jadi EXPIRED dan mengembalikan stok", () => {
    const produk = products.find((p) => p.slug === "bye-bye-cat-50g")!;
    const stokAwal = produk.stock;

    const hasil = buatPesanan(
      permintaan({ items: [{ slug: "bye-bye-cat-50g", qty: 3 }] }),
      TOKO,
    );
    if (!hasil.ok) throw new Error("gagal buat pesanan");

    expect(produk.stock).toBe(stokAwal - 3);

    const besokLusa = new Date(Date.now() + 48 * 60 * 60 * 1000);
    const disapu = kedaluwarsakanSatu(hasil.pesanan, besokLusa);

    expect(disapu).toBe(true);
    expect(hasil.pesanan.status).toBe("EXPIRED");
    expect(produk.stock).toBe(stokAwal);
  });

  it("tidak menyentuh pesanan yang belum lewat batas", () => {
    const hasil = buatPesanan(permintaan(), TOKO);
    if (!hasil.ok) throw new Error("gagal buat pesanan");

    expect(kedaluwarsakanSatu(hasil.pesanan, new Date())).toBe(false);
    expect(hasil.pesanan.status).toBe("PENDING");
  });

  it("tidak mengembalikan stok dua kali walau dipanggil berulang", () => {
    const produk = products.find((p) => p.slug === "bye-bye-cat-50g")!;
    const stokAwal = produk.stock;

    const hasil = buatPesanan(
      permintaan({ items: [{ slug: "bye-bye-cat-50g", qty: 2 }] }),
      TOKO,
    );
    if (!hasil.ok) throw new Error("gagal buat pesanan");

    const besokLusa = new Date(Date.now() + 48 * 60 * 60 * 1000);
    kedaluwarsakanSatu(hasil.pesanan, besokLusa);
    kedaluwarsakanSatu(hasil.pesanan, besokLusa);
    kedaluwarsakanSatu(hasil.pesanan, besokLusa);

    expect(produk.stock).toBe(stokAwal);
  });

  it("tidak menyentuh pesanan yang sudah dibayar", () => {
    const produk = products.find((p) => p.slug === "bye-bye-cat-50g")!;
    const stokAwal = produk.stock;

    const hasil = buatPesanan(permintaan(), TOKO);
    if (!hasil.ok) throw new Error("gagal buat pesanan");

    tandaiTerbayar(hasil.pesanan.order_no, "BCA");

    const besokLusa = new Date(Date.now() + 48 * 60 * 60 * 1000);
    expect(kedaluwarsakanSatu(hasil.pesanan, besokLusa)).toBe(false);
    expect(hasil.pesanan.status).toBe("PAID");
    expect(produk.stock).toBe(stokAwal - 1);
  });
});

describe("sapuKedaluwarsa", () => {
  it("menyapu semua pesanan yang lewat batas sekaligus", () => {
    const a = buatPesanan(permintaan(), TOKO);
    const b = buatPesanan(permintaan(), TOKO);
    if (!a.ok || !b.ok) throw new Error("gagal buat pesanan");

    const besokLusa = new Date(Date.now() + 48 * 60 * 60 * 1000);
    const disapu = sapuKedaluwarsa(besokLusa);

    expect(disapu).toContain(a.pesanan.order_no);
    expect(disapu).toContain(b.pesanan.order_no);
  });

  it("mengembalikan daftar kosong kalau tidak ada yang kedaluwarsa", () => {
    buatPesanan(permintaan(), TOKO);
    expect(sapuKedaluwarsa(new Date())).toEqual([]);
  });

  it("pesanan yang kedaluwarsa tidak bisa dibayar lagi", () => {
    const hasil = buatPesanan(permintaan(), TOKO);
    if (!hasil.ok) throw new Error("gagal buat pesanan");

    const besokLusa = new Date(Date.now() + 48 * 60 * 60 * 1000);
    sapuKedaluwarsa(besokLusa);

    const bayar = tandaiTerbayar(hasil.pesanan.order_no, "BCA");
    expect(bayar.ok).toBe(false);
  });
});
