import type { MetadataRoute } from "next";

import {
  SEMUA_GRUP,
  SEMUA_KATEGORI,
  type Produk,
  grupDariKategori,
} from "@/app/data/produk";
import { ambilSemuaProduk } from "@/app/lib/api";
import { tautan } from "@/app/lib/seo";

const STATIS: { path: string; prioritas: number }[] = [
  { path: "/", prioritas: 1 },
  { path: "/produk", prioritas: 0.9 },
  { path: "/faq", prioritas: 0.6 },
  { path: "/order", prioritas: 0.3 },
  { path: "/privasi", prioritas: 0.2 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const dasar: MetadataRoute.Sitemap = STATIS.map((s) => ({
    url: tautan(s.path),
    changeFrequency: "weekly",
    priority: s.prioritas,
  }));

  let daftar: Produk[] | null = null;

  try {
    daftar = await ambilSemuaProduk();
  } catch (e) {
    console.error("[sitemap] gagal mengambil produk", e);
  }

  const kategoriTerisi = daftar
    ? new Set(daftar.map((p) => p.kategori))
    : new Set(SEMUA_KATEGORI);

  const grupTerisi = daftar
    ? new Set(daftar.map((p) => grupDariKategori(p.kategori)))
    : new Set(SEMUA_GRUP);

  const grup: MetadataRoute.Sitemap = SEMUA_GRUP.filter((g) =>
    grupTerisi.has(g),
  ).map((g) => ({
    url: tautan(`/produk?grup=${g}`),
    changeFrequency: "weekly",
    priority: 0.85,
  }));

  const kategori: MetadataRoute.Sitemap = SEMUA_KATEGORI.filter((k) =>
    kategoriTerisi.has(k),
  ).map((k) => ({
    url: tautan(`/produk?kategori=${k}`),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const produk: MetadataRoute.Sitemap = (daftar ?? []).map((p) => ({
    url: tautan(`/produk/${p.slug}`),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...dasar, ...grup, ...kategori, ...produk];
}
