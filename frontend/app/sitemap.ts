import type { MetadataRoute } from "next";

import { kategoriLabel, type Kategori } from "@/app/data/produk";
import { ambilSemuaProduk } from "@/app/lib/api";
import { tautan } from "@/app/lib/seo";

const STATIS: { path: string; prioritas: number }[] = [
  { path: "/", prioritas: 1 },
  { path: "/produk", prioritas: 0.9 },
  { path: "/faq", prioritas: 0.6 },
  { path: "/order", prioritas: 0.3 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const dasar: MetadataRoute.Sitemap = STATIS.map((s) => ({
    url: tautan(s.path),
    changeFrequency: "weekly",
    priority: s.prioritas,
  }));

  const kategori: MetadataRoute.Sitemap = (
    Object.keys(kategoriLabel) as Kategori[]
  ).map((k) => ({
    url: tautan(`/produk?kategori=${k}`),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  let produk: MetadataRoute.Sitemap = [];

  try {
    const daftar = await ambilSemuaProduk();
    produk = daftar.map((p) => ({
      url: tautan(`/produk/${p.slug}`),
      changeFrequency: "weekly",
      priority: 0.7,
    }));
  } catch (e) {
    console.error("[sitemap] gagal mengambil produk", e);
  }

  return [...dasar, ...kategori, ...produk];
}
