import { afterAll, beforeEach, describe, expect, it } from "vitest";

import type { Sql } from "../lib/db";
import type { OpsiOngkir } from "../lib/shipping";
import { bersihkan, koneksiTes, pecahUkuran } from "../test/db";
import { buatPesanan, type CariOngkir, type PermintaanPesanan } from "./pesanan";

const sql: Sql = koneksiTes();
const KUCING = "bye-bye-cat-50g";
const ONGKIR: OpsiOngkir[] = [{ courier: "JNE", service: "REG", cost: 9000, etd: "1-2" }];
const cariOngkir: CariOngkir = async () => ONGKIR;

beforeEach(async () => {
  await bersihkan(sql);
  await pecahUkuran(sql, KUCING, [
    { slug: "uji-a", label: "50 g", price: 30000, weight_g: 100, stock: 100 },
    { slug: "uji-b", label: "80 g", price: 40000, weight_g: 100, stock: 100 },
    { slug: "uji-c", label: "220 ml", price: 50000, weight_g: 100, stock: 100 },
  ]);
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
    items: [{ slug: "uji-a", qty: 1 }],
    ...ubah,
  };
}

const pesan = (ubah: Partial<PermintaanPesanan> = {}) =>
  buatPesanan(sql, permintaan(ubah), 6, cariOngkir);

describe("batas jumlah barang", () => {
  it("lebih dari 20 per ukuran ditolak, termasuk kalau dipecah jadi beberapa baris", async () => {
    const satu = await pesan({ items: [{ slug: "uji-a", qty: 21 }] });
    expect(!satu.ok && satu.badan.error).toBe("qty_too_large");

    const pecah = await pesan({
      items: [
        { slug: "uji-a", qty: 15 },
        { slug: "uji-a", qty: 10 },
      ],
    });
    expect(!pecah.ok && pecah.badan.error).toBe("qty_too_large");

    const pas = await pesan({ items: [{ slug: "uji-a", qty: 20 }] });
    expect(pas.ok).toBe(true);
  });

  it("lebih dari 50 barang dalam satu pesanan ditolak", async () => {
    const hasil = await pesan({
      items: [
        { slug: "uji-a", qty: 20 },
        { slug: "uji-b", qty: 20 },
        { slug: "uji-c", qty: 11 },
      ],
    });
    expect(!hasil.ok && hasil.badan.error).toBe("order_too_many_items");
  });

  it("pesanan yang ditolak tidak mengurangi stok", async () => {
    await pesan({ items: [{ slug: "uji-a", qty: 25 }] });

    const [v] = await sql<{ stock: number }[]>`select stock from product_variants where slug = 'uji-a'`;
    expect(v.stock).toBe(100);
  });
});

describe("batas pesanan belum dibayar", () => {
  it("pesanan keempat dengan nomor HP yang sama ditolak sampai ada yang dibayar atau kedaluwarsa", async () => {
    for (let i = 0; i < 3; i++) {
      const ok = await pesan({ email: `beda${i}@contoh.test` });
      expect(ok.ok).toBe(true);
    }

    const keempat = await pesan({ email: "lain@contoh.test" });
    expect(!keempat.ok && keempat.badan.error).toBe("too_many_unpaid");
    expect(!keempat.ok && keempat.status).toBe(429);

    const nomorLain = await pesan({ phone: "0857-1111-2222", email: "baru@contoh.test" });
    expect(nomorLain.ok).toBe(true);
  });

  it("email yang sama juga dihitung, tanpa peduli huruf besar kecil", async () => {
    for (let i = 0; i < 3; i++) {
      await pesan({ phone: `08123400000${i}`, email: "Rina@Contoh.Test" });
    }

    const keempat = await pesan({ phone: "081299999999", email: "rina@contoh.test" });
    expect(!keempat.ok && keempat.badan.error).toBe("too_many_unpaid");
  });

  it("pesanan yang sudah lewat batas waktu tidak ikut dihitung", async () => {
    for (let i = 0; i < 3; i++) await pesan();
    await sql`update orders set expires_at = now() - interval '1 minute'`;

    const baru = await pesan();
    expect(baru.ok).toBe(true);
  });
});
