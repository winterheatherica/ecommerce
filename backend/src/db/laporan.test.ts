import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { Sql } from "../lib/db";
import type { OpsiOngkir } from "../lib/shipping";
import { bersihkan, koneksiTes } from "../test/db";
import { bacaZip } from "../test/zip";
import { ambilLaporan, laporanCsv, laporanXlsx, type Laporan } from "./laporan";
import { buatPesanan, tandaiDikirim, tandaiSelesai, tandaiTerbayar, type CariOngkir } from "./pesanan";

const sql: Sql = koneksiTes();
const ONGKIR: OpsiOngkir[] = [{ courier: "JNE", service: "CTC", cost: 9000, etd: "1-2" }];
const cariOngkir: CariOngkir = async () => ONGKIR;
const RENTANG = { dari: "2026-10-10", sampai: "2026-10-16" };
const RESI = "300380022869426";

type Waktu = { dibuat: string; dibayar?: string; dikirim?: string; diterima?: string; status?: string };

async function pesan(phone: string, nama: string, qty: number): Promise<string> {
  const hasil = await buatPesanan(
    sql,
    {
      customer_name: nama,
      phone,
      email: `${nama.toLowerCase()}@contoh.test`,
      address: "Jl. Uji No. 1",
      dest_id: "50001",
      courier: "JNE",
      service: "CTC",
      items: [{ slug: "bye-bye-cat-50g", qty }],
    },
    1,
    cariOngkir,
  );
  if (!hasil.ok) throw new Error(`Gagal membuat pesanan: ${hasil.badan.error}`);
  return hasil.pesanan.order_no;
}

async function atur(nomor: string, w: Waktu): Promise<void> {
  await sql`
    update orders set
      created_at = ${w.dibuat}::timestamptz,
      paid_at = ${w.dibayar ?? null}::timestamptz,
      shipped_at = ${w.dikirim ?? null}::timestamptz,
      delivered_at = ${w.diterima ?? null}::timestamptz,
      status = coalesce(${w.status ?? null}::text, status)
    where order_no = ${nomor}
  `;
}

async function total(nomor: string) {
  const [o] = await sql<{ id: number; total: number; subtotal: number }[]>`
    select id::int as id, total, subtotal from orders where order_no = ${nomor}
  `;
  return o;
}

let laporan: Laporan;
const nomor: Record<string, string> = {};

beforeAll(async () => {
  await bersihkan(sql);
  await sql`truncate users restart identity cascade`;

  nomor.a = await pesan("081200000001", "Ani", 2);
  await tandaiTerbayar(sql, nomor.a, "QRIS");
  await tandaiDikirim(sql, nomor.a, RESI);
  await tandaiSelesai(sql, nomor.a);
  await atur(nomor.a, {
    dibuat: "2026-10-10T09:15:00+07:00",
    dibayar: "2026-10-10T09:30:00+07:00",
    dikirim: "2026-10-11T10:30:00+07:00",
    diterima: "2026-10-13T10:30:00+07:00",
  });

  nomor.b = await pesan("081200000002", "Budi", 1);
  await tandaiTerbayar(sql, nomor.b, "BNI Virtual Account");
  await atur(nomor.b, { dibuat: "2026-10-12T20:05:00+07:00", dibayar: "2026-10-12T21:05:00+07:00" });

  nomor.d = await pesan("081200000002", "Budi", 1);
  await tandaiTerbayar(sql, nomor.d, "QRIS");
  await atur(nomor.d, { dibuat: "2026-10-05T10:00:00+07:00", dibayar: "2026-10-05T10:10:00+07:00" });

  nomor.e = await pesan("081200000003", "Citra", 1);
  await atur(nomor.e, { dibuat: "2026-10-14T23:40:00+07:00", status: "EXPIRED" });

  nomor.f = await pesan("081200000003", "Citra", 3);
  await tandaiTerbayar(sql, nomor.f, "QRIS");
  await atur(nomor.f, { dibuat: "2026-10-16T22:00:00+07:00", dibayar: "2026-10-17T08:00:00+07:00" });

  const [varian] = await sql<{ id: number }[]>`
    select v.id::int as id from product_variants v join products p on p.id = v.product_id
    where p.slug = 'bye-bye-cat-50g' limit 1
  `;
  const a = await total(nomor.a);
  await sql`
    insert into reviews (variant_id, source, rating, author_name, body, reviewed_at)
    values (${varian.id}, 'shopee', 4, 'Pembeli Shopee', 'Mantap', '2026-10-11T12:00:00+07:00')
  `;
  await sql`
    insert into reviews (variant_id, source, rating, author_name, body, reviewed_at, order_id)
    values (${varian.id}, 'web', 5, 'Ani', 'Bagus', '2026-10-14T12:00:00+07:00', ${a.id})
  `;
  await sql`
    insert into users (google_sub, email, name, created_at)
    values ('uji-1', 'uji@contoh.test', 'Uji', '2026-10-12T08:00:00+07:00')
  `;

  laporan = await ambilLaporan(sql, RENTANG);
});

afterAll(async () => {
  await bersihkan(sql);
  await sql.end();
});

describe("ambilLaporan", () => {
  it("menghitung pendapatan dari pesanan yang dibayar di periode itu saja", async () => {
    const [a, b] = await Promise.all([total(nomor.a), total(nomor.b)]);

    expect(laporan.summary).toMatchObject({
      revenue: a.total + b.total,
      product_sales: a.subtotal + b.subtotal,
      shipping: 18000,
      paid_orders: 2,
      items: 3,
      buyers: 2,
      new_buyers: 1,
      returning_buyers: 1,
      created_orders: 4,
      created_paid_orders: 3,
      aov: Math.round((a.total + b.total) / 2),
    });
    expect(laporan.previous_summary).toMatchObject({ paid_orders: 1, buyers: 1, new_buyers: 1 });
    expect(laporan.range).toEqual({
      from: "2026-10-10",
      to: "2026-10-16",
      days: 7,
      bucket: "day",
      all: false,
      previous: { from: "2026-10-03", to: "2026-10-09" },
    });
  });

  it("mengisi tren per hari termasuk hari tanpa penjualan", async () => {
    const [a, b] = await Promise.all([total(nomor.a), total(nomor.b)]);

    expect(laporan.trend.map((t) => t.start)).toEqual([
      "2026-10-10",
      "2026-10-11",
      "2026-10-12",
      "2026-10-13",
      "2026-10-14",
      "2026-10-15",
      "2026-10-16",
    ]);
    expect(laporan.trend[0]).toEqual({ start: "2026-10-10", revenue: a.total, orders: 1, items: 2 });
    expect(laporan.trend[2]).toEqual({ start: "2026-10-12", revenue: b.total, orders: 1, items: 1 });
    expect(laporan.trend[1]).toEqual({ start: "2026-10-11", revenue: 0, orders: 0, items: 0 });
  });

  it("mengelompokkan status pesanan yang dibuat di periode itu", () => {
    const status = Object.fromEntries(laporan.statuses.map((s) => [s.status, s.orders]));

    expect(status).toEqual({ DELIVERED: 1, PAID: 2, EXPIRED: 1 });
  });

  it("merinci produk, kategori, pembayaran, kurir, dan wilayah", async () => {
    const [a, b] = await Promise.all([total(nomor.a), total(nomor.b)]);
    const [wilayah] = await sql<{ province: string; city: string }[]>`select province, city from regions where id = '50001'`;

    expect(laporan.top_products).toHaveLength(1);
    expect(laporan.top_products[0]).toMatchObject({ slug: "bye-bye-cat-50g", qty: 3, revenue: a.subtotal + b.subtotal });
    expect(laporan.unsold_products.some((p) => p.slug === "bye-bye-cat-50g")).toBe(false);
    expect(laporan.unsold_products.length).toBeGreaterThan(0);
    expect(laporan.categories).toHaveLength(1);
    expect(laporan.categories[0]).toMatchObject({ orders: 2, qty: 3 });
    expect(laporan.payments.map((p) => [p.method, p.orders])).toEqual(
      expect.arrayContaining([
        ["QRIS", 1],
        ["BNI Virtual Account", 1],
      ]),
    );
    expect(laporan.couriers).toEqual([
      { courier: "JNE", orders: 2, shipping: 18000, avg_shipping: 9000, avg_weight_g: expect.any(Number) },
    ]);
    expect(laporan.provinces).toEqual([{ province: wilayah.province, orders: 2, revenue: a.total + b.total }]);
    expect(laporan.cities[0]).toMatchObject({ city: wilayah.city, orders: 2 });
  });

  it("menghitung lama bayar, lama dikirim, dan lama sampai", () => {
    expect(laporan.durations).toEqual({
      pay_minutes: 37.5,
      pay_count: 2,
      ship_hours: 25,
      ship_count: 1,
      deliver_days: 2,
      deliver_count: 1,
    });
  });

  it("merangkum pelanggan, ulasan, dan jam belanja", () => {
    expect(laporan.customers).toMatchObject({ new_accounts: 1, guest_orders: 2, account_orders: 0 });
    expect(laporan.customers.top.map((c) => c.name).sort()).toEqual(["Ani", "Budi"]);

    expect(laporan.reviews.by_source).toEqual(
      expect.arrayContaining([
        { source: "shopee", count: 1, average: 4 },
        { source: "web", count: 1, average: 5 },
      ]),
    );
    expect(laporan.reviews.by_rating).toEqual([
      { rating: 5, count: 1 },
      { rating: 4, count: 1 },
    ]);
    expect(laporan.reviews.all_time).toEqual({ count: 2, average: 4.5 });

    const hariIso = (iso: string) => ((new Date(iso).getUTCDay() + 6) % 7) + 1;
    expect(laporan.heatmap).toEqual(
      expect.arrayContaining([
        { dow: hariIso("2026-10-10T09:15:00+07:00"), hour: 9, orders: 1 },
        { dow: hariIso("2026-10-12T20:05:00+07:00"), hour: 20, orders: 1 },
        { dow: hariIso("2026-10-14T23:40:00+07:00"), hour: 23, orders: 1 },
        { dow: hariIso("2026-10-16T22:00:00+07:00"), hour: 22, orders: 1 },
      ]),
    );
    expect(laporan.heatmap).toHaveLength(4);
  });

  it("mode semua waktu mulai dari pesanan pertama dan tanpa pembanding", async () => {
    const semua = await ambilLaporan(sql, null, new Date("2026-10-20T03:00:00Z"));

    expect(semua.range).toMatchObject({ from: "2026-10-05", to: "2026-10-20", all: true, previous: null });
    expect(semua.previous_summary).toBeNull();
    expect(semua.summary.paid_orders).toBe(4);
  });

  it("ulasan di mode semua waktu tidak tersaring tanggal pesanan pertama, dan cuma menghitung yang tampil", async () => {
    const [kucing] = await sql<{ id: number }[]>`
      select v.id::int as id from product_variants v join products p on p.id = v.product_id
      where p.slug = 'bye-bye-cat-50g' limit 1
    `;
    const [lain] = await sql<{ id: number }[]>`
      select v.id::int as id from product_variants v join products p on p.id = v.product_id
      where p.slug <> 'bye-bye-cat-50g' order by v.id limit 1
    `;
    await sql`update product_variants set is_active = false where id = ${lain.id}`;
    await sql`
      insert into reviews (variant_id, source, external_id, rating, author_name, body, reviewed_at, reviewed_precision)
      values
        (${kucing.id}, 'tokopedia', 'lama-1', 3, 'T***a', 'Lumayan', '2025-10-20T00:00:00Z', 'over_year'),
        (${kucing.id}, 'shopee', 'awal-1', 5, 's*****1', 'Mantap', '2026-06-01T12:00:00+07:00', 'day'),
        (${lain.id}, 'shopee', 'nonaktif-1', 1, 'n*****1', 'Jelek', '2026-10-13T12:00:00+07:00', 'day')
    `;

    try {
      const semua = await ambilLaporan(sql, null, new Date("2026-10-20T03:00:00Z"));
      expect(semua.reviews.all_time).toEqual({ count: 4, average: 4.25 });
      expect(semua.reviews.by_source).toEqual(
        expect.arrayContaining([
          { source: "shopee", count: 2, average: 4.5 },
          { source: "tokopedia", count: 1, average: 3 },
          { source: "web", count: 1, average: 5 },
        ]),
      );

      const periode = await ambilLaporan(sql, RENTANG);
      expect(periode.reviews.by_source).toEqual(
        expect.arrayContaining([
          { source: "shopee", count: 1, average: 4 },
          { source: "web", count: 1, average: 5 },
        ]),
      );
      expect(periode.reviews.by_source).toHaveLength(2);
    } finally {
      await sql`delete from reviews where external_id in ('lama-1', 'awal-1', 'nonaktif-1')`;
      await sql`update product_variants set is_active = true where id = ${lain.id}`;
    }
  });
});

function pecahCsv(baris: string): string[] {
  const sel: string[] = [];
  let isi = "";
  let kutip = false;

  for (let i = 0; i < baris.length; i++) {
    const c = baris[i];
    if (kutip && c === '"' && baris[i + 1] === '"') {
      isi += '"';
      i++;
    } else if (c === '"') {
      kutip = !kutip;
    } else if (c === "," && !kutip) {
      sel.push(isi);
      isi = "";
    } else {
      isi += c;
    }
  }
  sel.push(isi);
  return sel;
}

describe("ekspor pesanan", () => {
  it("CSV berisi semua pesanan yang dibuat di periode itu, urut waktu, dengan resi sebagai teks", async () => {
    const csv = await laporanCsv(sql, RENTANG);
    const baris = csv.replace(/^﻿/, "").trim().split("\r\n").map(pecahCsv);

    expect(baris).toHaveLength(5);
    expect(baris.every((b) => b.length === 21)).toBe(true);
    expect(baris[0].slice(0, 3)).toEqual(["No. pesanan", "Dibuat (WIB)", "Status"]);
    expect(baris.slice(1).map((b) => b[0])).toEqual([nomor.a, nomor.b, nomor.e, nomor.f]);
    expect(baris[1].slice(1, 4)).toEqual(["2026-10-10 09:15", "Selesai", "2026-10-10 09:30"]);
    expect(baris[1][7]).toBe('="081200000001"');
    expect(baris[1][14]).toBe(`="${RESI}"`);
    expect(baris[2][2]).toBe("Dibayar, perlu dikirim");
    expect(baris[3][2]).toBe("Kedaluwarsa");
    expect(baris.slice(1).map((b) => b[16])).toEqual(["QRIS", "VA BNI", "", "QRIS"]);
  });

  it("Excel berisi baris yang sama dengan tanggal, angka, dan nomor HP yang tidak berubah", async () => {
    const a = await total(nomor.a);
    const sheet = bacaZip(await laporanXlsx(sql, RENTANG))["xl/worksheets/sheet1.xml"];

    expect(sheet.match(/<row /g)).toHaveLength(5);
    expect(sheet).toContain(`<c r="A2" t="inlineStr"><is><t>${nomor.a}</t></is></c>`);
    expect(sheet).toMatch(/<c r="B2" s="3"><v>46305\.38541666/);
    expect(sheet).toContain('<c r="H2" t="inlineStr"><is><t>081200000001</t></is></c>');
    expect(sheet).toContain(`<c r="O2" t="inlineStr"><is><t>${RESI}</t></is></c>`);
    expect(sheet).toContain(`<c r="T2" s="2"><v>${a.total}</v></c>`);
    expect(sheet).toContain('<autoFilter ref="A1:U5"/>');
  });
});
