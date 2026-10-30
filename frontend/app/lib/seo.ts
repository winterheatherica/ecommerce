import type { Metadata } from "next";

import type { Produk } from "@/app/data/produk";
import { HARI_SCHEMA, type InfoToko } from "@/app/lib/situs";

export const NAMA_SITUS = "Menik Store";

export const RINGKASAN =
  "Pengusir hama berbahan dasar alami. Bekerja dengan aroma yang dihindari hama, bukan dengan racun.";

export type GambarBagi = { url: string; lebar: number; tinggi: number };

export const GAMBAR_BAGI: GambarBagi = { url: "/og-persegi.jpg", lebar: 1200, tinggi: 1200 };

export function jenisKartu(g: GambarBagi): "summary" | "summary_large_image" {
  return g.lebar > g.tinggi ? "summary_large_image" : "summary";
}

export function gambarBagiFoto(url: string): GambarBagi {
  return {
    url: url.replace("/image/upload/", "/image/upload/f_jpg,q_auto,c_pad,w_1200,h_630,b_auto/"),
    lebar: 1200,
    tinggi: 630,
  };
}

const CADANGAN_URL = "https://menikstore.my.id";

export function situsUrl(): string {
  const dari = process.env.SITE_URL?.trim();
  const dipakai = dari && /^https?:\/\//i.test(dari) ? dari : CADANGAN_URL;
  return dipakai.replace(/\/+$/, "");
}

export function tautan(path = "/"): string {
  return new URL(path, `${situsUrl()}/`).toString();
}

export function bolehDiindeks(): boolean {
  return process.env.SIAP_DIINDEKS === "true";
}

export function potong(teks: string, batas = 155): string {
  const rapi = teks.replace(/\s+/g, " ").trim();
  if (rapi.length <= batas) return rapi;

  const potongan = rapi.slice(0, batas);
  const spasi = potongan.lastIndexOf(" ");

  return `${(spasi > 60 ? potongan.slice(0, spasi) : potongan).replace(/[.,;:]$/, "")}...`;
}

type OpsiMeta = {
  judul: string;
  ringkasan: string;
  path: string;
  judulUtuh?: string;
  gambar?: GambarBagi;
  indeks?: boolean;
};

export function metaHalaman(o: OpsiMeta): Metadata {
  const utuh = o.judulUtuh ?? `${o.judul} | ${NAMA_SITUS}`;
  const gambar = o.gambar ?? GAMBAR_BAGI;
  const ringkasan = potong(o.ringkasan);

  return {
    title: o.judulUtuh ? { absolute: o.judulUtuh } : o.judul,
    description: ringkasan,
    alternates: { canonical: o.path },
    openGraph: {
      type: "website",
      siteName: NAMA_SITUS,
      locale: "id_ID",
      url: o.path,
      title: utuh,
      description: ringkasan,
      images: [{ url: gambar.url, width: gambar.lebar, height: gambar.tinggi, alt: utuh }],
    },
    twitter: {
      card: jenisKartu(gambar),
      title: utuh,
      description: ringkasan,
      images: [gambar.url],
    },
    ...(o.indeks === false
      ? { robots: { index: false, follow: false } }
      : {}),
  };
}

export function skemaToko(toko: InfoToko) {
  return {
    "@context": "https://schema.org",
    "@type": "Store",
    "@id": tautan("/#toko"),
    name: NAMA_SITUS,
    description: RINGKASAN,
    url: tautan("/"),
    image: tautan(GAMBAR_BAGI.url),
    telephone: toko.waInternasional,
    currenciesAccepted: "IDR",
    paymentAccepted: "QRIS, Virtual Account, Indomaret, Alfamart",
    areaServed: { "@type": "Country", name: "Indonesia" },
    address: {
      "@type": "PostalAddress",
      streetAddress: `${toko.alamat.jalan}, ${toko.alamat.kelurahan}, Kec. ${toko.alamat.kecamatan}`,
      addressLocality: toko.alamat.kota,
      addressRegion: toko.alamat.provinsi,
      postalCode: toko.alamat.kodePos,
      addressCountry: "ID",
    },
    ...(toko.maps ? { hasMap: toko.maps } : {}),
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: toko.hariBuka.map((h) => HARI_SCHEMA[h]),
        opens: toko.buka,
        closes: toko.tutup,
      },
    ],
    sameAs: toko.sosial.map((s) => s.href),
  };
}

export function skemaProduk(produk: Produk, kategori: string) {
  const path = `/produk/${produk.slug}`;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": tautan(`${path}#produk`),
    name: produk.nama,
    description: potong(produk.deskripsi, 400),
    ...(produk.foto.length > 0 ? { image: produk.foto.map((f) => f.url) } : {}),
    sku: produk.slug,
    category: kategori,
    url: tautan(path),
    weight: {
      "@type": "QuantitativeValue",
      value: produk.beratG,
      unitCode: "GRM",
    },
    offers: {
      "@type": "Offer",
      url: tautan(path),
      price: produk.harga,
      priceCurrency: "IDR",
      itemCondition: "https://schema.org/NewCondition",
      availability:
        produk.stok > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      seller: { "@id": tautan("/#toko") },
    },
  };
}

export function skemaRemah(jejak: { nama: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: jejak.map((j, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: j.nama,
      item: tautan(j.path),
    })),
  };
}

export function skemaDaftarProduk(produk: Produk[], nama: string) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: nama,
    numberOfItems: produk.length,
    itemListElement: produk.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: p.nama,
      url: tautan(`/produk/${p.slug}`),
    })),
  };
}

export function skemaFaq(isi: { tanya: string; jawab: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: isi.map((i) => ({
      "@type": "Question",
      name: i.tanya,
      acceptedAnswer: { "@type": "Answer", text: i.jawab },
    })),
  };
}
