import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { kendalaAsing, type Sql } from "../lib/db";
import type { KelompokFaqBaru } from "../lib/faq";
import type { IsiKategoriBersih } from "../lib/kategori";
import { periksaProdukBaru } from "../lib/products";
import type { TokoBersih } from "../lib/toko";
import { bersihkan, koneksiTes } from "../test/db";
import { perbaruiProduk, simpanProdukBaru } from "./produk";
import { ambilSitus, simpanFaq, simpanKategori, simpanToko, type Situs } from "./situs";

const sql: Sql = koneksiTes();
let asli: Situs;

const isiKategori = (s: Situs): IsiKategoriBersih => ({
  groups: s.groups,
  categories: s.categories.map(({ product_count: _jumlah, ...k }) => k),
});

const isiFaq = (s: Situs): KelompokFaqBaru[] =>
  s.faq.map((k) => ({
    slug: k.slug,
    title: k.title,
    items: k.items.map((x) => ({ question: x.question, answer: x.answer })),
  }));

function isiToko(s: Situs): TokoBersih {
  if (!s.store) throw new Error("store_settings kosong");
  const { updated_at: _waktu, ...toko } = s.store;
  return toko;
}

beforeAll(async () => {
  await bersihkan(sql);
  asli = await ambilSitus(sql, true);
});

beforeEach(async () => {
  await bersihkan(sql);
});

afterEach(async () => {
  await bersihkan(sql);
  await simpanKategori(sql, isiKategori(asli));
  await simpanFaq(sql, isiFaq(asli));
  await simpanToko(sql, isiToko(asli));
});

afterAll(async () => {
  await sql.end();
});

async function buatProduk(slug: string, category: string) {
  const periksa = periksaProdukBaru({
    slug,
    name: "Produk Uji",
    price: 25000,
    weight_g: 60,
    category,
    images: [{ cloudinary_id: "menik-store/produk/uji" }],
  });
  if (!periksa.ok) throw new Error(periksa.badan.message);
  return simpanProdukBaru(sql, periksa.bersih);
}

describe("isi awal dari migrasi", () => {
  it("sama dengan data yang dulu tertulis di kode frontend", async () => {
    const situs = await ambilSitus(sql);

    expect(situs.store).toMatchObject({
      wa_number: "6281317244671",
      wa_link: "https://wa.me/message/3CITYZQM7RROA1",
      address_city: "Jakarta Timur",
      postal_code: "13850",
      open_days: [1, 2, 3, 4, 5, 6],
      opens_at: "09:00",
      closes_at: "17:00",
      closed_on_holidays: true,
      social_links: [{ label: "Instagram", url: "https://www.instagram.com/menikstore12" }],
    });
    expect(situs.groups.map((g) => g.slug)).toEqual(["hama", "hewan", "rumah", "paket"]);
    expect(situs.categories).toHaveLength(19);
    expect(situs.categories[0]).toMatchObject({
      slug: "kucing",
      group_slug: "hama",
      title: "Pengusir Kucing",
      complaint: "Berak di teras & motor",
    });
    expect(situs.categories.filter((k) => k.complaint)).toHaveLength(13);
    expect(situs.faq.map((k) => k.slug)).toEqual(["produk", "pemesanan-pembayaran", "pengiriman", "pengembalian"]);
    expect(situs.faq.flatMap((k) => k.items)).toHaveLength(14);
    expect(situs.faq.flatMap((k) => k.items).some((x) => x.answer.startsWith("Dikirim dari {kota}."))).toBe(true);
  });

  it("jumlah produk per kategori cuma untuk admin", async () => {
    const publik = await ambilSitus(sql);
    const admin = await ambilSitus(sql, true);

    expect(publik.categories.every((k) => k.product_count === undefined)).toBe(true);
    expect(admin.categories.find((k) => k.slug === "kucing")?.product_count).toBeGreaterThan(0);
  });
});

describe("simpanToko", () => {
  it("mengganti isi dan memperbarui waktu ubah", async () => {
    const sebelum = await ambilSitus(sql);
    const hasil = await simpanToko(sql, {
      ...isiToko(sebelum),
      wa_number: "6281200000000",
      open_days: [1, 2, 3, 4, 5],
      social_links: [],
    });

    expect(hasil.wa_number).toBe("6281200000000");
    expect(hasil.open_days).toEqual([1, 2, 3, 4, 5]);
    expect(hasil.social_links).toEqual([]);
    expect(new Date(hasil.updated_at).getTime()).toBeGreaterThanOrEqual(
      new Date(sebelum.store?.updated_at ?? 0).getTime(),
    );
  });
});

describe("simpanKategori", () => {
  it("menambah, mengubah, dan mengurutkan sesuai kiriman", async () => {
    const awal = isiKategori(asli);
    const [kucing, ...sisa] = awal.categories;

    expect(
      await simpanKategori(sql, {
        groups: [...awal.groups, { slug: "kebun", label: "Kebun", title: "Perawatan Kebun", summary: "Untuk tanaman di kebun." }],
        categories: [
          ...sisa,
          { ...kucing, label: "Kucing liar" },
          {
            slug: "tanaman",
            group_slug: "kebun",
            label: "Tanaman",
            title: "Perawatan Tanaman",
            seo_title: "Perawatan Tanaman Alami",
            summary: "Perawatan tanaman di pot dan kebun.",
            complaint: null,
          },
        ],
      }),
    ).toEqual({ ok: true });

    const situs = await ambilSitus(sql);
    expect(situs.groups.at(-1)?.slug).toBe("kebun");
    expect(situs.categories.slice(-2).map((k) => [k.slug, k.label])).toEqual([
      ["kucing", "Kucing liar"],
      ["tanaman", "Tanaman"],
    ]);

    expect(await buatProduk("produk-kebun", "tanaman")).toMatchObject({ ok: true });
  });

  it("menolak menghapus kategori yang masih dipakai produk, dan tidak mengubah apa pun", async () => {
    const awal = isiKategori(asli);

    expect(
      await simpanKategori(sql, {
        groups: awal.groups,
        categories: awal.categories
          .filter((k) => k.slug !== "kucing")
          .map((k) => ({ ...k, label: `${k.label} baru` })),
      }),
    ).toEqual({ ok: false, alasan: "category_in_use", slugs: ["kucing"] });

    const situs = await ambilSitus(sql);
    expect(situs.categories).toHaveLength(19);
    expect(situs.categories.some((k) => k.label.endsWith(" baru"))).toBe(false);
  });

  it("menghapus kategori dan grup yang sudah tidak dipakai", async () => {
    const awal = isiKategori(asli);
    await sql`delete from products where category = 'aroma-rumah'`;

    expect(
      await simpanKategori(sql, {
        groups: awal.groups.filter((g) => g.slug !== "paket"),
        categories: awal.categories.filter((k) => k.slug !== "aroma-rumah" && k.group_slug !== "paket"),
      }),
    ).toEqual({ ok: true });

    const situs = await ambilSitus(sql);
    expect(situs.groups.map((g) => g.slug)).not.toContain("paket");
    expect(situs.categories.map((k) => k.slug)).not.toContain("aroma-rumah");
  });
});

describe("kategori produk dijaga database", () => {
  it("produk baru dan perubahan produk ditolak kalau kategorinya tidak ada", async () => {
    expect(await buatProduk("produk-burung", "burung")).toEqual({ ok: false, alasan: "invalid_category" });

    const galat = await perbaruiProduk(sql, "bye-bye-cat-50g", { category: "burung" }).catch((e: unknown) => e);
    expect(kendalaAsing(galat)).toBe("products_category_fkey");
  });
});

describe("simpanFaq", () => {
  it("mengganti seluruh FAQ sesuai urutan kiriman", async () => {
    await simpanFaq(sql, [
      {
        slug: "pengiriman",
        title: "Pengiriman",
        items: [
          { question: "Dikirim dari mana?", answer: "Dari {kota}." },
          { question: "Berapa lama?", answer: "1 sampai 3 hari." },
        ],
      },
      { slug: "umum", title: "Umum", items: [{ question: "Ada toko fisik?", answer: "Ada di {alamat}." }] },
    ]);

    const situs = await ambilSitus(sql);
    expect(situs.faq.map((k) => [k.slug, k.items.map((x) => x.question)])).toEqual([
      ["pengiriman", ["Dikirim dari mana?", "Berapa lama?"]],
      ["umum", ["Ada toko fisik?"]],
    ]);
  });
});
