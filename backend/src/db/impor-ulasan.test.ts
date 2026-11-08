import { afterAll, beforeEach, describe, expect, it } from "vitest";

import type { Sql } from "../lib/db";
import { periksaUlasanImpor, type SumberImpor } from "../lib/ulasan";
import { bersihkan, koneksiTes } from "../test/db";
import {
  cariUlasanKembar,
  saranVarianUntuk,
  simpanUlasanMassal,
  tebakVarianUntuk,
  type BarisImpor,
} from "./impor-ulasan";
import { satuProduk } from "./produk";

const sql: Sql = koneksiTes();
const KUCING = "bye-bye-cat-50g";
const KUCING_BESAR = "bye-bye-cat-80g";
const SEKARANG = new Date("2026-11-08T00:00:00.000Z");

beforeEach(async () => {
  await bersihkan(sql);
  await sql`delete from variant_marketplace_names`;
});

afterAll(async () => {
  await sql.end();
});

type Ubah = {
  source: SumberImpor;
  nama: string;
  rating: number;
  teks: string | null;
  tanggal: string;
  varian: string;
  produk: string | null;
};

function baris(ubah: Partial<Ubah> = {}): BarisImpor {
  const source = ubah.source ?? "shopee";
  const periksa = periksaUlasanImpor(
    {
      source,
      rating: ubah.rating ?? 4,
      author_name: ubah.nama ?? "bp.siburian17",
      body: ubah.teks ?? null,
      reviewed_at: ubah.tanggal ?? "2026-11-05T08:34:00.000Z",
      source_product: ubah.produk ?? null,
    },
    SEKARANG,
  );
  if (!periksa.ok) throw new Error(`data uji tidak lolos: ${periksa.badan.message}`);

  return {
    ...periksa.bersih,
    variant_slug: ubah.varian ?? KUCING,
    reviewed_precision: "day",
    produk_marketplace: ubah.produk ?? null,
  };
}

describe("simpanUlasanMassal", () => {
  it("menyimpan banyak ulasan sekaligus, termasuk yang cuma bintang, dengan nama asli dan samaran", async () => {
    const hasil = await simpanUlasanMassal(sql, "shopee", [
      baris(),
      baris({ nama: "Fina Lubis", teks: "Packing rapi tp ternyata kecil ya sizenya, semoga ampuh", varian: KUCING_BESAR }),
    ]);

    expect(hasil).toEqual({ ok: true, masuk: 2, kembar: 0 });

    const simpan = await sql<{ author_name: string; author_name_raw: string; body: string | null }[]>`
      select author_name, author_name_raw, body from reviews order by author_name
    `;
    expect([...simpan]).toEqual([
      { author_name: "F*****s", author_name_raw: "Fina Lubis", body: "Packing rapi tp ternyata kecil ya sizenya, semoga ampuh" },
      { author_name: "b*****7", author_name_raw: "bp.siburian17", body: null },
    ]);

    const produk = await satuProduk(sql, KUCING);
    expect(produk?.reviews[0]).toMatchObject({ author_name: "b*****7", body: null, rating: 4 });
    expect(JSON.stringify(produk)).not.toContain("bp.siburian17");
  });

  it("ulasan yang sudah ada atau dobel dalam satu kiriman tidak disimpan ulang", async () => {
    await simpanUlasanMassal(sql, "shopee", [baris()]);

    const ulang = await simpanUlasanMassal(sql, "shopee", [baris(), baris({ nama: "rikiyantofajar", rating: 5 }), baris({ nama: "rikiyantofajar", rating: 5 })]);

    expect(ulang).toEqual({ ok: true, masuk: 1, kembar: 2 });
    const [{ n }] = await sql<{ n: number }[]>`select count(*)::int as n from reviews`;
    expect(n).toBe(2);
  });

  it("ukuran yang tidak dikenal menggagalkan seluruh kiriman", async () => {
    const hasil = await simpanUlasanMassal(sql, "shopee", [baris(), baris({ varian: "tidak-ada" })]);

    expect(hasil).toEqual({ ok: false, alasan: "unknown_variant", slug: ["tidak-ada"] });
    const [{ n }] = await sql<{ n: number }[]>`select count(*)::int as n from reviews`;
    expect(n).toBe(0);
  });

  it("nama produk marketplace diingat, lalu dipakai untuk menebak ukuran di impor berikutnya", async () => {
    await simpanUlasanMassal(sql, "shopee", [
      baris({ produk: "Alat pengusir kucing Bye Bye Cat 50g untuk cegah kucing berak", varian: KUCING_BESAR }),
    ]);

    const [shopee] = await tebakVarianUntuk(sql, "shopee", ["Alat pengusir kucing Bye Bye Cat 50g untuk ceg"]);
    expect(shopee).toEqual({ slug: KUCING_BESAR, dari: "nama" });

    const [tokopedia] = await tebakVarianUntuk(sql, "tokopedia", ["Alat pengusir kucing Bye Bye Cat 50g untuk ceg"]);
    expect(tokopedia?.dari).not.toBe("nama");

    expect(await tebakVarianUntuk(sql, "shopee", [null])).toEqual([null]);
  });

  it("saran memuat tebakan dan paling banyak tiga kandidat, ukuran yang diingat di urutan pertama", async () => {
    await simpanUlasanMassal(sql, "shopee", [
      baris({ produk: "Alat pengusir kucing Bye Bye Cat 50g untuk cegah kucing berak", varian: KUCING_BESAR }),
    ]);

    const [ingat, kosong] = await saranVarianUntuk(sql, "shopee", ["Alat pengusir kucing Bye Bye Cat 50g untuk ceg", null]);

    expect(ingat.tebakan).toEqual({ slug: KUCING_BESAR, dari: "nama" });
    expect(ingat.kandidat[0]).toBe(KUCING_BESAR);
    expect(ingat.kandidat.length).toBeLessThanOrEqual(3);
    expect(kosong).toEqual({ tebakan: null, kandidat: [] });
  });
});

describe("cariUlasanKembar", () => {
  it("ulasan lama yang tanggalnya cuma perkiraan dikenali dari nama, bintang, dan isi", async () => {
    await sql`
      insert into reviews (variant_id, source, external_id, rating, author_name, body, reviewed_at, reviewed_precision)
      select id, 'tokopedia', 'tp-1', 4, 'V***t', 'Mantap sekali', '2025-01-01', 'over_year'
      from product_variants where slug = ${KUCING}
    `;

    const ciri = { nama_asli: "V***t", nama_samaran: "V***t", rating: 4, reviewed_at: "2026-11-01T05:00:00.000Z" };

    expect(await cariUlasanKembar(sql, "tokopedia", [{ ...ciri, body: "Mantap sekali" }, { ...ciri, body: null }])).toEqual([
      true,
      false,
    ]);
    expect(await cariUlasanKembar(sql, "shopee", [{ ...ciri, body: "Mantap sekali" }])).toEqual([false]);
    expect(await cariUlasanKembar(sql, "tokopedia", [])).toEqual([]);
  });
});
