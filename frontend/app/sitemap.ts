import type { MetadataRoute } from "next";

import { ambilSemuaProduk, ambilSitus } from "@/app/lib/api";
import { tautan } from "@/app/lib/seo";
import { grupDariKategori } from "@/app/lib/situs";

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

  const [hasilProduk, hasilSitus] = await Promise.allSettled([ambilSemuaProduk(), ambilSitus()]);

  if (hasilProduk.status === "rejected") console.error("[sitemap] gagal mengambil produk", hasilProduk.reason);
  if (hasilSitus.status === "rejected") console.error("[sitemap] gagal mengambil kategori", hasilSitus.reason);

  const daftar = hasilProduk.status === "fulfilled" ? hasilProduk.value : null;
  const situs = hasilSitus.status === "fulfilled" ? hasilSitus.value : null;

  const kategoriTerisi = daftar ? new Set(daftar.map((p) => p.kategori)) : null;
  const grupTerisi =
    daftar && situs ? new Set(daftar.map((p) => grupDariKategori(situs, p.kategori))) : null;

  const grup: MetadataRoute.Sitemap = (situs?.grup ?? [])
    .filter((g) => !grupTerisi || grupTerisi.has(g.slug))
    .map((g) => ({
      url: tautan(`/produk?grup=${g.slug}`),
      changeFrequency: "weekly",
      priority: 0.85,
    }));

  const kategori: MetadataRoute.Sitemap = (situs?.kategori ?? [])
    .filter((k) => !kategoriTerisi || kategoriTerisi.has(k.slug))
    .map((k) => ({
      url: tautan(`/produk?kategori=${k.slug}`),
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
