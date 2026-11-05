import { afterAll, beforeEach, describe, expect, it } from "vitest";

import type { Sql } from "../lib/db";
import type { OpsiOngkir } from "../lib/shipping";
import { bersihkan, koneksiTes, pecahUkuran } from "../test/db";
import { buatPesanan, type CariOngkir } from "./pesanan";
import { daftarProduk, hapusProdukPermanen, perbaruiProduk, satuProduk, satuProdukAdmin } from "./produk";

const sql: Sql = koneksiTes();
const KUCING = "bye-bye-cat-50g";
const LANGKAH = "Sebarkan gel di sudut\nUlangi tiap 3 hari";
const ONGKIR: OpsiOngkir[] = [{ courier: "JNE", service: "CTC", cost: 9000, etd: "1-2" }];
const cariOngkir: CariOngkir = async () => ONGKIR;

beforeEach(async () => {
  await bersihkan(sql);
});

afterAll(async () => {
  await sql.end();
});

describe("cara pakai produk", () => {
  it("terbaca di halaman produk dan di admin", async () => {
    await perbaruiProduk(sql, KUCING, { usage_instructions: LANGKAH });

    expect((await satuProduk(sql, KUCING))?.usage_instructions).toBe(LANGKAH);
    expect((await satuProdukAdmin(sql, KUCING))?.usage_instructions).toBe(LANGKAH);
  });

  it("tidak ikut di daftar produk, supaya respons katalog tetap ringan", async () => {
    await perbaruiProduk(sql, KUCING, { usage_instructions: LANGKAH });
    const { data } = await daftarProduk(sql, { limit: 100, offset: 0 });

    expect(data.length).toBeGreaterThan(0);
    expect(data.some((p) => "usage_instructions" in p)).toBe(false);
  });

  it("bisa dihapus lagi dengan null", async () => {
    await perbaruiProduk(sql, KUCING, { usage_instructions: LANGKAH });
    await perbaruiProduk(sql, KUCING, { usage_instructions: null });

    expect((await satuProduk(sql, KUCING))?.usage_instructions).toBeNull();
  });

  it("database menolak teks kosong, jadi kosong selalu berarti null", async () => {
    await expect(
      sql`update products set usage_instructions = '' where slug = ${KUCING}`,
    ).rejects.toMatchObject({ code: "23514" });
  });
});

async function lengkapiProduk(slug: string): Promise<void> {
  await pecahUkuran(sql, slug, [
    { slug: `${slug}-kecil`, label: "Kecil", price: 20000, weight_g: 50, stock: 5 },
    { slug: `${slug}-besar`, label: "Besar", price: 35000, weight_g: 100, stock: 5 },
  ]);
  await sql`
    insert into product_images (product_id, cloudinary_id)
    select id, 'menik-store/produk/uji-hapus-1' from products where slug = ${slug}
  `;
  await sql`
    insert into product_images (product_id, cloudinary_id, variant_id)
    select v.product_id, 'menik-store/produk/uji-hapus-2', v.id from product_variants v where v.slug = ${`${slug}-besar`}
  `;
  await sql`
    insert into reviews (variant_id, source, rating, author_name, body, reviewed_at)
    select v.id, 'shopee', 5, 'Pembeli Shopee', 'Mantap', now()
    from product_variants v where v.slug in (${`${slug}-kecil`}, ${`${slug}-besar`})
  `;
}

describe("hapus permanen produk", () => {
  it("menolak produk yang masih tampil di toko", async () => {
    expect(await hapusProdukPermanen(sql, KUCING)).toEqual({ ok: false, alasan: "active" });
    expect(await satuProdukAdmin(sql, KUCING)).toBeDefined();
  });

  it("admin melihat jumlah pesanan dan ulasan sebelum menghapus", async () => {
    await lengkapiProduk(KUCING);

    expect(await satuProdukAdmin(sql, KUCING)).toMatchObject({ order_count: 0, review_count: 2 });
  });

  it("menghapus produk nonaktif beserta semua ukuran, foto, dan ulasannya", async () => {
    await lengkapiProduk(KUCING);
    await perbaruiProduk(sql, KUCING, { is_active: false });
    const [sebelum] = await sql<{ n: number }[]>`select count(*)::int as n from products`;

    expect(await hapusProdukPermanen(sql, KUCING)).toEqual({ ok: true, ukuran: 2, foto: 2, ulasan: 2 });
    expect(await satuProdukAdmin(sql, KUCING)).toBeUndefined();

    const [sisa] = await sql<{ produk: number; ukuran: number; foto: number; ulasan: number }[]>`
      select
        (select count(*)::int from products) as produk,
        (select count(*)::int from product_variants where slug like ${`${KUCING}-%`}) as ukuran,
        (select count(*)::int from product_images where cloudinary_id like 'menik-store/produk/uji-hapus-%') as foto,
        (select count(*)::int from reviews) as ulasan
    `;
    expect(sisa).toEqual({ produk: sebelum.n - 1, ukuran: 0, foto: 0, ulasan: 0 });
  });

  it("menolak produk nonaktif yang pernah dipesan supaya riwayat pesanan tetap utuh", async () => {
    const pesanan = await buatPesanan(
      sql,
      {
        customer_name: "Ani",
        phone: "081200000001",
        email: "ani@contoh.test",
        address: "Jl. Uji No. 1",
        dest_id: "50001",
        courier: "JNE",
        service: "CTC",
        items: [{ slug: KUCING, qty: 1 }],
      },
      1,
      cariOngkir,
    );
    expect(pesanan.ok).toBe(true);
    await perbaruiProduk(sql, KUCING, { is_active: false });

    expect(await hapusProdukPermanen(sql, KUCING)).toEqual({ ok: false, alasan: "ordered", pesanan: 1 });
    expect(await satuProdukAdmin(sql, KUCING)).toMatchObject({ is_active: false, order_count: 1 });
  });

  it("melaporkan produk yang tidak ada", async () => {
    expect(await hapusProdukPermanen(sql, "produk-tidak-ada")).toEqual({ ok: false, alasan: "not_found" });
  });
});
