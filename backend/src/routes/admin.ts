import { env } from "cloudflare:workers";
import { Elysia, t } from "elysia";

import { BADAN_ADMIN_DITOLAK, bypassAdmin } from "../lib/auth";
import { adminDariCookie } from "../db/admin";
import { buatKoneksi, kendalaAsing, tutup, type Sql } from "../lib/db";
import { GALAT_KATEGORI, periksaPerubahan, periksaProdukBaru } from "../lib/products";
import { periksaPerubahanVarian, periksaVarianBaru } from "../lib/variants";
import {
  daftarProdukAdmin,
  hapusProdukPermanen,
  perbaruiProduk,
  satuProdukAdmin,
  simpanProdukBaru,
} from "../db/produk";
import { perbaruiVarian, tambahVarian } from "../db/varian";
import {
  FOTO_MAKS_PER_PRODUK,
  bacaKonfigCloudinary,
  denganUrl,
  namaAwan,
  periksaBerkas,
  periksaFoto,
  produkDenganUrl,
  unggahFoto,
} from "../lib/cloudinary";
import { hapusFoto, tambahFoto, ubahUkuranFoto, urutkanFoto } from "../db/foto";
import { periksaToko } from "../lib/toko";
import { periksaIsiKategori } from "../lib/kategori";
import { periksaFaq } from "../lib/faq";
import { bannerAdmin, periksaBanner } from "../lib/banner";
import { ambilSitus, simpanFaq, simpanKategori, simpanToko } from "../db/situs";
import { simpanBanner } from "../db/banner";
import {
  periksaUlasanImpor,
  samarkanPengulas,
} from "../lib/ulasan";
import { bacaScreenshotUlasan, keBase64, periksaScreenshot, type PemanggilAi } from "../lib/baca-ulasan";
import { cariUlasanKembar, saranVarianUntuk, simpanUlasanMassal, type BarisImpor } from "../db/impor-ulasan";
import { daftarNamaMarketplace, hapusNamaMarketplace, tambahNamaMarketplace } from "../db/nama-marketplace";
import {
  ULASAN_PER_HALAMAN,
  halamanUlasan,
  tambahUlasanImpor,
  ubahTampilUlasan,
} from "../db/ulasan";
import {
  batalkanPesanan,
  cariPesanan,
  daftarPesanan,
  sapuKedaluwarsa,
  tandaiDikirim,
  tandaiSelesai,
  tandaiTerbayar,
  ubahResi,
  type HasilUbahStatus,
} from "../db/pesanan";
import { ambilLaporan, awalData, laporanCsv, laporanXlsx } from "../db/laporan";
import { hariIniWib, periksaRentang } from "../lib/laporan";
import { segarkanLacak } from "../db/lacak";
import { QUERY_ULASAN } from "./products";
import type { StatusPesanan } from "../lib/orders";
import { bacaKonfigEmail, emailUji, samarkanEmail } from "../lib/notifikasi";
import { kabarkan, statusKirimEmail } from "../db/notifikasi";

const STATUS = [
  "PENDING",
  "PAID",
  "SHIPPED",
  "DELIVERED",
  "EXPIRED",
  "CANCELLED",
] as const;

function galatUbah(
  hasil: Extract<HasilUbahStatus, { ok: false }>,
  syarat: string,
) {
  if (hasil.alasan === "not_found") {
    return {
      status: 404,
      badan: { error: "not_found", message: "Pesanan tidak ditemukan" },
    };
  }

  return {
    status: 409,
    badan: {
      error: "invalid_status",
      message: `${syarat} (sekarang ${hasil.status})`,
    },
  };
}

function koneksi() {
  return buatKoneksi(env as unknown as Record<string, unknown>);
}

function awan() {
  return namaAwan(env as unknown as Record<string, unknown>);
}

const QUERY_LAPORAN = t.Object({
  from: t.Optional(t.String({ maxLength: 10 })),
  to: t.Optional(t.String({ maxLength: 10 })),
  all: t.Optional(t.String({ maxLength: 5 })),
});

const JENIS_BERKAS = {
  csv: "text/csv; charset=utf-8",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
} as const;

async function berkasLaporan(
  query: { from?: string; to?: string; all?: string },
  jenis: keyof typeof JENIS_BERKAS,
): Promise<{ ok: true; berkas: Response } | { ok: false; status: number; badan: Record<string, unknown> }> {
  const periksa = periksaRentang(query);
  if (!periksa.ok) return { ok: false, status: periksa.status, badan: periksa.badan };

  const sql = koneksi();

  try {
    await sapuKedaluwarsa(sql);
    const rentang = periksa.rentang ?? { dari: await awalData(sql), sampai: hariIniWib() };
    const isi = jenis === "csv" ? await laporanCsv(sql, rentang) : await laporanXlsx(sql, rentang);

    return {
      ok: true,
      berkas: new Response(isi, {
        headers: {
          "Content-Type": JENIS_BERKAS[jenis],
          "Content-Disposition": `attachment; filename="pesanan-menik-store-${rentang.dari}-sd-${rentang.sampai}.${jenis}"`,
          "Cache-Control": "no-store",
        },
      }),
    };
  } finally {
    await tutup(sql);
  }
}

async function situsAdmin(sql: Sql) {
  const situs = await ambilSitus(sql, true);
  return { ...situs, banners: bannerAdmin(awan(), situs.banners) };
}

const FOTO = {
  cloudinary_id: t.String({ maxLength: 200 }),
  version: t.Optional(t.Union([t.Integer({ minimum: 1 }), t.Null()])),
  width: t.Optional(t.Union([t.Integer({ minimum: 1, maximum: 50000 }), t.Null()])),
  height: t.Optional(t.Union([t.Integer({ minimum: 1, maximum: 50000 }), t.Null()])),
};

export const adminRoutes = new Elysia({ prefix: "/api/admin" })
  .onBeforeHandle(async ({ set, headers }) => {
    const wadah = env as unknown as Record<string, unknown>;
    if (bypassAdmin(wadah)) return;

    const sql = buatKoneksi(wadah);

    try {
      if (await adminDariCookie(sql, headers.cookie)) return;
    } finally {
      await tutup(sql);
    }

    set.status = 401;
    return BADAN_ADMIN_DITOLAK;
  })
  .get(
    "/orders",
    async ({ query }) => {
      const { status, limit = 50, offset = 0 } = query;
      const sql = koneksi();

      try {
        return await daftarPesanan(sql, {
          status: status as StatusPesanan | undefined,
          limit,
          offset,
        });
      } finally {
        await tutup(sql);
      }
    },
    {
      query: t.Object({
        status: t.Optional(t.Union(STATUS.map((s) => t.Literal(s)))),
        limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100 })),
        offset: t.Optional(t.Numeric({ minimum: 0 })),
      }),
    },
  )
  .get(
    "/orders/:orderNo",
    async ({ params, set }) => {
      const sql = koneksi();

      try {
        const pesanan = await cariPesanan(sql, params.orderNo);

        if (!pesanan) {
          set.status = 404;
          return { error: "not_found", message: "Pesanan tidak ditemukan" };
        }

        return await segarkanLacak(sql, env as unknown as Record<string, unknown>, pesanan);
      } finally {
        await tutup(sql);
      }
    },
    {
      params: t.Object({ orderNo: t.String({ maxLength: 40 }) }),
    },
  )
  .patch(
    "/orders/:orderNo/tracking",
    async ({ params, body, set }) => {
      const sql = koneksi();

      try {
        const hasil = await ubahResi(sql, params.orderNo, body.tracking_number);

        if (!hasil.ok) {
          const g = galatUbah(
            hasil,
            "Resi hanya bisa diubah selama pesanan berstatus SHIPPED",
          );
          set.status = g.status;
          return g.badan;
        }

        return hasil.pesanan;
      } finally {
        await tutup(sql);
      }
    },
    {
      params: t.Object({ orderNo: t.String({ maxLength: 40 }) }),
      body: t.Object({
        tracking_number: t.String({ minLength: 4, maxLength: 60 }),
      }),
    },
  )
  .patch(
    "/orders/:orderNo/ship",
    async ({ params, body, set }) => {
      const sql = koneksi();

      try {
        const hasil = await tandaiDikirim(sql, params.orderNo, body.tracking_number);

        if (!hasil.ok) {
          const g = galatUbah(
            hasil,
            "Hanya pesanan berstatus PAID yang bisa dikirim",
          );
          set.status = g.status;
          return g.badan;
        }

        return hasil.pesanan;
      } finally {
        await tutup(sql);
      }
    },
    {
      params: t.Object({ orderNo: t.String({ maxLength: 40 }) }),
      body: t.Object({
        tracking_number: t.String({ minLength: 4, maxLength: 60 }),
      }),
    },
  )
  .patch(
    "/orders/:orderNo/deliver",
    async ({ params, set }) => {
      const sql = koneksi();

      try {
        const hasil = await tandaiSelesai(sql, params.orderNo);

        if (!hasil.ok) {
          const g = galatUbah(
            hasil,
            "Hanya pesanan berstatus SHIPPED yang bisa diselesaikan",
          );
          set.status = g.status;
          return g.badan;
        }

        return hasil.pesanan;
      } finally {
        await tutup(sql);
      }
    },
    { params: t.Object({ orderNo: t.String({ maxLength: 40 }) }) },
  )
  .patch(
    "/orders/:orderNo/cancel",
    async ({ params, set }) => {
      const sql = koneksi();

      try {
        const hasil = await batalkanPesanan(sql, params.orderNo);

        if (!hasil.ok) {
          const g = galatUbah(
            hasil,
            "Hanya pesanan yang belum dibayar yang bisa dibatalkan di sini",
          );
          set.status = g.status;
          return g.badan;
        }

        return hasil.pesanan;
      } finally {
        await tutup(sql);
      }
    },
    { params: t.Object({ orderNo: t.String({ maxLength: 40 }) }) },
  )
  .patch(
    "/orders/:orderNo/pay",
    async ({ params, body, set }) => {
      const sql = koneksi();

      try {
        const hasil = await tandaiTerbayar(sql, params.orderNo, body.method);

        if (!hasil.ok) {
          set.status = hasil.alasan === "not_found" ? 404 : 409;
          return {
            error: hasil.alasan,
            message:
              hasil.alasan === "not_found"
                ? "Pesanan tidak ditemukan"
                : "Hanya pesanan yang belum dibayar yang bisa ditandai lunas",
          };
        }

        return hasil.pesanan;
      } finally {
        await tutup(sql);
      }
    },
    {
      params: t.Object({ orderNo: t.String({ maxLength: 40 }) }),
      body: t.Object({ method: t.String({ minLength: 2, maxLength: 40 }) }),
    },
  )
  .get("/notifications", async () => {
    const surel = bacaKonfigEmail(env as unknown as Record<string, unknown>);
    const sql = koneksi();

    try {
      const status = await statusKirimEmail(sql);

      return {
        active: Boolean(surel),
        recipients: surel ? surel.ke.map(samarkanEmail) : [],
        history: status.riwayat,
        failed_in_a_row: status.gagalBeruntun,
      };
    } finally {
      await tutup(sql);
    }
  })
  .post("/notifications/test", async ({ set }) => {
    const wadah = env as unknown as Record<string, unknown>;
    const surel = bacaKonfigEmail(wadah);

    if (!surel) {
      set.status = 503;
      return { error: "email_unconfigured", message: "Notifikasi email belum disetel" };
    }

    const hasil = await kabarkan(wadah, surel, emailUji(surel.toko));

    if (!hasil.ok) {
      set.status = 502;
      return { error: "email_failed", message: `Email gagal dikirim: ${hasil.pesan}` };
    }

    return { sent: true, recipients: surel.ke.map(samarkanEmail) };
  })
  .get(
    "/reports",
    async ({ query, set }) => {
      const periksa = periksaRentang(query);

      if (!periksa.ok) {
        set.status = periksa.status;
        return periksa.badan;
      }

      const sql = koneksi();

      try {
        await sapuKedaluwarsa(sql);
        return await ambilLaporan(sql, periksa.rentang);
      } finally {
        await tutup(sql);
      }
    },
    { query: QUERY_LAPORAN },
  )
  .get(
    "/reports/orders.csv",
    async ({ query, set }) => {
      const hasil = await berkasLaporan(query, "csv");

      if (!hasil.ok) {
        set.status = hasil.status;
        return hasil.badan;
      }

      return hasil.berkas;
    },
    { query: QUERY_LAPORAN },
  )
  .get(
    "/reports/orders.xlsx",
    async ({ query, set }) => {
      const hasil = await berkasLaporan(query, "xlsx");

      if (!hasil.ok) {
        set.status = hasil.status;
        return hasil.badan;
      }

      return hasil.berkas;
    },
    { query: QUERY_LAPORAN },
  )
  .get("/site", async () => {
    const sql = koneksi();

    try {
      return await situsAdmin(sql);
    } finally {
      await tutup(sql);
    }
  })
  .put(
    "/store",
    async ({ body, set }) => {
      const periksa = periksaToko(body);

      if (!periksa.ok) {
        set.status = periksa.status;
        return periksa.badan;
      }

      const sql = koneksi();

      try {
        return await simpanToko(sql, periksa.bersih);
      } finally {
        await tutup(sql);
      }
    },
    {
      body: t.Object({
        wa_number: t.String({ maxLength: 40 }),
        wa_link: t.Optional(t.Union([t.String({ maxLength: 400 }), t.Null()])),
        address_street: t.String({ maxLength: 400 }),
        address_village: t.String({ maxLength: 200 }),
        address_district: t.String({ maxLength: 200 }),
        address_city: t.String({ maxLength: 200 }),
        address_province: t.String({ maxLength: 200 }),
        postal_code: t.String({ maxLength: 20 }),
        maps_url: t.Optional(t.Union([t.String({ maxLength: 400 }), t.Null()])),
        open_days: t.Array(t.Integer({ minimum: 1, maximum: 7 }), { maxItems: 14 }),
        opens_at: t.String({ maxLength: 10 }),
        closes_at: t.String({ maxLength: 10 }),
        closed_on_holidays: t.Boolean(),
        social_links: t.Array(
          t.Object({ label: t.String({ maxLength: 100 }), url: t.String({ maxLength: 400 }) }),
          { maxItems: 40 },
        ),
        google_site_verifications: t.Optional(t.Array(t.String({ maxLength: 600 }), { maxItems: 20 })),
      }),
    },
  )
  .put(
    "/categories",
    async ({ body, set }) => {
      const periksa = periksaIsiKategori(body);

      if (!periksa.ok) {
        set.status = periksa.status;
        return periksa.badan;
      }

      const sql = koneksi();

      try {
        const hasil = await simpanKategori(sql, periksa.bersih);

        if (!hasil.ok) {
          set.status = 409;
          return {
            error: "category_in_use",
            message: `Kategori ${hasil.slugs.join(", ")} masih dipakai produk. Pindahkan produknya ke kategori lain dulu`,
            field: "categories",
          };
        }

        return await situsAdmin(sql);
      } finally {
        await tutup(sql);
      }
    },
    {
      body: t.Object({
        groups: t.Array(
          t.Object({
            slug: t.String({ maxLength: 80 }),
            label: t.String({ maxLength: 200 }),
            title: t.String({ maxLength: 200 }),
            summary: t.String({ maxLength: 1000 }),
          }),
          { maxItems: 60 },
        ),
        categories: t.Array(
          t.Object({
            slug: t.String({ maxLength: 80 }),
            group_slug: t.String({ maxLength: 80 }),
            label: t.String({ maxLength: 200 }),
            title: t.String({ maxLength: 200 }),
            seo_title: t.String({ maxLength: 200 }),
            summary: t.String({ maxLength: 1000 }),
            complaint: t.Optional(t.Union([t.String({ maxLength: 200 }), t.Null()])),
          }),
          { maxItems: 300 },
        ),
      }),
    },
  )
  .put(
    "/faq",
    async ({ body, set }) => {
      const periksa = periksaFaq(body.groups);

      if (!periksa.ok) {
        set.status = periksa.status;
        return periksa.badan;
      }

      const sql = koneksi();

      try {
        await simpanFaq(sql, periksa.bersih);
        return await situsAdmin(sql);
      } finally {
        await tutup(sql);
      }
    },
    {
      body: t.Object({
        groups: t.Array(
          t.Object({
            slug: t.String({ maxLength: 120 }),
            title: t.String({ maxLength: 200 }),
            items: t.Array(
              t.Object({ question: t.String({ maxLength: 600 }), answer: t.String({ maxLength: 6000 }) }),
              { maxItems: 150 },
            ),
          }),
          { maxItems: 60 },
        ),
      }),
    },
  )
  .put(
    "/banners",
    async ({ body, set }) => {
      const periksa = periksaBanner(body.banners);

      if (!periksa.ok) {
        set.status = periksa.status;
        return periksa.badan;
      }

      const sql = koneksi();

      try {
        await simpanBanner(sql, periksa.bersih);
        return await situsAdmin(sql);
      } finally {
        await tutup(sql);
      }
    },
    {
      body: t.Object({
        banners: t.Array(
          t.Object({
            cloudinary_id: t.Optional(t.Union([t.String({ maxLength: 200 }), t.Null()])),
            static_path: t.Optional(t.Union([t.String({ maxLength: 200 }), t.Null()])),
            version: t.Optional(t.Union([t.Integer({ minimum: 1 }), t.Null()])),
            width: t.Optional(t.Union([t.Integer({ minimum: 1, maximum: 50000 }), t.Null()])),
            height: t.Optional(t.Union([t.Integer({ minimum: 1, maximum: 50000 }), t.Null()])),
            alt: t.String({ maxLength: 400 }),
            link: t.Optional(t.Union([t.String({ maxLength: 600 }), t.Null()])),
          }),
          { maxItems: 20 },
        ),
      }),
    },
  )
  .post(
    "/banners/images",
    async ({ body, set }) => {
      const konfig = bacaKonfigCloudinary(env as unknown as Record<string, unknown>);

      if (!konfig) {
        set.status = 503;
        return { error: "upload_unconfigured", message: "Upload foto belum disetel di server" };
      }

      const salah = await periksaBerkas(body.file);

      if (salah) {
        set.status = 422;
        return { error: "invalid_file", message: salah, field: "file" };
      }

      const hasil = await unggahFoto(konfig, body.file, "banner");

      if (!hasil.ok) {
        set.status = 502;
        return { error: "upload_failed", message: `Banner gagal diunggah: ${hasil.pesan}` };
      }

      set.status = 201;
      return denganUrl(konfig.awan, hasil.foto);
    },
    { body: t.Object({ file: t.File() }) },
  )
  .get(
    "/products",
    async ({ query }) => {
      const sql = koneksi();

      try {
        const hasil = await daftarProdukAdmin(sql, query.limit ?? 100, query.offset ?? 0);
        const a = awan();

        return { ...hasil, data: hasil.data.map((p) => produkDenganUrl(a, p)) };
      } finally {
        await tutup(sql);
      }
    },
    {
      query: t.Object({
        limit: t.Optional(t.Numeric({ minimum: 1, maximum: 200 })),
        offset: t.Optional(t.Numeric({ minimum: 0 })),
      }),
    },
  )
  .get(
    "/products/:slug",
    async ({ params, set }) => {
      const sql = koneksi();

      try {
        const produk = await satuProdukAdmin(sql, params.slug);

        if (!produk) {
          set.status = 404;
          return { error: "not_found", message: "Produk tidak ditemukan" };
        }

        return produkDenganUrl(awan(), produk);
      } finally {
        await tutup(sql);
      }
    },
    { params: t.Object({ slug: t.String({ maxLength: 120 }) }) },
  )
  .post(
    "/products",
    async ({ body, set }) => {
      const periksa = periksaProdukBaru(body);

      if (!periksa.ok) {
        set.status = periksa.status;
        return periksa.badan;
      }

      const sql = koneksi();

      try {
        const hasil = await simpanProdukBaru(sql, periksa.bersih);

        if (!hasil.ok && hasil.alasan === "invalid_category") {
          set.status = GALAT_KATEGORI.status;
          return GALAT_KATEGORI.badan;
        }

        if (!hasil.ok) {
          set.status = 409;
          return {
            error: "slug_taken",
            message: `Slug "${periksa.bersih.slug}" sudah dipakai produk lain`,
            field: "slug",
          };
        }

        set.status = 201;
        return produkDenganUrl(awan(), hasil.produk);
      } finally {
        await tutup(sql);
      }
    },
    {
      body: t.Object({
        slug: t.String({ minLength: 1, maxLength: 120 }),
        name: t.String({ minLength: 3, maxLength: 200 }),
        description: t.Optional(t.String({ maxLength: 2000 })),
        price: t.Integer({ minimum: 1, maximum: 100000000 }),
        weight_g: t.Integer({ minimum: 1, maximum: 50000 }),
        stock: t.Optional(t.Integer({ minimum: 0, maximum: 100000 })),
        category: t.String({ maxLength: 40 }),
        is_featured: t.Optional(t.Boolean()),
        sold_per_month: t.Optional(t.Integer({ minimum: 0, maximum: 100000 })),
        sort_order: t.Optional(t.Integer({ minimum: 0, maximum: 10000 })),
        is_active: t.Optional(t.Boolean()),
        usage_instructions: t.Optional(t.Union([t.String({ maxLength: 4000 }), t.Null()])),
        images: t.Optional(t.Array(t.Object(FOTO))),
      }),
    },
  )
  .post(
    "/images",
    async ({ body, set }) => {
      const konfig = bacaKonfigCloudinary(env as unknown as Record<string, unknown>);

      if (!konfig) {
        set.status = 503;
        return { error: "upload_unconfigured", message: "Upload foto belum disetel di server" };
      }

      const salah = await periksaBerkas(body.file);

      if (salah) {
        set.status = 422;
        return { error: "invalid_file", message: salah, field: "file" };
      }

      const hasil = await unggahFoto(konfig, body.file);

      if (!hasil.ok) {
        set.status = 502;
        return { error: "upload_failed", message: `Foto gagal diunggah: ${hasil.pesan}` };
      }

      set.status = 201;
      return denganUrl(konfig.awan, hasil.foto);
    },
    { body: t.Object({ file: t.File() }) },
  )
  .post(
    "/products/:slug/images",
    async ({ params, body, set }) => {
      const foto = periksaFoto(body);

      if (!foto) {
        set.status = 422;
        return { error: "invalid_image", message: "Data foto tidak valid", field: "images" };
      }

      const sql = koneksi();

      try {
        const hasil = await tambahFoto(
          sql,
          params.slug,
          foto,
          body.variant_slug ?? null,
          FOTO_MAKS_PER_PRODUK,
        );

        if (!hasil.ok && hasil.alasan === "not_found") {
          set.status = 404;
          return { error: "not_found", message: "Produk tidak ditemukan" };
        }

        if (!hasil.ok && hasil.alasan === "variant_not_found") {
          set.status = 422;
          return {
            error: "variant_not_found",
            message: "Ukuran itu bukan milik produk ini",
            field: "variant_slug",
          };
        }

        if (!hasil.ok && hasil.alasan === "too_many") {
          set.status = 422;
          return {
            error: "too_many_images",
            message: `Maksimal ${FOTO_MAKS_PER_PRODUK} foto per produk`,
            field: "images",
          };
        }

        if (!hasil.ok) {
          set.status = 409;
          return {
            error: "duplicate_image",
            message: "Foto ini sudah terpasang di produk ini",
            field: "images",
          };
        }

        set.status = 201;
        return denganUrl(awan(), hasil.foto);
      } finally {
        await tutup(sql);
      }
    },
    {
      params: t.Object({ slug: t.String({ maxLength: 120 }) }),
      body: t.Object({
        ...FOTO,
        variant_slug: t.Optional(t.Union([t.String({ maxLength: 120 }), t.Null()])),
      }),
    },
  )
  .put(
    "/products/:slug/images/order",
    async ({ params, body, set }) => {
      const sql = koneksi();

      try {
        const hasil = await urutkanFoto(sql, params.slug, body.ids);

        if (!hasil.ok && hasil.alasan === "not_found") {
          set.status = 404;
          return { error: "not_found", message: "Produk tidak ditemukan" };
        }

        if (!hasil.ok) {
          set.status = 409;
          return {
            error: "images_changed",
            message: "Daftar foto sudah berubah. Muat ulang halaman lalu urutkan lagi",
          };
        }

        return { saved: true };
      } finally {
        await tutup(sql);
      }
    },
    {
      params: t.Object({ slug: t.String({ maxLength: 120 }) }),
      body: t.Object({
        ids: t.Array(t.Integer({ minimum: 1 }), { minItems: 1, maxItems: FOTO_MAKS_PER_PRODUK }),
      }),
    },
  )
  .patch(
    "/images/:id",
    async ({ params, body, set }) => {
      const sql = koneksi();

      try {
        const hasil = await ubahUkuranFoto(sql, params.id, body.variant_slug);

        if (!hasil.ok && hasil.alasan === "variant_not_found") {
          set.status = 422;
          return {
            error: "variant_not_found",
            message: "Ukuran itu bukan milik produk ini",
            field: "variant_slug",
          };
        }

        if (!hasil.ok) {
          set.status = 404;
          return { error: "not_found", message: "Foto tidak ditemukan" };
        }

        return denganUrl(awan(), hasil.foto);
      } finally {
        await tutup(sql);
      }
    },
    {
      params: t.Object({ id: t.Numeric({ minimum: 1 }) }),
      body: t.Object({ variant_slug: t.Union([t.String({ maxLength: 120 }), t.Null()]) }),
    },
  )
  .delete(
    "/images/:id",
    async ({ params, set }) => {
      const sql = koneksi();

      try {
        const hasil = await hapusFoto(sql, params.id);

        if (!hasil.ok && hasil.alasan === "last_image") {
          set.status = 409;
          return {
            error: "last_image",
            message: "Produk wajib punya minimal satu foto. Tambahkan foto lain dulu sebelum menghapus yang ini",
          };
        }

        if (!hasil.ok) {
          set.status = 404;
          return { error: "not_found", message: "Foto tidak ditemukan" };
        }

        return { deleted: true };
      } finally {
        await tutup(sql);
      }
    },
    { params: t.Object({ id: t.Numeric({ minimum: 1 }) }) },
  )
  .patch(
    "/products/:slug",
    async ({ params, body, set }) => {
      const periksa = periksaPerubahan(body);

      if (!periksa.ok) {
        set.status = periksa.status;
        return periksa.badan;
      }

      const sql = koneksi();

      try {
        const produk = await perbaruiProduk(sql, params.slug, periksa.bersih).catch((e: unknown) => {
          if (kendalaAsing(e) === "products_category_fkey") return "invalid_category" as const;
          throw e;
        });

        if (produk === "invalid_category") {
          set.status = GALAT_KATEGORI.status;
          return GALAT_KATEGORI.badan;
        }

        if (!produk) {
          set.status = 404;
          return { error: "not_found", message: "Produk tidak ditemukan" };
        }

        return produkDenganUrl(awan(), produk);
      } finally {
        await tutup(sql);
      }
    },
    {
      params: t.Object({ slug: t.String({ maxLength: 120 }) }),
      body: t.Object({
        name: t.Optional(t.String({ minLength: 3, maxLength: 200 })),
        description: t.Optional(t.String({ maxLength: 2000 })),
        price: t.Optional(t.Integer({ minimum: 1, maximum: 100000000 })),
        weight_g: t.Optional(t.Integer({ minimum: 1, maximum: 50000 })),
        stock: t.Optional(t.Integer({ minimum: 0, maximum: 100000 })),
        category: t.Optional(t.String({ maxLength: 40 })),
        is_featured: t.Optional(t.Boolean()),
        sold_per_month: t.Optional(t.Integer({ minimum: 0, maximum: 100000 })),
        sort_order: t.Optional(t.Integer({ minimum: 0, maximum: 10000 })),
        is_active: t.Optional(t.Boolean()),
        usage_instructions: t.Optional(t.Union([t.String({ maxLength: 4000 }), t.Null()])),
      }),
    },
  )
  .delete(
    "/products/:slug",
    async ({ params, set }) => {
      const sql = koneksi();

      try {
        const hasil = await hapusProdukPermanen(sql, params.slug);

        if (hasil.ok) {
          return { deleted: true, variants: hasil.ukuran, images: hasil.foto, reviews: hasil.ulasan };
        }

        if (hasil.alasan === "not_found") {
          set.status = 404;
          return { error: "not_found", message: "Produk tidak ditemukan" };
        }

        set.status = 409;

        if (hasil.alasan === "active") {
          return {
            error: "product_active",
            message:
              "Produk ini masih tampil di toko. Hilangkan centang Tampilkan di toko lalu simpan, baru bisa dihapus permanen",
          };
        }

        return {
          error: "product_ordered",
          message: `Produk ini ${hasil.pesanan ? `ada di ${hasil.pesanan} pesanan` : "sudah pernah dipesan"}, jadi tidak bisa dihapus permanen supaya riwayat pesanan dan laporan tetap utuh. Biarkan nonaktif saja`,
        };
      } finally {
        await tutup(sql);
      }
    },
    { params: t.Object({ slug: t.String({ maxLength: 120 }) }) },
  )
  .post(
    "/products/:slug/variants",
    async ({ params, body, set }) => {
      const periksa = periksaVarianBaru(body);

      if (!periksa.ok) {
        set.status = periksa.status;
        return periksa.badan;
      }

      const sql = koneksi();

      try {
        const hasil = await tambahVarian(sql, params.slug, periksa.bersih);

        if (!hasil.ok && hasil.alasan === "not_found") {
          set.status = 404;
          return { error: "not_found", message: "Produk tidak ditemukan" };
        }

        if (!hasil.ok && hasil.alasan === "sku_taken") {
          set.status = 409;
          return {
            error: "sku_taken",
            message: periksa.bersih.sku
              ? `SKU "${periksa.bersih.sku}" sudah dipakai varian lain`
              : "SKU otomatis bentrok dengan SKU yang diisi manual. Coba simpan sekali lagi",
            field: "sku",
          };
        }

        if (!hasil.ok) {
          set.status = 409;
          return {
            error: "slug_taken",
            message: `Slug "${periksa.bersih.slug}" sudah dipakai varian lain`,
            field: "slug",
          };
        }

        set.status = 201;
        return hasil.varian;
      } finally {
        await tutup(sql);
      }
    },
    {
      params: t.Object({ slug: t.String({ maxLength: 120 }) }),
      body: t.Object({
        slug: t.String({ minLength: 1, maxLength: 120 }),
        sku: t.Optional(t.String({ maxLength: 40 })),
        label: t.String({ minLength: 1, maxLength: 60 }),
        price: t.Integer({ minimum: 1, maximum: 100000000 }),
        weight_g: t.Integer({ minimum: 1, maximum: 50000 }),
        stock: t.Optional(t.Integer({ minimum: 0, maximum: 100000 })),
        sort_order: t.Optional(t.Integer({ minimum: 0, maximum: 10000 })),
      }),
    },
  )
  .patch(
    "/variants/:slug",
    async ({ params, body, set }) => {
      const periksa = periksaPerubahanVarian(body);

      if (!periksa.ok) {
        set.status = periksa.status;
        return periksa.badan;
      }

      const sql = koneksi();

      try {
        const hasil = await perbaruiVarian(sql, params.slug, periksa.bersih);

        if (!hasil.ok && hasil.alasan === "sku_taken") {
          set.status = 409;
          return {
            error: "sku_taken",
            message: `SKU "${periksa.bersih.sku}" sudah dipakai varian lain`,
            field: "sku",
          };
        }

        if (!hasil.ok && hasil.alasan === "promo_not_cheaper") {
          set.status = 422;
          return {
            error: "promo_not_cheaper",
            message: "Harga promo harus lebih murah dari harga normal",
            field: "promo",
          };
        }

        if (!hasil.ok && hasil.alasan === "promo_period_reversed") {
          set.status = 422;
          return {
            error: "promo_period_reversed",
            message: "Tanggal berakhir promo harus setelah tanggal mulainya",
            field: "promo",
          };
        }

        if (!hasil.ok && hasil.alasan === "package_dimensions_incomplete") {
          set.status = 422;
          return {
            error: "package_dimensions_incomplete",
            message: "Dimensi paket harus lengkap: panjang, lebar, dan tinggi",
            field: "package",
          };
        }

        if (!hasil.ok && hasil.alasan === "shopee_url_invalid") {
          set.status = 422;
          return {
            error: "invalid_shopee_url",
            message: "Link Shopee harus diawali https://shopee.co.id/ dan maksimal 300 karakter",
            field: "shopee",
          };
        }

        if (!hasil.ok && hasil.alasan === "shopee_rating_inconsistent") {
          set.status = 422;
          return {
            error: "shopee_rating_inconsistent",
            message:
              "Rating Shopee wajib diisi (1 sampai 5) kalau jumlah penilaiannya lebih dari 0, dan dikosongkan kalau belum ada penilaian",
            field: "shopee",
          };
        }

        if (!hasil.ok && hasil.alasan === "tokopedia_url_invalid") {
          set.status = 422;
          return {
            error: "invalid_tokopedia_url",
            message: "Link Tokopedia harus diawali https://www.tokopedia.com/ dan maksimal 300 karakter",
            field: "tokopedia",
          };
        }

        if (!hasil.ok && hasil.alasan === "tokopedia_rating_inconsistent") {
          set.status = 422;
          return {
            error: "tokopedia_rating_inconsistent",
            message:
              "Rating Tokopedia wajib diisi (1 sampai 5) kalau jumlah ratingnya lebih dari 0, dan dikosongkan kalau belum ada rating",
            field: "tokopedia",
          };
        }

        if (!hasil.ok) {
          set.status = 404;
          return { error: "not_found", message: "Varian tidak ditemukan" };
        }

        return hasil.varian;
      } finally {
        await tutup(sql);
      }
    },
    {
      params: t.Object({ slug: t.String({ maxLength: 120 }) }),
      body: t.Object({
        sku: t.Optional(t.String({ minLength: 1, maxLength: 40 })),
        label: t.Optional(t.String({ minLength: 1, maxLength: 60 })),
        price: t.Optional(t.Integer({ minimum: 1, maximum: 100000000 })),
        weight_g: t.Optional(t.Integer({ minimum: 1, maximum: 50000 })),
        stock: t.Optional(t.Integer({ minimum: 0, maximum: 100000 })),
        sort_order: t.Optional(t.Integer({ minimum: 0, maximum: 10000 })),
        is_active: t.Optional(t.Boolean()),
        promo_price: t.Optional(
          t.Union([t.Integer({ minimum: 1, maximum: 100000000 }), t.Null()]),
        ),
        promo_starts_at: t.Optional(t.Union([t.String({ maxLength: 40 }), t.Null()])),
        promo_ends_at: t.Optional(t.Union([t.String({ maxLength: 40 }), t.Null()])),
        promo_show_period: t.Optional(t.Boolean()),
        package_weight_g: t.Optional(
          t.Union([t.Integer({ minimum: 1, maximum: 50000 }), t.Null()]),
        ),
        package_length_cm: t.Optional(t.Union([t.Integer({ minimum: 1, maximum: 300 }), t.Null()])),
        package_width_cm: t.Optional(t.Union([t.Integer({ minimum: 1, maximum: 300 }), t.Null()])),
        package_height_cm: t.Optional(t.Union([t.Integer({ minimum: 1, maximum: 300 }), t.Null()])),
        shopee_url: t.Optional(t.Union([t.String({ maxLength: 300 }), t.Null()])),
        shopee_rating: t.Optional(t.Union([t.Number({ minimum: 1, maximum: 5 }), t.Null()])),
        shopee_rating_count: t.Optional(
          t.Union([t.Integer({ minimum: 0, maximum: 100000000 }), t.Null()]),
        ),
        tokopedia_url: t.Optional(t.Union([t.String({ maxLength: 300 }), t.Null()])),
        tokopedia_rating: t.Optional(t.Union([t.Number({ minimum: 1, maximum: 5 }), t.Null()])),
        tokopedia_rating_count: t.Optional(
          t.Union([t.Integer({ minimum: 0, maximum: 100000000 }), t.Null()]),
        ),
      }),
    },
  )
  .post(
    "/variants/:slug/reviews",
    async ({ params, body, set }) => {
      const periksa = periksaUlasanImpor(body);

      if (!periksa.ok) {
        set.status = periksa.status;
        return periksa.badan;
      }

      const sql = koneksi();

      try {
        const ulasan = await tambahUlasanImpor(sql, params.slug, periksa.bersih);

        if (!ulasan) {
          set.status = 404;
          return { error: "not_found", message: "Varian tidak ditemukan" };
        }

        set.status = 201;
        return ulasan;
      } finally {
        await tutup(sql);
      }
    },
    {
      params: t.Object({ slug: t.String({ maxLength: 120 }) }),
      body: t.Object({
        source: t.Optional(t.Union([t.Literal("shopee"), t.Literal("tokopedia")])),
        rating: t.Integer({ minimum: 1, maximum: 5 }),
        author_name: t.String({ minLength: 1, maxLength: 60 }),
        body: t.Optional(t.Union([t.String({ maxLength: 3000 }), t.Null()])),
        follow_up: t.Optional(t.Union([t.String({ maxLength: 3000 }), t.Null()])),
        reviewed_at: t.String({ maxLength: 40 }),
        source_product: t.Optional(t.Union([t.String({ maxLength: 200 }), t.Null()])),
        source_url: t.Optional(t.Union([t.String({ maxLength: 400 }), t.Null()])),
      }),
    },
  )
  .post(
    "/reviews/screenshot",
    async ({ body, set }) => {
      const ai = (env as unknown as Record<string, unknown>).AI as PemanggilAi | undefined;

      if (!ai || typeof ai.run !== "function") {
        set.status = 503;
        return { error: "ai_unconfigured", message: "Fitur baca screenshot belum disetel di server" };
      }

      const berkas = await periksaScreenshot(body.file);

      if (!berkas.ok) {
        set.status = 422;
        return { error: "invalid_file", message: berkas.pesan, field: "file" };
      }

      const hasil = await bacaScreenshotUlasan(ai, {
        base64: keBase64(new Uint8Array(await body.file.arrayBuffer())),
        mime: berkas.mime,
      });

      if (!hasil.ok) {
        if (hasil.alasan === "kuota") {
          set.status = 429;
          return {
            error: "ai_quota",
            message: "Jatah baca screenshot hari ini sudah habis. Coba lagi besok setelah jam 07.00 WIB.",
          };
        }

        set.status = 502;
        return { error: "ai_failed", message: "Screenshot gagal dibaca. Coba unggah ulang, atau pakai screenshot yang lebih jelas." };
      }

      const sql = koneksi();

      try {
        const saran = await saranVarianUntuk(sql, body.source, hasil.ulasan.map((u) => u.produk));
        const kembar = await cariUlasanKembar(
          sql,
          body.source,
          hasil.ulasan.map((u) => ({
            nama_asli: u.nama,
            nama_samaran: samarkanPengulas(u.nama),
            rating: u.bintang,
            body: u.teks,
            reviewed_at: u.tanggal,
          })),
        );

        return {
          reviews: hasil.ulasan.map((u, i) => ({
            author_name_raw: u.nama,
            author_name: samarkanPengulas(u.nama),
            rating: u.bintang,
            body: u.teks,
            reviewed_at: u.tanggal,
            reviewed_precision: u.presisi,
            marketplace_product: u.produk,
            complete: u.utuh,
            variant_slug: saran[i]?.tebakan?.slug ?? null,
            variant_guess: saran[i]?.tebakan?.dari ?? null,
            variant_candidates: saran[i]?.kandidat ?? [],
            duplicate: kembar[i],
          })),
        };
      } finally {
        await tutup(sql);
      }
    },
    {
      body: t.Object({
        file: t.File(),
        source: t.Union([t.Literal("shopee"), t.Literal("tokopedia")]),
      }),
    },
  )
  .post(
    "/reviews/batch",
    async ({ body, set }) => {
      const galat: { index: number; message: string }[] = [];
      const baris: BarisImpor[] = [];

      body.reviews.forEach((r, i) => {
        const periksa = periksaUlasanImpor({
          source: body.source,
          rating: r.rating,
          author_name: r.author_name,
          body: r.body ?? null,
          reviewed_at: r.reviewed_at,
          source_product: r.marketplace_product ?? null,
        });

        if (!periksa.ok) {
          galat.push({ index: i, message: periksa.badan.message });
          return;
        }

        baris.push({
          ...periksa.bersih,
          variant_slug: r.variant_slug,
          reviewed_precision: r.reviewed_precision ?? "day",
          produk_marketplace: r.marketplace_product ?? null,
        });
      });

      if (galat.length > 0) {
        set.status = 422;
        return { error: "invalid_reviews", message: `${galat.length} ulasan belum lengkap`, errors: galat };
      }

      const sql = koneksi();

      try {
        const hasil = await simpanUlasanMassal(sql, body.source, baris);

        if (!hasil.ok) {
          set.status = 422;
          return { error: "unknown_variant", message: `Ukuran tidak ditemukan: ${hasil.slug.join(", ")}` };
        }

        set.status = 201;
        return { inserted: hasil.masuk, duplicates: hasil.kembar };
      } finally {
        await tutup(sql);
      }
    },
    {
      body: t.Object({
        source: t.Union([t.Literal("shopee"), t.Literal("tokopedia")]),
        reviews: t.Array(
          t.Object({
            variant_slug: t.String({ minLength: 1, maxLength: 120 }),
            rating: t.Integer({ minimum: 1, maximum: 5 }),
            author_name: t.String({ minLength: 1, maxLength: 60 }),
            body: t.Optional(t.Union([t.String({ maxLength: 3000 }), t.Null()])),
            reviewed_at: t.String({ maxLength: 40 }),
            reviewed_precision: t.Optional(t.Union([t.Literal("day"), t.Literal("month")])),
            marketplace_product: t.Optional(t.Union([t.String({ maxLength: 200 }), t.Null()])),
          }),
          { minItems: 1, maxItems: 200 },
        ),
      }),
    },
  )
  .get(
    "/products/:slug/marketplace-names",
    async ({ params }) => {
      const sql = koneksi();

      try {
        return { data: await daftarNamaMarketplace(sql, params.slug) };
      } finally {
        await tutup(sql);
      }
    },
    { params: t.Object({ slug: t.String({ maxLength: 120 }) }) },
  )
  .post(
    "/variants/:slug/marketplace-names",
    async ({ params, body, set }) => {
      const sql = koneksi();

      try {
        const hasil = await tambahNamaMarketplace(sql, params.slug, body.source, body.name);

        if (!hasil.ok) {
          if (hasil.alasan === "not_found") {
            set.status = 404;
            return { error: "not_found", message: "Ukuran tidak ditemukan" };
          }
          if (hasil.alasan === "duplicate") {
            set.status = 409;
            return { error: "duplicate", message: "Nama ini sudah tercatat di ukuran ini" };
          }
          set.status = 422;
          return { error: "invalid_name", message: "Nama listing belum diisi" };
        }

        set.status = 201;
        return hasil.nama;
      } finally {
        await tutup(sql);
      }
    },
    {
      params: t.Object({ slug: t.String({ maxLength: 120 }) }),
      body: t.Object({
        source: t.Union([t.Literal("shopee"), t.Literal("tokopedia")]),
        name: t.String({ minLength: 1, maxLength: 200 }),
      }),
    },
  )
  .delete(
    "/marketplace-names/:id",
    async ({ params, set }) => {
      const sql = koneksi();

      try {
        if (!(await hapusNamaMarketplace(sql, params.id))) {
          set.status = 404;
          return { error: "not_found", message: "Nama tidak ditemukan" };
        }

        return { deleted: true };
      } finally {
        await tutup(sql);
      }
    },
    { params: t.Object({ id: t.Numeric({ minimum: 1 }) }) },
  )
  .get(
    "/products/:slug/reviews",
    async ({ params, query }) => {
      const sql = koneksi();

      try {
        return await halamanUlasan(sql, params.slug, {
          offset: query.offset ?? 0,
          limit: query.limit ?? ULASAN_PER_HALAMAN,
          admin: true,
          urut: query.urut,
          bintang: query.bintang,
          sumber: query.sumber,
          ukuran: query.ukuran,
        });
      } finally {
        await tutup(sql);
      }
    },
    {
      params: t.Object({ slug: t.String({ maxLength: 120 }) }),
      query: QUERY_ULASAN,
    },
  )
  .patch(
    "/reviews/:id",
    async ({ params, body, set }) => {
      const sql = koneksi();

      try {
        const ulasan = await ubahTampilUlasan(sql, params.id, body.is_hidden);

        if (!ulasan) {
          set.status = 404;
          return { error: "not_found", message: "Ulasan tidak ditemukan" };
        }

        return ulasan;
      } finally {
        await tutup(sql);
      }
    },
    {
      params: t.Object({ id: t.Numeric({ minimum: 1 }) }),
      body: t.Object({ is_hidden: t.Boolean() }),
    },
  );
