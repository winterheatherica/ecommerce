import { afterAll, beforeEach, describe, expect, it } from "vitest";

import type { Sql } from "../lib/db";
import { bersihkan, koneksiTes } from "./db";

const sql: Sql = koneksiTes();

beforeEach(async () => {
  await bersihkan(sql);
});

afterAll(async () => {
  await sql.end();
});

describe("database tes", () => {
  it("punya semua tabel yang dibutuhkan", async () => {
    const baris = await sql<{ tablename: string }[]>`
      select tablename from pg_tables
      where schemaname = 'public'
      order by tablename
    `;

    expect(baris.map((b) => b.tablename)).toEqual([
      "order_items",
      "orders",
      "product_images",
      "products",
      "regions",
      "shipping_quotes",
      "webhook_events",
    ]);
  });

  it("menyalakan row level security di semua tabel", async () => {
    const baris = await sql<{ tablename: string; rowsecurity: boolean }[]>`
      select tablename, rowsecurity from pg_tables
      where schemaname = 'public'
    `;

    expect(baris.every((b) => b.rowsecurity)).toBe(true);
  });

  it("mengisi 11 produk dengan deskripsi", async () => {
    const [hasil] = await sql<{ jumlah: number; kosong: number }[]>`
      select
        count(*)::int as jumlah,
        count(*) filter (where description is null or description = '')::int as kosong
      from products
    `;

    expect(hasil.jumlah).toBe(11);
    expect(hasil.kosong).toBe(0);
  });

  it("mengisi 12 kecamatan", async () => {
    const [hasil] = await sql<{ jumlah: number }[]>`
      select count(*)::int as jumlah from regions
    `;

    expect(hasil.jumlah).toBe(12);
  });

  it("menolak stok minus lewat constraint", async () => {
    await expect(
      sql`update products set stock = -1 where slug = 'bye-bye-cat-50g'`,
    ).rejects.toThrow();
  });

  it("menolak order_no kembar lewat constraint", async () => {
    const buat = (no: string) => sql`
      insert into orders (
        order_no, customer_name, phone, address,
        dest_id, courier, service, weight_g,
        subtotal, shipping_cost, total
      ) values (
        ${no}, 'Uji', '08123456789', 'Alamat uji yang cukup panjang',
        '50001', 'jne', 'reg', 100,
        10000, 9000, 19000
      )
    `;

    await buat("SAMA123");
    await expect(buat("SAMA123")).rejects.toThrow();
  });

  it("mengembalikan keadaan awal sebelum tiap tes", async () => {
    await sql`update products set stock = 0`;

    const [sebelum] = await sql<{ total: number }[]>`
      select sum(stock)::int as total from products
    `;
    expect(sebelum.total).toBe(0);

    await bersihkan(sql);

    const [sesudah] = await sql<{ total: number }[]>`
      select sum(stock)::int as total from products
    `;
    expect(sesudah.total).toBeGreaterThan(0);
  });
});
