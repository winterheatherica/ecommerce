"use client";

import type { StatusPromo } from "@/app/data/produk";

export type Wilayah = {
  id: string;
  province: string;
  city: string;
  district: string;
  postal_code: string | null;
  label: string;
};

export type OpsiOngkir = {
  courier: string;
  service: string;
  cost: number;
  etd: string;
};

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    throw new Error(`Permintaan gagal (${res.status})`);
  }
  return (await res.json()) as T;
}

export async function cariWilayah(
  q: string,
  signal?: AbortSignal,
): Promise<Wilayah[]> {
  const res = await fetch(`/api/regions?q=${encodeURIComponent(q)}`, { signal });
  const isi = await json<{ data: Wilayah[] }>(res);
  return isi.data;
}

export async function ambilOngkir(
  destId: string,
  beratG: number,
  signal?: AbortSignal,
): Promise<OpsiOngkir[]> {
  const res = await fetch("/api/shipping/cost", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dest_id: destId, weight_g: beratG }),
    signal,
  });
  const isi = await json<{ options: OpsiOngkir[] }>(res);
  return isi.options;
}

export type PesananBaru = {
  customer_name: string;
  phone: string;
  email: string;
  address: string;
  notes?: string;
  dest_id: string;
  courier: string;
  service: string;
  items: { slug: string; qty: number }[];
};

export type HasilPesanan = {
  order_no: string;
  status: string;
  total: number;
  expires_at: string | null;
};

export type ChannelBayar = {
  code: string;
  name: string;
  group: string;
};

export type InfoPembayaran = {
  configured: boolean;
  sandbox: boolean;
  data: ChannelBayar[];
};

export async function ambilChannel(signal?: AbortSignal): Promise<InfoPembayaran> {
  const res = await fetch("/api/payment-channels", { signal });

  if (!res.ok) {
    const galat = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(galat.message ?? `Gagal memuat metode bayar (${res.status})`);
  }

  return (await res.json()) as InfoPembayaran;
}

export async function bayarPesanan(orderNo: string): Promise<{ checkout_url: string }> {
  const res = await fetch(
    `/api/orders/${encodeURIComponent(orderNo)}/pay`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    },
  );

  if (!res.ok) {
    const galat = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(galat.message ?? `Gagal membuat pembayaran (${res.status})`);
  }

  return (await res.json()) as { checkout_url: string };
}

export async function cekPembayaran(
  orderNo: string,
): Promise<{ status: string; changed: boolean }> {
  const res = await fetch(
    `/api/orders/${encodeURIComponent(orderNo)}/check-payment`,
    { method: "POST" },
  );

  if (!res.ok) {
    const galat = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(galat.message ?? `Gagal mengecek pembayaran (${res.status})`);
  }

  return (await res.json()) as { status: string; changed: boolean };
}

export async function buatPesanan(
  data: PesananBaru,
  signal?: AbortSignal,
): Promise<HasilPesanan> {
  const res = await fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    signal,
  });

  if (res.status === 409 || res.status === 422) {
    const galat = (await res.json()) as { message?: string };
    throw new Error(galat.message ?? "Pesanan ditolak");
  }

  return json<HasilPesanan>(res);
}

export async function tandaiDikirim(
  orderNo: string,
  trackingNumber: string,
): Promise<void> {
  const res = await fetch(
    `/api/admin/orders/${encodeURIComponent(orderNo)}/ship`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tracking_number: trackingNumber }),
    },
  );

  if (!res.ok) {
    const galat = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(galat.message ?? `Gagal menandai dikirim (${res.status})`);
  }
}

export async function tandaiSelesai(orderNo: string): Promise<void> {
  const res = await fetch(
    `/api/admin/orders/${encodeURIComponent(orderNo)}/deliver`,
    { method: "PATCH" },
  );

  if (!res.ok) {
    const galat = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(galat.message ?? `Gagal menandai selesai (${res.status})`);
  }
}

export async function tandaiLunas(
  orderNo: string,
  method: string,
): Promise<void> {
  const res = await fetch(
    `/api/admin/orders/${encodeURIComponent(orderNo)}/pay`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ method }),
    },
  );

  if (!res.ok) {
    const galat = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(galat.message ?? `Gagal menandai lunas (${res.status})`);
  }
}

export async function batalkanPesanan(orderNo: string): Promise<void> {
  const res = await fetch(
    `/api/admin/orders/${encodeURIComponent(orderNo)}/cancel`,
    { method: "PATCH" },
  );

  if (!res.ok) {
    const galat = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(galat.message ?? `Gagal membatalkan (${res.status})`);
  }
}

export type PerubahanProduk = {
  is_featured?: boolean;
  is_active?: boolean;
};

export async function ubahProduk(
  slug: string,
  perubahan: PerubahanProduk,
): Promise<void> {
  const res = await fetch(`/api/admin/products/${encodeURIComponent(slug)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(perubahan),
  });

  if (!res.ok) {
    const galat = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(galat.message ?? `Gagal menyimpan (${res.status})`);
  }
}

export type PerubahanVarian = {
  sku?: string;
  label?: string;
  price?: number;
  weight_g?: number;
  stock?: number;
  is_active?: boolean;
  promo_price?: number | null;
  promo_starts_at?: string | null;
  promo_ends_at?: string | null;
  promo_show_period?: boolean;
  package_weight_g?: number | null;
  package_length_cm?: number | null;
  package_width_cm?: number | null;
  package_height_cm?: number | null;
};

export type VarianBaru = {
  slug: string;
  sku?: string;
  label: string;
  price: number;
  weight_g: number;
  stock: number;
};

export type IsiProdukBaru = {
  slug: string;
  name: string;
  description: string;
  price: number;
  weight_g: number;
  stock: number;
  category: string;
  sold_per_month: number;
  is_featured: boolean;
  usage_instructions: string | null;
};

export type IsiProdukUbah = {
  name: string;
  description: string;
  category: string;
  sold_per_month: number;
  is_featured: boolean;
  usage_instructions: string | null;
};

async function pastikanOk(res: Response) {
  if (res.ok) return;

  const galat = (await res.json().catch(() => ({}))) as { message?: string };
  throw new Error(galat.message ?? `Gagal menyimpan (${res.status})`);
}

export async function ubahVarian(
  slug: string,
  perubahan: PerubahanVarian,
): Promise<{ promo_status?: StatusPromo }> {
  const res = await fetch(`/api/admin/variants/${encodeURIComponent(slug)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(perubahan),
  });

  await pastikanOk(res);
  return (await res.json()) as { promo_status?: StatusPromo };
}

export async function tambahVarian(
  produkSlug: string,
  isi: VarianBaru,
): Promise<void> {
  const res = await fetch(
    `/api/admin/products/${encodeURIComponent(produkSlug)}/variants`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(isi),
    },
  );

  await pastikanOk(res);
}

export async function buatProdukBaru(isi: IsiProdukBaru): Promise<void> {
  const res = await fetch("/api/admin/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(isi),
  });

  await pastikanOk(res);
}

export async function simpanProduk(
  slug: string,
  isi: Partial<IsiProdukUbah>,
): Promise<void> {
  const res = await fetch(`/api/admin/products/${encodeURIComponent(slug)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(isi),
  });

  await pastikanOk(res);
}

export async function sapuPesanan(): Promise<number> {
  const res = await fetch("/api/admin/orders/sweep", { method: "POST" });

  await pastikanOk(res);

  const isi = (await res.json()) as { swept: number };
  return isi.swept;
}
