import { afterAll, beforeEach, describe, expect, it } from "vitest";

import type { Sql } from "../lib/db";
import type { OpsiOngkir } from "../lib/shipping";
import { bersihkan, koneksiTes } from "../test/db";
import { buatPesanan, cariPesanan, type CariOngkir, type PermintaanPesanan } from "./pesanan";
import { satuProduk, satuProdukAdmin } from "./produk";
import { perbaruiVarian } from "./varian";

const sql: Sql = koneksiTes();
const KUCING = "bye-bye-cat-50g";
const NORMAL = 49000;

const ONGKIR: OpsiOngkir[] = [{ courier: "JNE", service: "REG", cost: 9000, etd: "1-2" }];
const cariOngkir: CariOngkir = async () => ONGKIR;

beforeEach(async () => {
  await bersihkan(sql);
});

afterAll(async () => {
  await sql.end();
});

function permintaan(ubah: Partial<PermintaanPesanan> = {}): PermintaanPesanan {
  return {
    customer_name: "Rina Kartika",
    phone: "0812-3456-7890",
    email: "rina@contoh.test",
    address: "Jl. Cihampelas No. 42, Bandung",
    dest_id: "50001",
    courier: "JNE",
    service: "REG",
    items: [{ slug: KUCING, qty: 2 }],
    ...ubah,
  };
}

async function pasangPromo(ubah: {
  harga?: number | null;
  mulai?: string | null;
  akhir?: string | null;
  tampilkan?: boolean;
}) {
  await sql`
    update product_variants set
      promo_price = ${ubah.harga === undefined ? 39000 : ubah.harga},
      promo_starts_at = ${ubah.mulai ?? null},
      promo_ends_at = ${ubah.akhir ?? null},
      promo_show_period = ${ubah.tampilkan ?? false}
    where slug = ${KUCING}
  `;
}

async function varianToko() {
  const produk = await satuProduk(sql, KUCING);
  return produk!.variants[0];
}

const nantiJam = (jam: number) => new Date(Date.now() + jam * 3600_000).toISOString();

describe("harga yang dilihat pembeli", () => {
  it("promo tanpa tanggal langsung berlaku, harga normal ikut dikirim untuk dicoret", async () => {
    await pasangPromo({});
    const v = await varianToko();

    expect(v.price).toBe(39000);
    expect(v.regular_price).toBe(NORMAL);
  });

  it("tanggal berakhir disembunyikan secara bawaan, supaya promo bisa dihentikan lebih awal tanpa membuat pembeli kaget", async () => {
    await pasangPromo({ akhir: nantiJam(48) });
    expect((await varianToko()).promo_visible_until).toBeNull();
  });

  it("tanggal berakhir dikirim hanya kalau admin memilih menampilkannya", async () => {
    const akhir = nantiJam(48);
    await pasangPromo({ akhir, tampilkan: true });

    expect(new Date((await varianToko()).promo_visible_until!).toISOString()).toBe(akhir);
  });

  it("promo yang belum mulai belum berlaku", async () => {
    await pasangPromo({ mulai: nantiJam(1) });
    const v = await varianToko();

    expect(v.price).toBe(NORMAL);
    expect(v.regular_price).toBeNull();
  });

  it("promo yang sudah lewat otomatis berhenti tanpa perlu diubah admin", async () => {
    await pasangPromo({ mulai: nantiJam(-48), akhir: nantiJam(-1), tampilkan: true });
    const v = await varianToko();

    expect(v.price).toBe(NORMAL);
    expect(v.regular_price).toBeNull();
    expect(v.promo_visible_until).toBeNull();
  });

  it("admin tetap melihat harga normal beserta status promonya", async () => {
    await pasangPromo({ mulai: nantiJam(1) });
    const admin = await satuProdukAdmin(sql, KUCING);
    const v = admin!.variants[0];

    expect(v.price).toBe(NORMAL);
    expect(v.promo_price).toBe(39000);
    expect(v.promo_active).toBe(false);
    expect(v.promo_status).toBe("scheduled");
  });

  it("status promo dihitung dari jam database, bukan jam perangkat admin", async () => {
    const status = async () => (await satuProdukAdmin(sql, KUCING))!.variants[0].promo_status;

    expect(await status()).toBe("none");
    await pasangPromo({});
    expect(await status()).toBe("active");
    await pasangPromo({ mulai: nantiJam(-48), akhir: nantiJam(-1) });
    expect(await status()).toBe("ended");
  });
});

describe("pesanan saat promo", () => {
  it("membayar harga promo dan mencatat harga normalnya", async () => {
    await pasangPromo({});

    const hasil = await buatPesanan(sql, permintaan(), 1, cariOngkir);
    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;

    const item = hasil.pesanan.items[0];
    expect(item.price_snapshot).toBe(39000);
    expect(item.list_price_snapshot).toBe(NORMAL);
    expect(hasil.pesanan.subtotal).toBe(78000);
    expect(hasil.pesanan.total).toBe(87000);
  });

  it("harga pesanan tidak ikut berubah setelah promonya berakhir", async () => {
    await pasangPromo({});
    const hasil = await buatPesanan(sql, permintaan(), 1, cariOngkir);
    if (!hasil.ok) throw new Error("pesanan gagal");

    await pasangPromo({ akhir: nantiJam(-1) });
    await sql`update product_variants set price = 59000 where slug = ${KUCING}`;

    const lagi = await cariPesanan(sql, hasil.pesanan.order_no);

    expect(lagi?.items[0].price_snapshot).toBe(39000);
    expect(lagi?.items[0].list_price_snapshot).toBe(NORMAL);
    expect(lagi?.total).toBe(87000);
  });

  it("pesanan tanpa promo tidak menyimpan harga normal terpisah", async () => {
    const hasil = await buatPesanan(sql, permintaan(), 1, cariOngkir);
    if (!hasil.ok) throw new Error("pesanan gagal");

    expect(hasil.pesanan.items[0].price_snapshot).toBe(NORMAL);
    expect(hasil.pesanan.items[0].list_price_snapshot).toBeNull();
  });
});

describe("aturan yang dijaga database", () => {
  it("harga promo yang tidak lebih murah ditolak", async () => {
    for (const harga of [NORMAL, NORMAL + 1]) {
      expect(await perbaruiVarian(sql, KUCING, { promo_price: harga })).toEqual({
        ok: false,
        alasan: "promo_not_cheaper",
      });
    }
  });

  it("menurunkan harga normal sampai di bawah harga promo juga ditolak", async () => {
    await pasangPromo({});

    expect(await perbaruiVarian(sql, KUCING, { price: 30000 })).toEqual({
      ok: false,
      alasan: "promo_not_cheaper",
    });
  });

  it("tanggal berakhir sebelum tanggal mulai ditolak walau diisi terpisah", async () => {
    await perbaruiVarian(sql, KUCING, { promo_price: 39000, promo_starts_at: nantiJam(24) });

    expect(await perbaruiVarian(sql, KUCING, { promo_ends_at: nantiJam(1) })).toEqual({
      ok: false,
      alasan: "promo_period_reversed",
    });
  });

  it("promo bisa dihentikan dengan mengosongkan harganya", async () => {
    await pasangPromo({ akhir: nantiJam(48) });

    const hasil = await perbaruiVarian(sql, KUCING, {
      promo_price: null,
      promo_starts_at: null,
      promo_ends_at: null,
    });

    expect(hasil.ok).toBe(true);
    expect((await varianToko()).price).toBe(NORMAL);
  });
});
