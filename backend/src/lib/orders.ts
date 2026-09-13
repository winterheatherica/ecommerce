import { products } from "../data/products";
import { regions } from "../data/regions";
import {
  idPesananBaru,
  nomorPesananBaru,
  orderItems,
  orders,
  type Order,
} from "../data/orders";
import { cariOpsi } from "./shipping";
import { buatInvoice } from "./payment";

export function cariPesanan(orderNo: string): Order | undefined {
  const kunci = orderNo.trim().toUpperCase();
  const pesanan = orders.find((o) => o.order_no.toUpperCase() === kunci);

  if (pesanan) kedaluwarsakanSatu(pesanan);

  return pesanan;
}

export type HasilBayar =
  | { ok: true; pesanan: Order; sudahPernah: boolean }
  | { ok: false; alasan: "not_found" | "invalid_status" };

export function tandaiTerbayar(
  orderNo: string,
  paymentMethod: string | null,
): HasilBayar {
  const pesanan = cariPesanan(orderNo);

  if (!pesanan) return { ok: false, alasan: "not_found" };

  if (pesanan.status === "PAID") {
    return { ok: true, pesanan, sudahPernah: true };
  }

  if (pesanan.status !== "PENDING") {
    return { ok: false, alasan: "invalid_status" };
  }

  pesanan.status = "PAID";
  pesanan.paid_at = new Date().toISOString();
  pesanan.payment_method = paymentMethod;

  return { ok: true, pesanan, sudahPernah: false };
}

export function kedaluwarsa(pesanan: Order, sekarang = new Date()): boolean {
  if (pesanan.status !== "PENDING" || !pesanan.expires_at) return false;
  return new Date(pesanan.expires_at) < sekarang;
}

export type PermintaanPesanan = {
  customer_name: string;
  phone: string;
  email?: string;
  address: string;
  notes?: string;
  dest_id: string;
  courier: string;
  service: string;
  items: { slug: string; qty: number }[];
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
  | { ok: true; pesanan: Order }
  | ({ ok: false } & GagalBuat);

export function buatPesanan(
  req: PermintaanPesanan,
  storefrontUrl: string,
): HasilBuat {
  const tujuan = regions.find((r) => r.id === req.dest_id);

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

  const baris: { produk: (typeof products)[number]; qty: number }[] = [];
  const terpakai = new Map<string, number>();

  for (const item of req.items) {
    const produk = products.find((p) => p.slug === item.slug && p.is_active);

    if (!produk) {
      return {
        ok: false,
        status: 422,
        badan: {
          error: "product_not_found",
          message: `Produk ${item.slug} tidak tersedia`,
        },
      };
    }

    const sudah = terpakai.get(produk.slug) ?? 0;
    const totalDiminta = sudah + item.qty;

    if (produk.stock < totalDiminta) {
      return {
        ok: false,
        status: 409,
        badan: {
          error: "insufficient_stock",
          message: `Stok ${produk.name} tinggal ${produk.stock}`,
          slug: produk.slug,
          available: produk.stock,
        },
      };
    }

    terpakai.set(produk.slug, totalDiminta);
    baris.push({ produk, qty: item.qty });
  }

  const subtotal = baris.reduce((s, b) => s + b.produk.price * b.qty, 0);
  const weight_g = baris.reduce((s, b) => s + b.produk.weight_g * b.qty, 0);

  const opsi = cariOpsi(req.dest_id, weight_g, req.courier, req.service);

  if (!opsi) {
    return {
      ok: false,
      status: 422,
      badan: {
        error: "service_unavailable",
        message: "Layanan pengiriman itu tidak tersedia untuk tujuan ini",
      },
    };
  }

  for (const b of baris) {
    b.produk.stock -= b.qty;
  }

  const id = idPesananBaru();
  const orderNo = nomorPesananBaru();
  const total = subtotal + opsi.cost;

  const invoice = buatInvoice(
    {
      order_no: orderNo,
      amount: total,
      customer_name: req.customer_name.trim(),
      email: req.email?.trim() || null,
    },
    storefrontUrl,
  );

  const pesanan: Order = {
    id,
    order_no: orderNo,
    customer_name: req.customer_name.trim(),
    phone: req.phone.replace(/[\s-]/g, ""),
    email: req.email?.trim() || null,
    address: req.address.trim(),
    notes: req.notes?.trim() || null,
    dest_id: tujuan.id,
    dest_label: tujuan.label,
    courier: opsi.courier,
    service: opsi.service,
    etd: opsi.etd,
    weight_g,
    subtotal,
    shipping_cost: opsi.cost,
    total,
    status: "PENDING",
    xendit_invoice_id: invoice.invoice_id,
    xendit_invoice_url: invoice.invoice_url,
    expires_at: invoice.expires_at,
    payment_method: null,
    tracking_number: null,
    created_at: new Date().toISOString(),
    paid_at: null,
    shipped_at: null,
  };

  orders.push(pesanan);

  for (const b of baris) {
    orderItems.push({
      order_id: id,
      product_id: b.produk.id,
      slug: b.produk.slug,
      name_snapshot: b.produk.name,
      qty: b.qty,
      price_snapshot: b.produk.price,
    });
  }

  return { ok: true, pesanan };
}

export function kembalikanStok(pesanan: Order): void {
  for (const item of orderItems.filter((i) => i.order_id === pesanan.id)) {
    const produk = products.find((p) => p.id === item.product_id);
    if (produk) produk.stock += item.qty;
  }
}

export function kedaluwarsakanSatu(
  pesanan: Order,
  sekarang = new Date(),
): boolean {
  if (!kedaluwarsa(pesanan, sekarang)) return false;

  pesanan.status = "EXPIRED";
  kembalikanStok(pesanan);

  return true;
}

export function sapuKedaluwarsa(sekarang = new Date()): string[] {
  const disapu: string[] = [];

  for (const pesanan of orders) {
    if (kedaluwarsakanSatu(pesanan, sekarang)) {
      disapu.push(pesanan.order_no);
    }
  }

  return disapu;
}
