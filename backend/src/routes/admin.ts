import { env } from "cloudflare:workers";
import { Elysia, t } from "elysia";

import { BADAN_ADMIN_DITOLAK, bypassAdmin } from "../lib/auth";
import { adminDariCookie } from "../db/admin";
import { buatKoneksi, tutup } from "../lib/db";
import { periksaPerubahan, periksaProdukBaru } from "../lib/products";
import { periksaPerubahanVarian, periksaVarianBaru } from "../lib/variants";
import {
  daftarProdukAdmin,
  perbaruiProduk,
  satuProdukAdmin,
  simpanProdukBaru,
} from "../db/produk";
import { perbaruiVarian, tambahVarian } from "../db/varian";
import { periksaUlasanImpor } from "../lib/ulasan";
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
import { segarkanLacak } from "../db/lacak";
import type { StatusPesanan } from "../lib/orders";

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
  .post("/orders/sweep", async () => {
    const sql = koneksi();

    try {
      const disapu = await sapuKedaluwarsa(sql);

      return {
        swept: disapu.length,
        order_nos: disapu,
      };
    } finally {
      await tutup(sql);
    }
  })
  .get(
    "/products",
    async ({ query }) => {
      const sql = koneksi();

      try {
        return await daftarProdukAdmin(sql, query.limit ?? 100, query.offset ?? 0);
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

        return produk;
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

        if (!hasil.ok) {
          set.status = 409;
          return {
            error: "slug_taken",
            message: `Slug "${periksa.bersih.slug}" sudah dipakai produk lain`,
            field: "slug",
          };
        }

        set.status = 201;
        return hasil.produk;
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
      }),
    },
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
        const produk = await perbaruiProduk(sql, params.slug, periksa.bersih);

        if (!produk) {
          set.status = 404;
          return { error: "not_found", message: "Produk tidak ditemukan" };
        }

        return produk;
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
  .get(
    "/products/:slug/reviews",
    async ({ params, query }) => {
      const sql = koneksi();

      try {
        return {
          data: await halamanUlasan(sql, params.slug, {
            offset: query.offset ?? 0,
            limit: query.limit ?? ULASAN_PER_HALAMAN,
            admin: true,
          }),
        };
      } finally {
        await tutup(sql);
      }
    },
    {
      params: t.Object({ slug: t.String({ maxLength: 120 }) }),
      query: t.Object({
        offset: t.Optional(t.Numeric({ minimum: 0, maximum: 100000 })),
        limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100 })),
      }),
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
