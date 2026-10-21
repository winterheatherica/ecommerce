import { afterAll, beforeEach, describe, expect, it } from "vitest";

import type { Sql } from "../lib/db";
import { periksaUlasanImpor } from "../lib/ulasan";
import { bacaMigrasi, bersihkan, koneksiTes, pecahUkuran } from "../test/db";
import type { OpsiOngkir } from "../lib/shipping";
import { ambilPesanan, buatPesanan, tandaiDikirim, tandaiTerbayar } from "./pesanan";
import { satuProduk, satuProdukAdmin } from "./produk";
import {
  ULASAN_PER_HALAMAN,
  halamanUlasan,
  pesananBisaDiulas,
  tambahUlasanImpor,
  tulisUlasanPembeli,
  ubahTampilUlasan,
  ubahUlasanPembeli,
  ulasanPesanan,
} from "./ulasan";

const sql: Sql = koneksiTes();
const KUCING = "bye-bye-cat-50g";

beforeEach(async () => {
  await bersihkan(sql);
});

afterAll(async () => {
  await sql.end();
});

const ukuran = (slug: string, label: string) => ({
  slug,
  label,
  price: 35000,
  weight_g: 50,
  stock: 5,
});

async function ulasan(slug: string, nama: string, tanggal: string, teks = "Mantap") {
  const periksa = periksaUlasanImpor({
    rating: 5,
    author_name: nama,
    body: teks,
    reviewed_at: tanggal,
  });
  if (!periksa.ok) throw new Error("data uji tidak lolos");
  const hasil = await tambahUlasanImpor(sql, slug, periksa.bersih);
  if (!hasil) throw new Error("varian uji tidak ada");
  return hasil;
}

async function ulasanTokopedia(
  slug: string,
  nomor: number,
  tanggal: string,
  presisi: "day" | "month" | "over_year",
) {
  await sql`
    insert into reviews
      (variant_id, source, external_id, rating, author_name, body, reviewed_at, reviewed_precision, source_product, source_url)
    select id, 'tokopedia', ${`tp-${nomor}`}, 4, 'V***t', ${`ulasan ${nomor}`}, ${tanggal}, ${presisi},
      'Gel Pengusir dan training Kucing 100gr', 'https://www.tokopedia.com/menikstore/gel-kucing'
    from product_variants where slug = ${slug}
  `;
}

describe("ulasan di halaman produk", () => {
  it("menampilkan ulasan semua ukuran aktif, terbaru dulu, lengkap dengan label ukurannya", async () => {
    await pecahUkuran(sql, KUCING, [
      ukuran("uji-50g", "50 g"),
      ukuran("uji-80g", "80 g"),
      ukuran("uji-mati", "220 ml"),
    ]);
    await sql`update product_variants set is_active = false where slug = 'uji-mati'`;

    await ulasan("uji-50g", "pertama", "2026-09-01");
    await ulasan("uji-80g", "kedua", "2026-10-01");
    await ulasan("uji-mati", "ketiga", "2026-10-05");

    const produk = await satuProduk(sql, KUCING);

    expect(produk?.reviews.map((r) => [r.author_name, r.variant_label, r.source])).toEqual([
      ["k*****a", "80 g", "shopee"],
      ["p*****a", "50 g", "shopee"],
    ]);
  });

  it("ulasan yang disembunyikan admin hilang dari toko tapi tetap terlihat di admin", async () => {
    const a = await ulasan(KUCING, "tampil", "2026-09-01");
    const b = await ulasan(KUCING, "sembunyi", "2026-09-02");

    const disembunyikan = await ubahTampilUlasan(sql, b.id, true);
    expect(disembunyikan?.is_hidden).toBe(true);

    const toko = await satuProduk(sql, KUCING);
    expect(toko?.reviews.map((r) => r.id)).toEqual([a.id]);

    const admin = await satuProdukAdmin(sql, KUCING);
    expect(admin?.reviews?.map((r) => [r.id, r.is_hidden])).toEqual([
      [b.id, true],
      [a.id, false],
    ]);
  });

  it("varian yang tidak ada ditolak, dan ulasan Shopee atau Tokopedia tanpa teks ditolak database", async () => {
    const periksa = periksaUlasanImpor({
      rating: 4,
      author_name: "x",
      body: "ok",
      reviewed_at: "2026-09-01",
    });
    expect(periksa.ok && (await tambahUlasanImpor(sql, "tidak-ada", periksa.bersih))).toBeUndefined();

    for (const sumber of ["shopee", "tokopedia"]) {
      const kosong = await sql`
        insert into reviews (variant_id, source, rating, author_name, reviewed_at)
        select id, ${sumber}, 5, 'a*****b', now() from product_variants where slug = ${KUCING}
      `.then(
        () => true,
        () => false,
      );
      expect(kosong, sumber).toBe(false);
    }
  });

  it("database menolak link asal yang bukan halaman Tokopedia", async () => {
    const salah = await sql`
      insert into reviews (variant_id, source, rating, author_name, body, reviewed_at, source_url)
      select id, 'tokopedia', 5, 'a*****b', 'ok', now(), 'https://shopee.co.id/x' from product_variants where slug = ${KUCING}
    `.then(
      () => true,
      () => false,
    );
    expect(salah).toBe(false);
  });

  it("urutan terbaru: ulasan tanpa tanggal pasti (lebih dari setahun) selalu paling akhir", async () => {
    await ulasanTokopedia(KUCING, 1, "2026-10-20", "over_year");
    await ulasan(KUCING, "lama", "2024-01-01");
    await ulasanTokopedia(KUCING, 2, "2026-05-01", "month");

    const { data } = await halamanUlasan(sql, KUCING, { offset: 0, limit: 10, admin: false, urut: "terbaru" });

    expect(data.map((r) => [r.source, r.reviewed_precision])).toEqual([
      ["tokopedia", "month"],
      ["shopee", "day"],
      ["tokopedia", "over_year"],
    ]);
    expect(data[0]).toMatchObject({
      source_product: "Gel Pengusir dan training Kucing 100gr",
      source_url: "https://www.tokopedia.com/menikstore/gel-kucing",
    });
  });

  it("bawaan halaman produk: ulasan paling lengkap dulu, apa pun bintang dan tanggalnya", async () => {
    await ulasan(KUCING, "pendek", "2026-10-01", "Ok");
    await ulasan(KUCING, "panjang", "2025-01-01", "Kucingnya sempat balik sekali, setelah gel kedua dipasang tidak datang lagi.");
    await ulasan(KUCING, "sedang", "2026-09-01", "Wanginya enak dan awet");

    const produk = await satuProduk(sql, KUCING);

    expect(produk?.reviews.map((r) => r.author_name)).toEqual(["p*****g", "s*****g", "p*****k"]);
  });

  it("halaman produk memuat 30 ulasan pertama plus ringkasan per sumber, sisanya lewat halaman berikutnya", async () => {
    for (let i = 0; i < ULASAN_PER_HALAMAN + 5; i += 1) {
      await ulasanTokopedia(KUCING, i, `2025-01-01T00:00:${String(i).padStart(2, "0")}Z`, "over_year");
    }
    await ulasan(KUCING, "baru", "2026-09-01");

    const produk = await satuProduk(sql, KUCING);
    expect(produk?.reviews).toHaveLength(ULASAN_PER_HALAMAN);
    expect(produk?.reviews_summary).toEqual({
      total: ULASAN_PER_HALAMAN + 6,
      shopee: 1,
      tokopedia: ULASAN_PER_HALAMAN + 5,
      web: 0,
      bintang: { "1": 0, "2": 0, "3": 0, "4": ULASAN_PER_HALAMAN + 5, "5": 1 },
    });

    const lanjut = await halamanUlasan(sql, KUCING, {
      offset: ULASAN_PER_HALAMAN,
      limit: ULASAN_PER_HALAMAN,
      admin: false,
    });
    expect(lanjut.data).toHaveLength(6);
    expect(lanjut.total).toBe(ULASAN_PER_HALAMAN + 6);

    const semuaId = [...(produk?.reviews ?? []).map((r) => r.id), ...lanjut.data.map((r) => r.id)];
    expect(new Set(semuaId).size).toBe(ULASAN_PER_HALAMAN + 6);
  });

  it("halaman berikutnya untuk publik menyaring ulasan tersembunyi dan produk nonaktif, admin melihat semuanya", async () => {
    const a = await ulasan(KUCING, "tampil", "2026-09-01");
    const b = await ulasan(KUCING, "sembunyi", "2026-09-02");
    await ubahTampilUlasan(sql, b.id, true);

    const publik = await halamanUlasan(sql, KUCING, { offset: 0, limit: 10, admin: false });
    expect(publik.data.map((r) => r.id)).toEqual([a.id]);

    await sql`update products set is_active = false where slug = (
      select p.slug from products p join product_variants v on v.product_id = p.id where v.slug = ${KUCING}
    )`;
    const nonaktif = await halamanUlasan(sql, KUCING, { offset: 0, limit: 10, admin: false });
    expect(nonaktif).toEqual({ data: [], total: 0 });

    const admin = await halamanUlasan(sql, KUCING, { offset: 0, limit: 10, admin: true });
    expect(admin.data.map((r) => [r.id, r.is_hidden])).toEqual([
      [b.id, true],
      [a.id, false],
    ]);
  });
});

describe("urutan dan saringan ulasan", () => {
  async function isi() {
    await pecahUkuran(sql, KUCING, [ukuran("uji-50g", "50 g"), ukuran("uji-80g", "80 g")]);
    const bintang = async (slug: string, nomor: number, nilai: number, tanggal: string, presisi: "day" | "over_year", sumber = "tokopedia") => {
      await sql`
        insert into reviews (variant_id, source, external_id, rating, author_name, body, reviewed_at, reviewed_precision)
        select id, ${sumber}, ${`x-${nomor}`}, ${nilai}, ${`n-${nomor}`}, ${"teks ".repeat(nomor)}, ${tanggal}, ${presisi}
        from product_variants where slug = ${slug}
      `;
    };

    await bintang("uji-50g", 1, 5, "2026-09-01", "day", "shopee");
    await bintang("uji-50g", 2, 1, "2026-08-01", "day");
    await bintang("uji-80g", 3, 5, "2025-01-01T00:00:02Z", "over_year");
    await bintang("uji-80g", 4, 3, "2025-01-01T00:00:01Z", "over_year");
  }

  const nama = (h: { data: { author_name: string }[] }) => h.data.map((r) => r.author_name);
  const minta = (s: Parameters<typeof halamanUlasan>[2]) => halamanUlasan(sql, KUCING, s);
  const dasar = { offset: 0, limit: 10, admin: false };

  it("tiap urutan menghasilkan susunan yang benar", async () => {
    await isi();

    expect(nama(await minta({ ...dasar, urut: "lengkap" }))).toEqual(["n-4", "n-3", "n-2", "n-1"]);
    expect(nama(await minta({ ...dasar, urut: "terbaru" }))).toEqual(["n-1", "n-2", "n-3", "n-4"]);
    expect(nama(await minta({ ...dasar, urut: "terlama" }))).toEqual(["n-4", "n-3", "n-2", "n-1"]);
    expect(nama(await minta({ ...dasar, urut: "bintang_tinggi" }))).toEqual(["n-1", "n-3", "n-4", "n-2"]);
    expect(nama(await minta({ ...dasar, urut: "bintang_rendah" }))).toEqual(["n-2", "n-4", "n-1", "n-3"]);
  });

  it("saringan bintang, sumber, dan ukuran bisa digabung dengan urutan, dan totalnya ikut tersaring", async () => {
    await isi();

    const limaTerlama = await minta({ ...dasar, bintang: 5, urut: "terlama" });
    expect(nama(limaTerlama)).toEqual(["n-3", "n-1"]);
    expect(limaTerlama.total).toBe(2);

    expect(nama(await minta({ ...dasar, sumber: "shopee" }))).toEqual(["n-1"]);
    expect(nama(await minta({ ...dasar, ukuran: "uji-80g", urut: "terbaru" }))).toEqual(["n-3", "n-4"]);
    expect(await minta({ ...dasar, bintang: 2 })).toEqual({ data: [], total: 0 });
  });
});

describe("ulasan pembeli website", () => {
  const ONGKIR_UJI: OpsiOngkir[] = [{ courier: "JNE", service: "REG", cost: 9000, etd: "1-2" }];

  async function pengguna(nama: string): Promise<{ id: number; name: string }> {
    const [u] = await sql<{ id: number; name: string }[]>`
      insert into users (google_sub, email, name)
      values (${`sub-${nama}`}, ${`${nama}@contoh.test`}, ${nama})
      returning id::int as id, name
    `;
    return u;
  }

  async function pesananMilik(pemilik: { id: number }, status: "PAID" | "SHIPPED" | "SAMPAI" | "DELIVERED") {
    const hasil = await buatPesanan(
      sql,
      {
        customer_name: "Rafii Anindito",
        phone: `0821114${String(Math.floor(Math.random() * 1e5)).padStart(5, "0")}`,
        email: `pemesan${Math.floor(Math.random() * 1e9)}@contoh.test`,
        address: "Jl. Buni No. 24",
        dest_id: "50001",
        courier: "JNE",
        service: "REG",
        items: [{ slug: KUCING, qty: 1 }],
      },
      1,
      async () => ONGKIR_UJI,
      pemilik.id,
    );
    if (!hasil.ok) throw new Error(`gagal membuat pesanan: ${hasil.badan.error}`);

    const nomor = hasil.pesanan.order_no;
    await tandaiTerbayar(sql, nomor, "BNI_VA");
    if (status !== "PAID") await tandaiDikirim(sql, nomor, "300380022869426");
    if (status === "SAMPAI" || status === "DELIVERED") {
      await sql`update orders set delivered_at = now() - interval '1 hour' where order_no = ${nomor}`;
    }
    if (status === "DELIVERED") await sql`update orders set status = 'DELIVERED' where order_no = ${nomor}`;

    return (await ambilPesanan(sql, nomor))!;
  }

  const isi = { rating: 5, body: "Kucing tetangga tidak mampir lagi" };

  it("terbuka begitu kurir mencatat paket diterima, sebelum status Selesai", async () => {
    const saya = await pengguna("rafii");
    const p = await pesananMilik(saya, "SAMPAI");

    expect(pesananBisaDiulas(p)).toBe(true);
    const hasil = await tulisUlasanPembeli(sql, { pesanan: p, pengguna: saya, variantSlug: KUCING, isi });

    expect(hasil.ok && hasil.ulasan).toMatchObject({ variant_slug: KUCING, rating: 5, body: isi.body });
    expect(await ulasanPesanan(sql, p.id)).toHaveLength(1);

    const produk = await satuProduk(sql, KUCING);
    expect(produk?.reviews[0]).toMatchObject({ source: "web", author_name: "r*****i", body: isi.body });
  });

  it("ditolak kalau paket belum sampai, bukan pemiliknya, barangnya tidak ada, atau sudah diulas", async () => {
    const saya = await pengguna("rafii");
    const orangLain = await pengguna("budi");

    const belum = await pesananMilik(saya, "SHIPPED");
    expect(await tulisUlasanPembeli(sql, { pesanan: belum, pengguna: saya, variantSlug: KUCING, isi })).toEqual({
      ok: false,
      alasan: "not_eligible",
    });

    const selesai = await pesananMilik(saya, "DELIVERED");
    expect(await tulisUlasanPembeli(sql, { pesanan: selesai, pengguna: orangLain, variantSlug: KUCING, isi })).toEqual({
      ok: false,
      alasan: "not_eligible",
    });
    expect(
      await tulisUlasanPembeli(sql, { pesanan: selesai, pengguna: saya, variantSlug: "bukan-barangnya", isi }),
    ).toEqual({ ok: false, alasan: "not_in_order" });

    expect((await tulisUlasanPembeli(sql, { pesanan: selesai, pengguna: saya, variantSlug: KUCING, isi })).ok).toBe(true);
    expect(await tulisUlasanPembeli(sql, { pesanan: selesai, pengguna: saya, variantSlug: KUCING, isi })).toEqual({
      ok: false,
      alasan: "already_reviewed",
    });
  });

  it("bisa diubah dalam 3 jam, setelah itu terkunci", async () => {
    const saya = await pengguna("rafii");
    const p = await pesananMilik(saya, "DELIVERED");
    await tulisUlasanPembeli(sql, { pesanan: p, pengguna: saya, variantSlug: KUCING, isi });

    const ubah = await ubahUlasanPembeli(sql, {
      orderId: p.id,
      userId: saya.id,
      variantSlug: KUCING,
      isi: { rating: 4, body: "Ternyata harus dipasang dua" },
    });
    expect(ubah.ok && [ubah.ulasan.rating, ubah.ulasan.body, ubah.ulasan.updated_at !== null]).toEqual([
      4,
      "Ternyata harus dipasang dua",
      true,
    ]);

    await sql`update reviews set created_at = now() - interval '3 hours 1 minute' where order_id = ${p.id}`;
    expect(
      await ubahUlasanPembeli(sql, { orderId: p.id, userId: saya.id, variantSlug: KUCING, isi }),
    ).toEqual({ ok: false, alasan: "edit_expired" });

    const orangLain = await pengguna("budi");
    expect(
      await ubahUlasanPembeli(sql, { orderId: p.id, userId: orangLain.id, variantSlug: KUCING, isi }),
    ).toEqual({ ok: false, alasan: "not_found" });
  });

  it("database menolak ulasan website yang tidak terhubung ke pesanan", async () => {
    const lolos = await sql`
      insert into reviews (variant_id, source, rating, author_name, reviewed_at)
      select id, 'web', 5, 'a*****b', now() from product_variants where slug = ${KUCING}
    `.then(
      () => true,
      () => false,
    );
    expect(lolos).toBe(false);
  });
});

describe("produk baru dari Tokopedia (migrasi 0036)", () => {
  it("dibuat nonaktif tanpa stok, variannya siap, harga ikut varian termurah, dan aman dijalankan ulang", async () => {
    const migrasi = bacaMigrasi("0036_produk_dari_tokopedia.sql");
    await sql.unsafe(migrasi).simple();
    await sql.unsafe(migrasi).simple();

    const produk = await sql<{ slug: string; is_active: boolean; price: number; stock: number; varian: number }[]>`
      select p.slug, p.is_active, p.price, p.stock, count(v.*)::int as varian
      from products p join product_variants v on v.product_id = p.id
      where p.slug in ('bye-bye-nyamuk-gel', 'bye-bye-nyamuk-spray', 'bye-bye-rayap-spray', 'ertwo-essential-oil', 'ertwo-room-spray-relaxing')
      group by p.id order by p.slug
    `;

    expect(produk.map((p) => [p.slug, p.is_active, p.price, p.stock, p.varian])).toEqual([
      ["bye-bye-nyamuk-gel", false, 29000, 0, 1],
      ["bye-bye-nyamuk-spray", false, 39000, 0, 2],
      ["bye-bye-rayap-spray", false, 39000, 0, 2],
      ["ertwo-essential-oil", false, 8000, 0, 8],
      ["ertwo-room-spray-relaxing", false, 20000, 0, 1],
    ]);
    expect(await satuProduk(sql, "bye-bye-nyamuk-spray")).toBeUndefined();
  });
});

describe("impor ulasan Shopee 19 Oktober", () => {
  it("masuk lewat slug varian dan tidak dobel kalau dijalankan dua kali", async () => {
    const impor = bacaMigrasi("0033_isi_ulasan_shopee.sql");
    await sql.unsafe(impor).simple();
    await sql.unsafe(impor).simple();

    const baris = await sql<{ n: number; unik: number; berteks: number }[]>`
      select count(*)::int as n,
        count(distinct external_id)::int as unik,
        count(*) filter (where body is not null or follow_up is not null)::int as berteks
      from reviews
    `;
    expect(baris[0].n).toBeGreaterThan(0);
    expect(baris[0].n).toBe(baris[0].unik);
    expect(baris[0].berteks).toBe(baris[0].n);

    const produk = await satuProduk(sql, KUCING);
    expect(produk?.reviews.length).toBeGreaterThan(0);
    expect(produk?.reviews.every((r) => r.author_name.includes("*"))).toBe(true);
  });
});
