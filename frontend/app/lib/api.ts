import { cache } from "react";

import type { Kategori, Produk } from "@/app/data/produk";
import type { StatusPesanan } from "@/app/data/status-pesanan";

function basis(): string {
  return process.env.API_URL ?? "http://localhost:8787";
}

function kepalaAdmin(): HeadersInit {
  const pengguna = process.env.ADMIN_USER?.trim();
  const sandi = process.env.ADMIN_PASSWORD?.trim();

  if (!pengguna || !sandi) return {};

  return { Authorization: `Basic ${btoa(`${pengguna}:${sandi}`)}` };
}

type ProdukAPI = {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  price: number;
  weight_g: number;
  stock: number;
  category: string;
  is_featured: boolean;
  sold_per_month: number;
  sort_order: number;
};

type DaftarAPI = {
  data: ProdukAPI[];
  total: number;
  limit: number;
  offset: number;
};

function petakan(p: ProdukAPI): Produk {
  return {
    slug: p.slug,
    nama: p.name,
    deskripsi: p.description ?? "",
    harga: p.price,
    kategori: p.category as Kategori,
    beratG: p.weight_g,
    stok: p.stock,
    terjualPerBulan: p.sold_per_month,
    unggulan: p.is_featured,
  };
}

export type OpsiDaftar = {
  kategori?: string;
  unggulan?: boolean;
  limit?: number;
};

export async function ambilProduk(opsi: OpsiDaftar = {}): Promise<Produk[]> {
  const q = new URLSearchParams();
  if (opsi.kategori) q.set("category", opsi.kategori);
  if (opsi.unggulan) q.set("featured", "true");
  if (opsi.limit) q.set("limit", String(opsi.limit));

  const sisa = q.toString();
  const alamat = `${basis()}/api/products${sisa ? `?${sisa}` : ""}`;
  const res = await fetch(alamat, { cache: "no-store" });

  if (!res.ok) {
    throw new Error(
      `Gagal mengambil daftar produk (${res.status}) dari ${alamat}`,
    );
  }

  const isi = (await res.json()) as DaftarAPI;
  return isi.data.map(petakan);
}

const BATAS_HALAMAN = 100;

export async function ambilSemuaProduk(): Promise<Produk[]> {
  const kumpulan: Produk[] = [];
  let offset = 0;

  for (;;) {
    const q = new URLSearchParams({
      limit: String(BATAS_HALAMAN),
      offset: String(offset),
    });
    const alamat = `${basis()}/api/products?${q}`;
    const res = await fetch(alamat, { cache: "no-store" });

    if (!res.ok) {
      throw new Error(
        `Gagal mengambil daftar produk (${res.status}) dari ${alamat}`,
      );
    }

    const isi = (await res.json()) as DaftarAPI;
    kumpulan.push(...isi.data.map(petakan));

    if (isi.data.length === 0 || kumpulan.length >= isi.total) break;

    offset += BATAS_HALAMAN;
  }

  return kumpulan;
}

export const ambilSatuProduk = cache(async function ambilSatuProduk(
  slug: string,
): Promise<Produk | null> {
  const alamat = `${basis()}/api/products/${encodeURIComponent(slug)}`;
  const res = await fetch(alamat, { cache: "no-store" });

  if (res.status === 404) return null;

  if (!res.ok) {
    throw new Error(
      `Gagal mengambil produk ${slug} (${res.status}) dari ${alamat}`,
    );
  }

  return petakan((await res.json()) as ProdukAPI);
});

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

export async function ambilPesanan(orderNo: string): Promise<Pesanan | null> {
  const res = await fetch(
    `${basis()}/api/orders/${encodeURIComponent(orderNo)}`,
    { cache: "no-store" },
  );

  if (res.status === 404) return null;

  if (!res.ok) {
    throw new Error(`Gagal mengambil pesanan ${orderNo} (${res.status})`);
  }

  return (await res.json()) as Pesanan;
}

export async function ambilDaftarPesanan(
  status?: string,
): Promise<Pesanan[]> {
  const q = new URLSearchParams();
  if (status) q.set("status", status);

  const sisa = q.toString();
  const res = await fetch(`${basis()}/api/admin/orders${sisa ? `?${sisa}` : ""}`, {
    cache: "no-store",
    headers: kepalaAdmin(),
  });

  if (!res.ok) {
    throw new Error(`Gagal mengambil daftar pesanan (${res.status})`);
  }

  const isi = (await res.json()) as { data: Pesanan[] };
  return isi.data;
}

export async function ambilProdukAdmin(): Promise<Produk[]> {
  const res = await fetch(`${basis()}/api/admin/products`, {
    cache: "no-store",
    headers: kepalaAdmin(),
  });

  if (!res.ok) {
    throw new Error(`Gagal mengambil produk admin (${res.status})`);
  }

  const isi = (await res.json()) as { data: ProdukAPI[] };
  return isi.data.map(petakan);
}

export async function ambilSatuProdukAdmin(
  slug: string,
): Promise<Produk | null> {
  const res = await fetch(
    `${basis()}/api/admin/products/${encodeURIComponent(slug)}`,
    { cache: "no-store", headers: kepalaAdmin() },
  );

  if (res.status === 404) return null;

  if (!res.ok) {
    throw new Error(`Gagal mengambil produk ${slug} (${res.status})`);
  }

  return petakan((await res.json()) as ProdukAPI);
}
