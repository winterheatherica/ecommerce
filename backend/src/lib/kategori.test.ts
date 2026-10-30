import { describe, expect, it } from "vitest";

import { periksaIsiKategori, type GrupBaru, type KategoriBaru } from "./kategori";

const grup = (slug: string): GrupBaru => ({
  slug,
  label: "Pengusir hama",
  title: "Pengusir Hama Alami",
  summary: "Pengusir hama berbahan dasar alami.",
});

const kategori = (slug: string, ubah: Partial<KategoriBaru> = {}): KategoriBaru => ({
  slug,
  group_slug: "hama",
  label: "Kucing",
  title: "Pengusir Kucing",
  seo_title: "Pengusir Kucing Alami",
  summary: "Pengusir kucing untuk teras dan motor.",
  complaint: "Berak di teras",
  ...ubah,
});

describe("periksaIsiKategori", () => {
  it("merapikan slug dan teks, keluhan kosong jadi null", () => {
    const hasil = periksaIsiKategori({
      groups: [{ ...grup(" Hama "), label: "  Pengusir   hama " }],
      categories: [kategori(" Kucing ", { group_slug: "HAMA", complaint: "   " })],
    });

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(hasil.bersih.groups[0]).toMatchObject({ slug: "hama", label: "Pengusir hama" });
    expect(hasil.bersih.categories[0]).toMatchObject({ slug: "kucing", group_slug: "hama", complaint: null });
  });

  it("menolak slug ganda, slug tidak sah, dan grup yang tidak ada", () => {
    const kasus = [
      { groups: [grup("hama"), grup("hama")], categories: [kategori("kucing")] },
      { groups: [grup("hama")], categories: [kategori("kucing"), kategori("kucing")] },
      { groups: [grup("hama")], categories: [kategori("kucing liar")] },
      { groups: [grup("hama")], categories: [kategori("kucing", { group_slug: "rumah" })] },
      { groups: [], categories: [kategori("kucing")] },
      { groups: [grup("hama")], categories: [] },
    ];

    for (const isi of kasus) {
      const hasil = periksaIsiKategori(isi);
      expect(hasil.ok, JSON.stringify(isi).slice(0, 120)).toBe(false);
    }
  });

  it("menyebut nama kategori yang salah di pesannya", () => {
    const hasil = periksaIsiKategori({
      groups: [grup("hama")],
      categories: [kategori("kucing", { label: "Kucing", summary: "pendek" })],
    });

    expect(hasil.ok).toBe(false);
    if (hasil.ok) return;
    expect(hasil.badan.message).toContain('Kategori "Kucing"');
    expect(hasil.badan.message).toContain("ringkasan");
  });
});
