import type { Kueri, Sql } from "../lib/db";
import {
  BATAS_RUPIAH,
  bersihkanHp,
  emailSah,
  gabungkanItem,
  hpSah,
  nomorPesananBaru,
  type ItemDiminta,
  type StatusPesanan,
} from "../lib/orders";
import { cariOpsi, type OpsiOngkir } from "../lib/shipping";

export type ItemPesanan = {
  product_id: number;
  slug: string;
  name_snapshot: string;
  qty: number;
  price_snapshot: number;
};

export type Pesanan = {
  id: number;
  order_no: string;
  customer_name: string;
  phone: string;
  email: string | null;
  address: string;
  notes: string | null;
  dest_id: string;
  dest_label: string;
  courier: string;
  service: string;
  etd: string | null;
  weight_g: number;
  subtotal: number;
  shipping_cost: number;
  total: number;
  status: StatusPesanan;
  payment_reference: string | null;
  payment_url: string | null;
  payment_channel: string | null;
  expires_at: string | null;
  payment_method: string | null;
  tracking_number: string | null;
  created_at: string;
  paid_at: string | null;
  shipped_at: string | null;
  items: ItemPesanan[];
};

type BarisMentah = Omit<
  Pesanan,
  "expires_at" | "created_at" | "paid_at" | "shipped_at"
> & {
  expires_at: Date | null;
  created_at: Date;
  paid_at: Date | null;
  shipped_at: Date | null;
};

function keIso(nilai: Date | null): string | null {
  return nilai === null ? null : nilai.toISOString();
}

function petakan(b: BarisMentah): Pesanan {
  return {
    ...b,
    expires_at: keIso(b.expires_at),
    created_at: keIso(b.created_at) as string,
    paid_at: keIso(b.paid_at),
    shipped_at: keIso(b.shipped_at),
  };
}

const pilih = (sql: Sql) => sql`
  o.id::int as id,
  o.order_no,
  o.customer_name,
  o.phone,
  o.email,
  o.address,
  o.notes,
  o.dest_id,
  r.label as dest_label,
  o.courier,
  o.service,
  o.etd,
  o.weight_g,
  o.subtotal,
  o.shipping_cost,
  o.total,
  o.status,
  o.payment_reference,
  o.payment_url,
  o.payment_channel,
  o.expires_at,
  o.payment_method,
  o.tracking_number,
  o.created_at,
  o.paid_at,
  o.shipped_at,
  coalesce(
    (
      select json_agg(
        json_build_object(
          'product_id', i.product_id::int,
          'slug', p.slug,
          'name_snapshot', i.name_snapshot,
          'qty', i.qty,
          'price_snapshot', i.price_snapshot
        )
        order by i.id
      )
      from order_items i
      join products p on p.id = i.product_id
      where i.order_id = o.id
    ),
    '[]'::json
  ) as items
`;

export async function ambilPesanan(
  sql: Sql,
  orderNo: string,
): Promise<Pesanan | undefined> {
  const [baris] = await sql<BarisMentah[]>`
    select ${pilih(sql)}
    from orders o
    join regions r on r.id = o.dest_id
    where upper(o.order_no) = upper(${orderNo.trim()})
    limit 1
  `;

  return baris ? petakan(baris) : undefined;
}

export async function sapuKedaluwarsa(
  sql: Sql,
  orderNo: string | null = null,
): Promise<string[]> {
  const baris = await sql<{ order_no: string }[]>`
    with kadaluarsa as (
      update orders o
      set status = 'EXPIRED'
      where o.status = 'PENDING'
        and o.expires_at is not null
        and o.expires_at < now()
        and (${orderNo}::text is null or upper(o.order_no) = upper(${orderNo}::text))
      returning o.id, o.order_no
    ),
    pulih as (
      update products p
      set stock = p.stock + x.qty
      from (
        select i.product_id, sum(i.qty)::int as qty
        from order_items i
        join kadaluarsa k on k.id = i.order_id
        group by i.product_id
      ) x
      where p.id = x.product_id
      returning p.id
    )
    select order_no from kadaluarsa order by order_no
  `;

  return baris.map((b) => b.order_no);
}

export async function cariPesanan(
  sql: Sql,
  orderNo: string,
): Promise<Pesanan | undefined> {
  await sapuKedaluwarsa(sql, orderNo.trim());
  return ambilPesanan(sql, orderNo);
}

export type FilterPesanan = {
  status?: StatusPesanan;
  limit: number;
  offset: number;
};

export async function daftarPesanan(sql: Sql, f: FilterPesanan) {
  await sapuKedaluwarsa(sql);

  const baris = await sql<(BarisMentah & { total_baris: number })[]>`
    select
      ${pilih(sql)},
      (count(*) over ())::int as total_baris
    from orders o
    join regions r on r.id = o.dest_id
    where (${f.status ?? null}::text is null or o.status = ${f.status ?? null}::text)
    order by o.created_at desc
    limit ${f.limit}
    offset ${f.offset}
  `;

  if (baris.length === 0) {
    const [hasil] = await sql<{ total: number }[]>`
      select count(*)::int as total
      from orders o
      where (${f.status ?? null}::text is null or o.status = ${f.status ?? null}::text)
    `;

    return { data: [], total: hasil?.total ?? 0 };
  }

  return {
    data: baris.map(({ total_baris: _abaikan, ...sisa }) => petakan(sisa)),
    total: baris[0].total_baris,
  };
}

export type PermintaanPesanan = {
  customer_name: string;
  phone: string;
  email: string;
  address: string;
  notes?: string;
  dest_id: string;
  courier: string;
  service: string;
  items: ItemDiminta[];
};

export type GagalBuat = {
  status: number;
  badan: {
    error: string;
    message: string;
    slug?: string;
    available?: number;
  };
};

export type HasilBuat =
  | { ok: true; pesanan: Pesanan }
  | ({ ok: false } & GagalBuat);

class GagalPesanan extends Error {
  constructor(public hasil: GagalBuat) {
    super(hasil.badan.error);
  }
}

function bentrokUnik(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    (e as { code: unknown }).code === "23505"
  );
}

type ProdukTerkunci = {
  id: number;
  slug: string;
  name: string;
  price: number;
  weight_g: number;
};

async function kurangiStok(
  tx: Kueri,
  item: ItemDiminta,
): Promise<ProdukTerkunci> {
  const [produk] = await tx<ProdukTerkunci[]>`
    update products
    set stock = stock - ${item.qty}
    where slug = ${item.slug}
      and is_active
      and stock >= ${item.qty}
    returning id::int as id, slug, name, price, weight_g
  `;

  if (produk) return produk;

  const [ada] = await tx<{ name: string; stock: number; is_active: boolean }[]>`
    select name, stock, is_active from products where slug = ${item.slug} limit 1
  `;

  if (!ada || !ada.is_active) {
    throw new GagalPesanan({
      status: 422,
      badan: {
        error: "product_not_found",
        message: `Produk ${item.slug} tidak tersedia`,
      },
    });
  }

  throw new GagalPesanan({
    status: 409,
    badan: {
      error: "insufficient_stock",
      message: `Stok ${ada.name} tinggal ${ada.stock}`,
      slug: item.slug,
      available: ada.stock,
    },
  });
}

export type CariOngkir = (
  destId: string,
  weightG: number,
) => Promise<OpsiOngkir[] | null>;

export async function buatPesanan(
  sql: Sql,
  req: PermintaanPesanan,
  umurJam: number,
  cariOngkir: CariOngkir,
): Promise<HasilBuat> {
  if (!hpSah(req.phone)) {
    return {
      ok: false,
      status: 422,
      badan: {
        error: "invalid_phone",
        message: "Nomor HP tidak valid. Contoh: 081234567890",
      },
    };
  }

  if (!emailSah(req.email)) {
    return {
      ok: false,
      status: 422,
      badan: {
        error: "invalid_email",
        message: "Alamat email wajib diisi dan harus valid",
      },
    };
  }

  const [tujuan] = await sql<{ id: string }[]>`
    select id from regions where id = ${req.dest_id} limit 1
  `;

  if (!tujuan) {
    return {
      ok: false,
      status: 422,
      badan: {
        error: "region_not_found",
        message: "Kecamatan tujuan tidak dikenal",
      },
    };
  }

  const diminta = gabungkanItem(req.items);

  const praProduk = await sql<{ slug: string; weight_g: number }[]>`
    select slug, weight_g
    from products
    where is_active and slug in ${sql(diminta.map((i) => i.slug))}
  `;

  const beratPra = diminta.reduce((s, item) => {
    const p = praProduk.find((x) => x.slug === item.slug);
    return s + (p ? p.weight_g * item.qty : 0);
  }, 0);

  if (beratPra <= 0) {
    return {
      ok: false,
      status: 422,
      badan: {
        error: "product_not_found",
        message: "Produk yang dipesan tidak tersedia",
      },
    };
  }
  const daftarOngkir = await cariOngkir(req.dest_id, beratPra);
  const opsiTerpilih = daftarOngkir
    ? cariOpsi(daftarOngkir, req.courier, req.service)
    : null;

  if (!opsiTerpilih) {
    return {
      ok: false,
      status: 422,
      badan: {
        error: "service_unavailable",
        message: "Layanan pengiriman itu tidak tersedia untuk tujuan ini",
      },
    };
  }

  for (let percobaan = 0; percobaan < 3; percobaan++) {
    try {
      const orderNo = await sql.begin(async (tx) => {
        const baris: { produk: ProdukTerkunci; qty: number }[] = [];

        for (const item of diminta) {
          baris.push({ produk: await kurangiStok(tx, item), qty: item.qty });
        }

        const subtotal = baris.reduce((s, b) => s + b.produk.price * b.qty, 0);
        const weight_g = baris.reduce((s, b) => s + b.produk.weight_g * b.qty, 0);

        if (subtotal > BATAS_RUPIAH) {
          throw new GagalPesanan({
            status: 422,
            badan: {
              error: "order_too_large",
              message: "Nilai pesanan melebihi batas yang bisa diproses",
            },
          });
        }

        const opsi = opsiTerpilih;

        const nomor = nomorPesananBaru();
        const total = subtotal + opsi.cost;
        const kedaluwarsa = new Date(
          Date.now() + umurJam * 60 * 60 * 1000,
        ).toISOString();

        const [pesanan] = await tx<{ id: number }[]>`
          insert into orders (
            order_no, customer_name, phone, email, address, notes,
            dest_id, courier, service, etd, weight_g,
            subtotal, shipping_cost, total, status, expires_at
          ) values (
            ${nomor},
            ${req.customer_name.trim()},
            ${bersihkanHp(req.phone)},
            ${req.email.trim()},
            ${req.address.trim()},
            ${req.notes?.trim() || null},
            ${req.dest_id},
            ${opsi.courier},
            ${opsi.service},
            ${opsi.etd},
            ${weight_g},
            ${subtotal},
            ${opsi.cost},
            ${total},
            'PENDING',
            ${kedaluwarsa}
          )
          returning id::int as id
        `;

        await tx`
          insert into order_items ${tx(
            baris.map((b) => ({
              order_id: pesanan.id,
              product_id: b.produk.id,
              qty: b.qty,
              price_snapshot: b.produk.price,
              name_snapshot: b.produk.name,
            })) as unknown as Record<string, never>[],
          )}
        `;
        return nomor;
      });

      const pesanan = await ambilPesanan(sql, orderNo);

      if (!pesanan) {
        throw new Error("Pesanan hilang tepat setelah dibuat");
      }

      return { ok: true, pesanan };
    } catch (e) {
      if (e instanceof GagalPesanan) return { ok: false, ...e.hasil };
      if (bentrokUnik(e) && percobaan < 2) continue;
      throw e;
    }
  }

  throw new Error("Gagal membuat nomor pesanan yang unik");
}

export type HasilBayar =
  | { ok: true; pesanan: Pesanan; sudahPernah: boolean }
  | { ok: false; alasan: "not_found" | "invalid_status" };

export async function tandaiTerbayar(
  sql: Sql,
  orderNo: string,
  paymentMethod: string | null,
): Promise<HasilBayar> {
  await sapuKedaluwarsa(sql, orderNo.trim());

  const [diubah] = await sql<{ order_no: string }[]>`
    update orders
    set status = 'PAID',
        paid_at = now(),
        payment_method = ${paymentMethod}
    where upper(order_no) = upper(${orderNo.trim()})
      and status = 'PENDING'
    returning order_no
  `;

  if (diubah) {
    const pesanan = await ambilPesanan(sql, diubah.order_no);
    if (!pesanan) return { ok: false, alasan: "not_found" };
    return { ok: true, pesanan, sudahPernah: false };
  }

  const pesanan = await ambilPesanan(sql, orderNo);

  if (!pesanan) return { ok: false, alasan: "not_found" };
  if (pesanan.status === "PAID") return { ok: true, pesanan, sudahPernah: true };

  return { ok: false, alasan: "invalid_status" };
}

export type HasilUbahStatus =
  | { ok: true; pesanan: Pesanan }
  | {
      ok: false;
      alasan: "not_found" | "invalid_status";
      status?: StatusPesanan;
    };

async function hasilUbah(
  sql: Sql,
  orderNo: string,
  diubah: { order_no: string } | undefined,
): Promise<HasilUbahStatus> {
  const kunci = diubah ? diubah.order_no : orderNo;
  const pesanan = await ambilPesanan(sql, kunci);

  if (!pesanan) return { ok: false, alasan: "not_found" };
  if (diubah) return { ok: true, pesanan };

  return { ok: false, alasan: "invalid_status", status: pesanan.status };
}

export async function tandaiDikirim(
  sql: Sql,
  orderNo: string,
  trackingNumber: string,
): Promise<HasilUbahStatus> {
  const [diubah] = await sql<{ order_no: string }[]>`
    update orders
    set status = 'SHIPPED',
        tracking_number = ${trackingNumber.trim()},
        shipped_at = now()
    where upper(order_no) = upper(${orderNo.trim()})
      and status = 'PAID'
    returning order_no
  `;

  return hasilUbah(sql, orderNo, diubah);
}

export async function tandaiSelesai(
  sql: Sql,
  orderNo: string,
): Promise<HasilUbahStatus> {
  const [diubah] = await sql<{ order_no: string }[]>`
    update orders
    set status = 'DELIVERED'
    where upper(order_no) = upper(${orderNo.trim()})
      and status = 'SHIPPED'
    returning order_no
  `;

  return hasilUbah(sql, orderNo, diubah);
}

export async function batalkanPesanan(
  sql: Sql,
  orderNo: string,
): Promise<HasilUbahStatus> {
  const [diubah] = await sql<{ order_no: string }[]>`
    with dibatalkan as (
      update orders o
      set status = 'CANCELLED'
      where upper(o.order_no) = upper(${orderNo.trim()})
        and o.status = 'PENDING'
      returning o.id, o.order_no
    ),
    pulih as (
      update products p
      set stock = p.stock + x.qty
      from (
        select i.product_id, sum(i.qty)::int as qty
        from order_items i
        join dibatalkan d on d.id = i.order_id
        group by i.product_id
      ) x
      where p.id = x.product_id
      returning p.id
    )
    select order_no from dibatalkan
  `;

  return hasilUbah(sql, orderNo, diubah);
}

export type Pembayaran = {
  reference: string;
  url: string;
  channel: string;
  method: string;
};

export async function simpanPembayaran(
  sql: Sql,
  orderNo: string,
  bayar: Pembayaran,
): Promise<HasilUbahStatus> {
  const [diubah] = await sql<{ order_no: string }[]>`
    update orders
    set payment_reference = ${bayar.reference},
        payment_url = ${bayar.url},
        payment_channel = ${bayar.channel},
        payment_method = ${bayar.method}
    where upper(order_no) = upper(${orderNo.trim()})
      and status = 'PENDING'
    returning order_no
  `;

  return hasilUbah(sql, orderNo, diubah);
}

export async function gagalkanPembayaran(
  sql: Sql,
  orderNo: string,
  status: "EXPIRED" | "CANCELLED",
): Promise<string | undefined> {
  const [baris] = await sql<{ order_no: string }[]>`
    with digagalkan as (
      update orders o
      set status = ${status}
      where upper(o.order_no) = upper(${orderNo.trim()})
        and o.status = 'PENDING'
      returning o.id, o.order_no
    ),
    pulih as (
      update products p
      set stock = p.stock + x.qty
      from (
        select i.product_id, sum(i.qty)::int as qty
        from order_items i
        join digagalkan d on d.id = i.order_id
        group by i.product_id
      ) x
      where p.id = x.product_id
      returning p.id
    )
    select order_no from digagalkan
  `;

  return baris?.order_no;
}
