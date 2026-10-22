import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { PUNYA_GAMBAR, urlGambar } from "@/app/data/gambar";
import type { Kategori, Produk, RingkasanUlasan, StatusPromo, Varian } from "@/app/data/produk";
import { petakanUlasan, type UlasanAPI } from "@/app/lib/ulasan";
import type { StatusPesanan } from "@/app/data/status-pesanan";
import { kepalaCookie } from "@/app/lib/akun";
import { kepalaPengunjung } from "@/app/lib/pengunjung";
import { dimensiPaket } from "@/app/lib/paket";

function basis(): string {
  return process.env.API_URL ?? "http://localhost:8787";
}

async function ambilAdmin(alamat: string): Promise<Response> {
  const token = (await cookies()).get("adm")?.value;
  const res = await fetch(alamat, {
    cache: "no-store",
    headers: { ...(await kepalaPengunjung()), ...(token ? { Cookie: `adm=${token}` } : {}) },
  });

  if (res.status === 401) redirect("/masuk-admin?galat=kedaluwarsa");
  return res;
}

type VarianAPI = {
  slug: string;
  sku?: string;
  label: string;
  price: number;
  weight_g: number;
  stock: number;
  is_active?: boolean;
  regular_price?: number | null;
  promo_visible_until?: string | null;
  promo_price?: number | null;
  promo_starts_at?: string | null;
  promo_ends_at?: string | null;
  promo_show_period?: boolean;
  promo_active?: boolean;
  promo_status?: StatusPromo;
  package_weight_g?: number | null;
  package_length_cm?: number | null;
  package_width_cm?: number | null;
  package_height_cm?: number | null;
  shopee_url?: string | null;
  shopee_rating?: number | null;
  shopee_rating_count?: number | null;
  shopee_rating_at?: string | null;
};

type ProdukAPI = {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  usage_instructions?: string | null;
  price: number;
  weight_g: number;
  stock: number;
  category: string;
  is_featured: boolean;
  is_active?: boolean;
  sold_per_month: number;
  sort_order: number;
  variants?: VarianAPI[];
  shopee_rating?: number | null;
  shopee_rating_count?: number;
  reviews?: UlasanAPI[];
  reviews_summary?: RingkasanUlasan;
};

type DaftarAPI = {
  data: ProdukAPI[];
  total: number;
  limit: number;
  offset: number;
};

function petakan(p: ProdukAPI): Produk {
  const varian: Varian[] = (p.variants ?? []).map((v) => ({
    slug: v.slug,
    sku: v.sku,
    label: v.label,
    harga: v.price,
    hargaNormal: v.regular_price ?? undefined,
    promoSampai: v.promo_visible_until ?? undefined,
    beratG: v.weight_g,
    stok: v.stock,
    gambar: PUNYA_GAMBAR.has(v.slug) ? urlGambar(v.slug) : undefined,
    aktif: v.is_active,
    paketBeratG: v.package_weight_g ?? null,
    paketDimensi: dimensiPaket(v),
    shopee:
      v.shopee_url || v.shopee_rating_count != null
        ? {
            url: v.shopee_url ?? null,
            rata: v.shopee_rating ?? null,
            jumlah: v.shopee_rating_count ?? null,
            per: v.shopee_rating_at ?? null,
          }
        : null,
    promo:
      v.promo_show_period === undefined
        ? undefined
        : {
            harga: v.promo_price ?? null,
            mulai: v.promo_starts_at ?? null,
            akhir: v.promo_ends_at ?? null,
            tampilkanPeriode: v.promo_show_period,
            aktif: v.promo_active ?? false,
            status: v.promo_status ?? "none",
          },
  }));

  const termurah = varian
    .filter((v) => v.aktif !== false)
    .reduce<Varian | null>((m, v) => (!m || v.harga < m.harga ? v : m), null);

  const berfoto = PUNYA_GAMBAR.has(p.slug)
    ? urlGambar(p.slug)
    : varian.find((v) => v.gambar)?.gambar;

  return {
    slug: p.slug,
    nama: p.name,
    deskripsi: p.description ?? "",
    caraPakai: p.usage_instructions ?? null,
    harga: termurah?.harga ?? p.price,
    hargaNormal: termurah?.hargaNormal,
    kategori: p.category as Kategori,
    beratG: p.weight_g,
    stok: p.stock,
    terjualPerBulan: p.sold_per_month,
    unggulan: p.is_featured,
    aktif: p.is_active,
    gambar: berfoto,
    varian,
    ratingShopee:
      p.shopee_rating != null && (p.shopee_rating_count ?? 0) > 0
        ? { rata: p.shopee_rating, jumlah: p.shopee_rating_count ?? 0 }
        : null,
    ulasan: p.reviews?.map(petakanUlasan),
    ringkasanUlasan: p.reviews_summary,
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
  const res = await fetch(alamat, { cache: "no-store", headers: await kepalaPengunjung() });

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
    const res = await fetch(alamat, { cache: "no-store", headers: await kepalaPengunjung() });

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
  const res = await fetch(alamat, { cache: "no-store", headers: await kepalaPengunjung() });

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
  product_active?: boolean;
  variant_slug?: string | null;
  sku: string | null;
  name_snapshot: string;
  qty: number;
  price_snapshot: number;
  list_price_snapshot: number | null;
  weight_g?: number | null;
  package_weight_g?: number | null;
};

export type Pesanan = {
  id: number;
  order_no: string;
  customer_name: string;
  phone: string;
  email: string | null;
  account_email?: string | null;
  address: string;
  notes: string | null;
  dest_id: string;
  dest_label: string;
  dest_postal_code: string | null;
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
  tracking: Lacak | null;
  tracking_checked_at: string | null;
  tracking_error?: string | null;
  created_at: string;
  paid_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  items: ItemPesanan[];
  samar?: boolean;
  dilihat_admin?: boolean;
  bisa_ulas?: boolean;
  ulasan_saya?: UlasanSaya[];
};

export type UlasanSaya = {
  variant_slug: string;
  rating: number;
  body: string | null;
  created_at: string;
  updated_at: string | null;
  editable_until: string;
};

export type PeristiwaLacak = {
  at: string | null;
  description: string;
  city: string | null;
};

export type Lacak = {
  delivered: boolean;
  receiver: string | null;
  delivered_at: string | null;
  status: string | null;
  events: PeristiwaLacak[];
  fetched_at: string;
};

export type HasilPesanan =
  | { status: "ada"; pesanan: Pesanan }
  | { status: "tidak_ada" }
  | { status: "perlu_masuk" }
  | { status: "akun_lain" };

export async function ambilPesanan(orderNo: string): Promise<HasilPesanan> {
  const res = await fetch(
    `${basis()}/api/orders/${encodeURIComponent(orderNo)}`,
    {
      cache: "no-store",
      headers: { ...(await kepalaPengunjung()), ...(await kepalaCookie()) },
    },
  );

  if (res.status === 404) return { status: "tidak_ada" };
  if (res.status === 401) return { status: "perlu_masuk" };
  if (res.status === 403) return { status: "akun_lain" };

  if (!res.ok) {
    throw new Error(`Gagal mengambil pesanan ${orderNo} (${res.status})`);
  }

  return { status: "ada", pesanan: (await res.json()) as Pesanan };
}

export async function ambilPesananAdmin(orderNo: string): Promise<Pesanan | null> {
  const res = await ambilAdmin(`${basis()}/api/admin/orders/${encodeURIComponent(orderNo)}`);

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
  const res = await ambilAdmin(`${basis()}/api/admin/orders${sisa ? `?${sisa}` : ""}`);

  if (!res.ok) {
    throw new Error(`Gagal mengambil daftar pesanan (${res.status})`);
  }

  const isi = (await res.json()) as { data: Pesanan[] };
  return isi.data;
}

export type StatusNotifikasi = { active: boolean; recipients: string[] };

export async function ambilStatusNotifikasi(): Promise<StatusNotifikasi> {
  const res = await ambilAdmin(`${basis()}/api/admin/notifications`);

  if (!res.ok) {
    throw new Error(`Gagal mengambil status notifikasi (${res.status})`);
  }

  return (await res.json()) as StatusNotifikasi;
}

const BATAS_ADMIN = 200;

export async function ambilProdukAdmin(): Promise<Produk[]> {
  const kumpulan: Produk[] = [];
  let offset = 0;

  for (;;) {
    const q = new URLSearchParams({
      limit: String(BATAS_ADMIN),
      offset: String(offset),
    });
    const res = await ambilAdmin(`${basis()}/api/admin/products?${q}`);

    if (!res.ok) {
      throw new Error(`Gagal mengambil produk admin (${res.status})`);
    }

    const isi = (await res.json()) as { data: ProdukAPI[]; total: number };
    kumpulan.push(...isi.data.map(petakan));

    if (isi.data.length === 0 || kumpulan.length >= isi.total) break;

    offset += BATAS_ADMIN;
  }

  return kumpulan;
}

export async function ambilSatuProdukAdmin(
  slug: string,
): Promise<Produk | null> {
  const res = await ambilAdmin(`${basis()}/api/admin/products/${encodeURIComponent(slug)}`);

  if (res.status === 404) return null;

  if (!res.ok) {
    throw new Error(`Gagal mengambil produk ${slug} (${res.status})`);
  }

  return petakan((await res.json()) as ProdukAPI);
}
