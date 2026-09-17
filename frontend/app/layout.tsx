import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import {
  GAMBAR_BAGI,
  NAMA_SITUS,
  RINGKASAN,
  bolehDiindeks,
  situsUrl,
} from "@/app/lib/seo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const JUDUL_BAWAAN = `${NAMA_SITUS} | Pengusir Hama Alami Berbahan Tumbuhan`;

export async function generateMetadata(): Promise<Metadata> {
  const terbuka = bolehDiindeks();

  return {
    metadataBase: new URL(situsUrl()),
    title: { default: JUDUL_BAWAAN, template: `%s | ${NAMA_SITUS}` },
    description: RINGKASAN,
    applicationName: NAMA_SITUS,
    authors: [{ name: NAMA_SITUS }],
    creator: NAMA_SITUS,
    publisher: NAMA_SITUS,
    keywords: [
      "pengusir kucing",
      "pengusir tikus",
      "pengusir kecoa",
      "pengusir cicak",
      "pengusir nyamuk",
      "pengusir hama alami",
      "pengusir hama tanpa racun",
    ],
    category: "shopping",
    formatDetection: { telephone: false, address: false, email: false },
    openGraph: {
      type: "website",
      siteName: NAMA_SITUS,
      locale: "id_ID",
      title: JUDUL_BAWAAN,
      description: RINGKASAN,
      images: [
        { url: GAMBAR_BAGI, width: 1200, height: 630, alt: JUDUL_BAWAAN },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: JUDUL_BAWAAN,
      description: RINGKASAN,
      images: [GAMBAR_BAGI],
    },
    robots: terbuka
      ? {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        }
      : { index: false, follow: false, nocache: true },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
