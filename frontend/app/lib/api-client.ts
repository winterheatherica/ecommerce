"use client";

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
  icon_url: string;
  minimum_amount: number;
  maximum_amount: number;
};

export async function ambilChannel(
  signal?: AbortSignal,
): Promise<{ data: ChannelBayar[]; sandbox: boolean }> {
  const res = await fetch("/api/payment-channels", { signal });

  if (!res.ok) {
    const galat = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(galat.message ?? `Gagal memuat metode bayar (${res.status})`);
  }

  return (await res.json()) as { data: ChannelBayar[]; sandbox: boolean };
}

export async function bayarPesanan(
  orderNo: string,
  method: string,
): Promise<{ checkout_url: string }> {
  const res = await fetch(
    `/api/orders/${encodeURIComponent(orderNo)}/pay`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ method }),
    },
  );

  if (!res.ok) {
    const galat = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(galat.message ?? `Gagal membuat pembayaran (${res.status})`);
  }

  return (await res.json()) as { checkout_url: string };
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
  stock?: number;
  price?: number;
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

export type IsiProduk = {
  name: string;
  description: string;
  price: number;
  weight_g: number;
  stock: number;
  category: string;
  sold_per_month: number;
  is_featured: boolean;
};

async function pastikanOk(res: Response) {
  if (res.ok) return;

  const galat = (await res.json().catch(() => ({}))) as { message?: string };
  throw new Error(galat.message ?? `Gagal menyimpan (${res.status})`);
}

export async function buatProdukBaru(
  isi: IsiProduk & { slug: string },
): Promise<void> {
  const res = await fetch("/api/admin/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(isi),
  });

  await pastikanOk(res);
}

export async function simpanProduk(
  slug: string,
  isi: Partial<IsiProduk>,
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
