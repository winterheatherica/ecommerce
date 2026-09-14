import { env } from "cloudflare:workers";
import { Elysia, t } from "elysia";

import { buatKoneksi, tutup } from "../lib/db";
import { ambilWilayah, cariWilayah, simpanWilayah } from "../db/wilayah";
import { opsiUntuk } from "../lib/ongkir";
import { bacaKonfigOngkir, cariTujuan } from "../lib/rajaongkir";
import {
  UMUR_WILAYAH_DETIK,
  ambilCache,
  bacaKonfigRedis,
  kunciWilayah,
  simpanCache,
} from "../lib/redis";
import type { Wilayah } from "../db/wilayah";

const MIN_KATA = 3;

function wadah() {
  return env as unknown as Record<string, unknown>;
}

function koneksi() {
  return buatKoneksi(wadah());
}

export const shippingRoutes = new Elysia()
  .get(
    "/api/regions",
    async ({ query }) => {
      const kata = (query.q ?? "").trim();
      const batas = query.limit ?? 8;

      if (kata.length < MIN_KATA) return { data: [], sumber: "kosong" };

      const redis = bacaKonfigRedis(wadah());
      const kunci = kunciWilayah(kata, batas);

      const dariCache = await ambilCache<Wilayah[]>(redis, kunci);

      if (dariCache) return { data: dariCache, sumber: "cache" };

      const sql = koneksi();

      try {
        const tersimpan = await cariWilayah(sql, kata, batas);

        if (tersimpan.length > 0) {
          await simpanCache(redis, kunci, tersimpan, UMUR_WILAYAH_DETIK);
          return { data: tersimpan, sumber: "lokal" };
        }

        const konfig = bacaKonfigOngkir(wadah());

        if (!konfig) return { data: [], sumber: "lokal" };

        const hasil = await cariTujuan(konfig, kata, batas);

        if (!hasil.ok) {
          console.error("[rajaongkir] cari tujuan gagal", hasil.status, hasil.pesan);
          return { data: [], sumber: "gagal" };
        }

        const wilayah = hasil.data.map((t) => ({
          id: String(t.id),
          province: t.province_name,
          city: t.city_name,
          district: t.district_name,
          postal_code: t.zip_code,
          label: t.label,
        }));

        await simpanWilayah(sql, wilayah);
        await simpanCache(redis, kunci, wilayah, UMUR_WILAYAH_DETIK);

        return { data: wilayah, sumber: "rajaongkir" };
      } finally {
        await tutup(sql);
      }
    },
    {
      query: t.Object({
        q: t.Optional(t.String({ maxLength: 80 })),
        limit: t.Optional(t.Numeric({ minimum: 1, maximum: 30 })),
      }),
    },
  )
  .post(
    "/api/shipping/cost",
    async ({ body, set }) => {
      const sql = koneksi();

      try {
        const tujuan = await ambilWilayah(sql, body.dest_id);

        if (!tujuan) {
          set.status = 404;
          return {
            error: "region_not_found",
            message: "Kecamatan tujuan tidak dikenal",
          };
        }

        const hasil = await opsiUntuk(sql, wadah(), tujuan.id, body.weight_g);

        if (!hasil.ok) {
          set.status = 502;
          return { error: "shipping_unavailable", message: hasil.pesan };
        }

        return {
          dest_id: tujuan.id,
          weight_g: body.weight_g,
          options: hasil.opsi,
          sumber: hasil.sumber,
        };
      } finally {
        await tutup(sql);
      }
    },
    {
      body: t.Object({
        dest_id: t.String({ maxLength: 40 }),
        weight_g: t.Integer({ minimum: 1, maximum: 50000 }),
      }),
    },
  );
