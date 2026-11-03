import type { Sql } from "../lib/db";
import {
  AMBANG_STOK_MENIPIS,
  LABEL_STATUS,
  geserHari,
  hariIniWib,
  jumlahHari,
  keCsv,
  labelMetode,
  pilihKelompok,
  rentangSebelumnya,
  type Kelompok,
  type Rentang,
} from "../lib/laporan";
import { buatXlsx, type KolomXlsx } from "../lib/xlsx";

type Batas = { awal: string; akhir: string };

export type Ringkasan = {
  revenue: number;
  product_sales: number;
  shipping: number;
  discount: number;
  paid_orders: number;
  created_orders: number;
  created_paid_orders: number;
  items: number;
  buyers: number;
  new_buyers: number;
  returning_buyers: number;
  aov: number;
};

export type Laporan = Awaited<ReturnType<typeof ambilLaporan>>;

function batas(r: Rentang): Batas {
  return { awal: `${r.dari}T00:00:00+07:00`, akhir: `${geserHari(r.sampai, 1)}T00:00:00+07:00` };
}

function dibayar(sql: Sql, b: Batas) {
  return sql`
    select o.*
    from orders o
    where o.status in ('PAID', 'SHIPPED', 'DELIVERED')
      and o.paid_at >= ${b.awal}::timestamptz
      and o.paid_at < ${b.akhir}::timestamptz
  `;
}

function dibuat(sql: Sql, b: Batas) {
  return sql`o.created_at >= ${b.awal}::timestamptz and o.created_at < ${b.akhir}::timestamptz`;
}

async function ringkasan(sql: Sql, r: Rentang): Promise<Ringkasan> {
  const b = batas(r);
  const [h] = await sql<Omit<Ringkasan, "aov">[]>`
    with b as (${dibayar(sql, b)}),
    kunci as (select distinct coalesce(b.user_id::text, b.phone) as kunci from b),
    pertama as (
      select coalesce(o.user_id::text, o.phone) as kunci, min(o.paid_at) as awal_beli
      from orders o
      where o.status in ('PAID', 'SHIPPED', 'DELIVERED') and o.paid_at is not null
      group by 1
    )
    select
      coalesce((select sum(b.total) from b), 0)::float8 as revenue,
      coalesce((select sum(b.subtotal) from b), 0)::float8 as product_sales,
      coalesce((select sum(b.shipping_cost) from b), 0)::float8 as shipping,
      coalesce((
        select sum(greatest(coalesce(oi.list_price_snapshot, oi.price_snapshot) - oi.price_snapshot, 0) * oi.qty)
        from order_items oi join b on b.id = oi.order_id
      ), 0)::float8 as discount,
      (select count(*) from b)::int as paid_orders,
      coalesce((select sum(oi.qty) from order_items oi join b on b.id = oi.order_id), 0)::int as items,
      (select count(*) from kunci)::int as buyers,
      (select count(*) from kunci join pertama using (kunci) where pertama.awal_beli >= ${b.awal}::timestamptz)::int as new_buyers,
      (select count(*) from kunci join pertama using (kunci) where pertama.awal_beli < ${b.awal}::timestamptz)::int as returning_buyers,
      (select count(*) from orders o where ${dibuat(sql, b)})::int as created_orders,
      (
        select count(*) from orders o
        where ${dibuat(sql, b)} and o.paid_at is not null and o.status in ('PAID', 'SHIPPED', 'DELIVERED')
      )::int as created_paid_orders
  `;

  return { ...h, aov: h.paid_orders > 0 ? Math.round(h.revenue / h.paid_orders) : 0 };
}

function tren(sql: Sql, r: Rentang, kelompok: Kelompok) {
  const b = batas(r);
  return sql<{ start: string; revenue: number; orders: number; items: number }[]>`
    with b as (${dibayar(sql, b)}),
    per as (
      select date_trunc(${kelompok}::text, b.paid_at at time zone 'Asia/Jakarta') as awal,
        count(*)::int as orders, sum(b.total)::float8 as revenue
      from b group by 1
    ),
    barang as (
      select date_trunc(${kelompok}::text, b.paid_at at time zone 'Asia/Jakarta') as awal, sum(oi.qty)::int as items
      from b join order_items oi on oi.order_id = b.id
      group by 1
    ),
    seri as (
      select generate_series(
        date_trunc(${kelompok}::text, ${r.dari}::timestamp),
        date_trunc(${kelompok}::text, ${r.sampai}::timestamp),
        ('1 ' || ${kelompok}::text)::interval
      ) as awal
    )
    select to_char(s.awal, 'YYYY-MM-DD') as start,
      coalesce(p.revenue, 0)::float8 as revenue,
      coalesce(p.orders, 0)::int as orders,
      coalesce(g.items, 0)::int as items
    from seri s
    left join per p on p.awal = s.awal
    left join barang g on g.awal = s.awal
    order by s.awal
  `;
}

function statusPesanan(sql: Sql, r: Rentang) {
  const b = batas(r);
  return sql<{ status: string; orders: number; value: number }[]>`
    select o.status, count(*)::int as orders, coalesce(sum(o.total), 0)::float8 as value
    from orders o
    where ${dibuat(sql, b)}
    group by o.status
  `;
}

async function tindakan(sql: Sql) {
  const [h] = await sql<
    { to_ship: number; in_transit: number; awaiting_payment: number; out_of_stock: number; low_stock: number }[]
  >`
    select
      (select count(*) from orders where status = 'PAID')::int as to_ship,
      (select count(*) from orders where status = 'SHIPPED')::int as in_transit,
      (select count(*) from orders where status = 'PENDING')::int as awaiting_payment,
      (
        select count(*) from product_variants v join products p on p.id = v.product_id
        where v.is_active and p.is_active and v.stock = 0
      )::int as out_of_stock,
      (
        select count(*) from product_variants v join products p on p.id = v.product_id
        where v.is_active and p.is_active and v.stock between 1 and ${AMBANG_STOK_MENIPIS}
      )::int as low_stock
  `;
  return h;
}

function produkTerlaris(sql: Sql, r: Rentang) {
  const b = batas(r);
  return sql<
    { slug: string | null; name: string; variant_label: string | null; variant_count: number; qty: number; revenue: number }[]
  >`
    with b as (${dibayar(sql, b)}),
    j as (
      select oi.variant_id, oi.product_id, sum(oi.qty)::int as qty,
        sum(oi.qty * oi.price_snapshot)::float8 as revenue, max(oi.name_snapshot) as nama
      from order_items oi join b on b.id = oi.order_id
      group by oi.variant_id, oi.product_id
    )
    select p.slug, coalesce(p.name, j.nama) as name, v.label as variant_label,
      (select count(*) from product_variants x where x.product_id = j.product_id)::int as variant_count,
      j.qty, j.revenue
    from j
    left join products p on p.id = j.product_id
    left join product_variants v on v.id = j.variant_id
    order by j.revenue desc, j.qty desc
    limit 10
  `;
}

function produkBelumTerjual(sql: Sql, r: Rentang) {
  const b = batas(r);
  return sql<{ slug: string; name: string }[]>`
    with b as (${dibayar(sql, b)})
    select p.slug, p.name
    from products p
    where p.is_active
      and not exists (select 1 from order_items oi join b on b.id = oi.order_id where oi.product_id = p.id)
    order by p.sort_order, p.name
  `;
}

function kategori(sql: Sql, r: Rentang) {
  const b = batas(r);
  return sql<{ slug: string; label: string; orders: number; qty: number; revenue: number }[]>`
    with b as (${dibayar(sql, b)})
    select p.category as slug, coalesce(c.label, p.category) as label,
      count(distinct oi.order_id)::int as orders, sum(oi.qty)::int as qty,
      sum(oi.qty * oi.price_snapshot)::float8 as revenue
    from order_items oi
    join b on b.id = oi.order_id
    join products p on p.id = oi.product_id
    left join categories c on c.slug = p.category
    group by p.category, c.label
    order by revenue desc, qty desc
  `;
}

function pembayaran(sql: Sql, r: Rentang) {
  const b = batas(r);
  return sql<{ channel: string; method: string; orders: number; revenue: number }[]>`
    with b as (${dibayar(sql, b)})
    select coalesce(b.payment_channel, '') as channel, coalesce(b.payment_method, '') as method,
      count(*)::int as orders, sum(b.total)::float8 as revenue
    from b
    group by 1, 2
    order by revenue desc, orders desc
  `;
}

function kurir(sql: Sql, r: Rentang) {
  const b = batas(r);
  return sql<{ courier: string; orders: number; shipping: number; avg_shipping: number; avg_weight_g: number }[]>`
    with b as (${dibayar(sql, b)})
    select b.courier, count(*)::int as orders, sum(b.shipping_cost)::float8 as shipping,
      avg(b.shipping_cost)::float8 as avg_shipping, avg(b.weight_g)::float8 as avg_weight_g
    from b
    group by b.courier
    order by orders desc, shipping desc
  `;
}

async function durasi(sql: Sql, r: Rentang) {
  const b = batas(r);
  const [h] = await sql<
    {
      pay_minutes: number | null;
      pay_count: number;
      ship_hours: number | null;
      ship_count: number;
      deliver_days: number | null;
      deliver_count: number;
    }[]
  >`
    with b as (${dibayar(sql, b)})
    select
      (avg(extract(epoch from (b.paid_at - b.created_at))) / 60)::float8 as pay_minutes,
      count(*)::int as pay_count,
      ((avg(extract(epoch from (b.shipped_at - b.paid_at))) filter (where b.shipped_at is not null)) / 3600)::float8
        as ship_hours,
      (count(*) filter (where b.shipped_at is not null))::int as ship_count,
      (
        (avg(extract(epoch from (b.delivered_at - b.shipped_at)))
          filter (where b.delivered_at is not null and b.shipped_at is not null)) / 86400
      )::float8 as deliver_days,
      (count(*) filter (where b.delivered_at is not null and b.shipped_at is not null))::int as deliver_count
    from b
  `;
  return h;
}

function provinsi(sql: Sql, r: Rentang) {
  const b = batas(r);
  return sql<{ province: string; orders: number; revenue: number }[]>`
    with b as (${dibayar(sql, b)})
    select rg.province, count(*)::int as orders, sum(b.total)::float8 as revenue
    from b join regions rg on rg.id = b.dest_id
    group by rg.province
    order by orders desc, revenue desc
    limit 10
  `;
}

function kota(sql: Sql, r: Rentang) {
  const b = batas(r);
  return sql<{ city: string; province: string; orders: number; revenue: number }[]>`
    with b as (${dibayar(sql, b)})
    select rg.city, rg.province, count(*)::int as orders, sum(b.total)::float8 as revenue
    from b join regions rg on rg.id = b.dest_id
    group by rg.city, rg.province
    order by orders desc, revenue desc
    limit 10
  `;
}

async function pelanggan(sql: Sql, r: Rentang) {
  const b = batas(r);
  const [jumlah] = await sql<{ new_accounts: number; account_orders: number; guest_orders: number }[]>`
    with b as (${dibayar(sql, b)})
    select
      (select count(*) from users u where u.created_at >= ${b.awal}::timestamptz and u.created_at < ${b.akhir}::timestamptz)::int
        as new_accounts,
      (select count(*) from b where b.user_id is not null)::int as account_orders,
      (select count(*) from b where b.user_id is null)::int as guest_orders
  `;
  const teratas = await sql<{ name: string; orders: number; spent: number; has_account: boolean }[]>`
    with b as (${dibayar(sql, b)})
    select (array_agg(b.customer_name order by b.paid_at desc))[1] as name,
      count(*)::int as orders, sum(b.total)::float8 as spent, bool_or(b.user_id is not null) as has_account
    from b
    group by coalesce(b.user_id::text, b.phone)
    order by spent desc, orders desc
    limit 5
  `;
  return { ...jumlah, top: teratas };
}

async function ulasan(sql: Sql, r: Rentang) {
  const b = batas(r);
  const sumber = await sql<{ source: string; count: number; average: number }[]>`
    select source, count(*)::int as count, avg(rating)::float8 as average
    from reviews
    where not is_hidden and reviewed_at >= ${b.awal}::timestamptz and reviewed_at < ${b.akhir}::timestamptz
    group by source
    order by count desc
  `;
  const bintang = await sql<{ rating: number; count: number }[]>`
    select rating::int as rating, count(*)::int as count
    from reviews
    where not is_hidden and reviewed_at >= ${b.awal}::timestamptz and reviewed_at < ${b.akhir}::timestamptz
    group by rating
    order by rating desc
  `;
  const [semua] = await sql<{ count: number; average: number }[]>`
    select count(*)::int as count, coalesce(avg(rating), 0)::float8 as average from reviews where not is_hidden
  `;
  return { by_source: sumber, by_rating: bintang, all_time: semua };
}

function jamBelanja(sql: Sql, r: Rentang) {
  const b = batas(r);
  return sql<{ dow: number; hour: number; orders: number }[]>`
    select extract(isodow from o.created_at at time zone 'Asia/Jakarta')::int as dow,
      extract(hour from o.created_at at time zone 'Asia/Jakarta')::int as hour,
      count(*)::int as orders
    from orders o
    where ${dibuat(sql, b)}
    group by 1, 2
  `;
}

export async function awalData(sql: Sql, sekarang: Date = new Date()): Promise<string> {
  const [h] = await sql<{ dari: string | null }[]>`
    select to_char(min(created_at at time zone 'Asia/Jakarta'), 'YYYY-MM-DD') as dari from orders
  `;
  return h?.dari ?? hariIniWib(sekarang);
}

export async function ambilLaporan(sql: Sql, masukan: Rentang | null, sekarang: Date = new Date()) {
  const rentang = masukan ?? { dari: await awalData(sql, sekarang), sampai: hariIniWib(sekarang) };
  const hari = jumlahHari(rentang);
  const kelompok = pilihKelompok(hari);
  const sebelumnya = masukan === null ? null : rentangSebelumnya(rentang);

  const [
    summary,
    previous,
    trend,
    statuses,
    actions,
    top_products,
    unsold_products,
    categories,
    payments,
    couriers,
    durations,
    provinces,
    cities,
    customers,
    reviews,
    heatmap,
  ] = await Promise.all([
    ringkasan(sql, rentang),
    sebelumnya ? ringkasan(sql, sebelumnya) : Promise.resolve(null),
    tren(sql, rentang, kelompok),
    statusPesanan(sql, rentang),
    tindakan(sql),
    produkTerlaris(sql, rentang),
    produkBelumTerjual(sql, rentang),
    kategori(sql, rentang),
    pembayaran(sql, rentang),
    kurir(sql, rentang),
    durasi(sql, rentang),
    provinsi(sql, rentang),
    kota(sql, rentang),
    pelanggan(sql, rentang),
    ulasan(sql, rentang),
    jamBelanja(sql, rentang),
  ]);

  return {
    range: {
      from: rentang.dari,
      to: rentang.sampai,
      days: hari,
      bucket: kelompok,
      all: masukan === null,
      previous: sebelumnya ? { from: sebelumnya.dari, to: sebelumnya.sampai } : null,
    },
    summary,
    previous_summary: previous,
    trend: [...trend],
    statuses: [...statuses],
    actions,
    top_products: [...top_products],
    unsold_products: [...unsold_products],
    categories: [...categories],
    payments: [...payments],
    couriers: [...couriers],
    durations,
    provinces: [...provinces],
    cities: [...cities],
    customers,
    reviews,
    heatmap: [...heatmap],
  };
}

type BarisEkspor = {
  order_no: string;
  created_at: Date;
  status: string;
  paid_at: Date | null;
  shipped_at: Date | null;
  delivered_at: Date | null;
  customer_name: string;
  phone: string;
  email: string | null;
  district: string;
  city: string;
  province: string;
  courier: string;
  service: string;
  tracking_number: string | null;
  payment_channel: string | null;
  payment_method: string | null;
  subtotal: number;
  shipping_cost: number;
  total: number;
  items: string | null;
};

const KOLOM_EKSPOR: KolomXlsx[] = [
  { judul: "No. pesanan", lebar: 18 },
  { judul: "Dibuat (WIB)", lebar: 17, jenis: "waktu" },
  { judul: "Status", lebar: 22 },
  { judul: "Dibayar (WIB)", lebar: 17, jenis: "waktu" },
  { judul: "Dikirim (WIB)", lebar: 17, jenis: "waktu" },
  { judul: "Diterima (WIB)", lebar: 17, jenis: "waktu" },
  { judul: "Nama pembeli", lebar: 24 },
  { judul: "No. HP", lebar: 16 },
  { judul: "Email", lebar: 28 },
  { judul: "Kecamatan", lebar: 18 },
  { judul: "Kota/kabupaten", lebar: 24 },
  { judul: "Provinsi", lebar: 20 },
  { judul: "Kurir", lebar: 9 },
  { judul: "Layanan", lebar: 11 },
  { judul: "Resi", lebar: 20 },
  { judul: "Kanal bayar", lebar: 14 },
  { judul: "Metode bayar", lebar: 22 },
  { judul: "Subtotal produk", lebar: 18, jenis: "rupiah" },
  { judul: "Ongkir", lebar: 11, jenis: "rupiah" },
  { judul: "Total", lebar: 13, jenis: "rupiah" },
  { judul: "Barang", lebar: 60 },
];

function waktuWib(d: Date | null): string | null {
  return d ? new Date(d.getTime() + 7 * 3_600_000).toISOString().slice(0, 16).replace("T", " ") : null;
}

function barisEkspor(sql: Sql, r: Rentang) {
  const b = batas(r);
  return sql<BarisEkspor[]>`
    select o.order_no, o.created_at, o.status, o.paid_at, o.shipped_at, o.delivered_at,
      o.customer_name, o.phone, o.email, rg.district, rg.city, rg.province,
      o.courier, o.service, o.tracking_number, o.payment_channel, o.payment_method,
      o.subtotal, o.shipping_cost, o.total,
      (
        select string_agg(oi.name_snapshot || ' x' || oi.qty, ', ' order by oi.id)
        from order_items oi where oi.order_id = o.id
      ) as items
    from orders o
    join regions rg on rg.id = o.dest_id
    where ${dibuat(sql, b)}
    order by o.created_at
  `;
}

export async function laporanCsv(sql: Sql, r: Rentang): Promise<string> {
  const baris = await barisEkspor(sql, r);

  return keCsv(
    KOLOM_EKSPOR.map((k) => k.judul),
    baris.map((o) => [
      o.order_no,
      waktuWib(o.created_at),
      LABEL_STATUS[o.status] ?? o.status,
      waktuWib(o.paid_at),
      waktuWib(o.shipped_at),
      waktuWib(o.delivered_at),
      o.customer_name,
      { digit: o.phone },
      o.email,
      o.district,
      o.city,
      o.province,
      o.courier,
      o.service,
      o.tracking_number ? { digit: o.tracking_number } : null,
      o.payment_channel,
      labelMetode(o.payment_method),
      o.subtotal,
      o.shipping_cost,
      o.total,
      o.items,
    ]),
  );
}

export async function laporanXlsx(sql: Sql, r: Rentang): Promise<Uint8Array> {
  const baris = await barisEkspor(sql, r);

  return buatXlsx(
    "Pesanan",
    KOLOM_EKSPOR,
    baris.map((o) => [
      o.order_no,
      o.created_at,
      LABEL_STATUS[o.status] ?? o.status,
      o.paid_at,
      o.shipped_at,
      o.delivered_at,
      o.customer_name,
      o.phone,
      o.email,
      o.district,
      o.city,
      o.province,
      o.courier,
      o.service,
      o.tracking_number,
      o.payment_channel,
      labelMetode(o.payment_method),
      o.subtotal,
      o.shipping_cost,
      o.total,
      o.items,
    ]),
  );
}
