import { cookies } from "next/headers";

import type { StatusPesanan } from "@/app/data/status-pesanan";

const COOKIE_SESI = "sid";

export function alamatApi(): string {
  return (process.env.API_URL ?? "http://localhost:8787").replace(/\/+$/, "");
}

export function urlMasukGoogle(tujuan: string): string {
  return `${alamatApi()}/api/auth/google/start?next=${encodeURIComponent(tujuan)}`;
}

export function urlKeluar(): string {
  return `${alamatApi()}/api/auth/logout`;
}

export async function adaSesi(): Promise<boolean> {
  return Boolean((await cookies()).get(COOKIE_SESI)?.value);
}

export async function kepalaSesi(): Promise<Record<string, string> | null> {
  const token = (await cookies()).get(COOKIE_SESI)?.value;
  return token ? { Cookie: `${COOKIE_SESI}=${token}` } : null;
}

export type AlamatTerakhir = {
  customer_name: string;
  phone: string;
  address: string;
  dest_id: string;
  dest_label: string;
};

export type Akun = {
  user: { name: string; email: string };
  last_address: AlamatTerakhir | null;
};

export async function ambilAkun(): Promise<Akun | null> {
  const kepala = await kepalaSesi();
  if (!kepala) return null;

  const res = await fetch(`${alamatApi()}/api/auth/me`, {
    cache: "no-store",
    headers: kepala,
  });

  if (res.status === 401) return null;
  if (!res.ok) throw new Error(`Gagal memeriksa akun (${res.status})`);

  return (await res.json()) as Akun;
}

export type RingkasanPesanan = {
  order_no: string;
  status: StatusPesanan;
  total: number;
  item_count: number;
  created_at: string;
  tracking_number: string | null;
};

export async function ambilRiwayat(): Promise<RingkasanPesanan[] | null> {
  const kepala = await kepalaSesi();
  if (!kepala) return null;

  const res = await fetch(`${alamatApi()}/api/account/orders`, {
    cache: "no-store",
    headers: kepala,
  });

  if (res.status === 401) return null;
  if (!res.ok) throw new Error(`Gagal mengambil riwayat pesanan (${res.status})`);

  return ((await res.json()) as { data: RingkasanPesanan[] }).data;
}
