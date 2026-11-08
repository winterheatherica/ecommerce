import { afterAll, beforeEach, describe, expect, it } from "vitest";

import type { Sql } from "../lib/db";
import { bersihkan, koneksiTes } from "../test/db";
import { saranVarianUntuk } from "./impor-ulasan";
import {
  daftarNamaMarketplace,
  hapusNamaMarketplace,
  pelajariNamaMarketplace,
  tambahNamaMarketplace,
} from "./nama-marketplace";

const sql: Sql = koneksiTes();
const KUCING = "bye-bye-cat-50g";
const KUCING_BESAR = "bye-bye-cat-80g";
const LISTING = "Alat pengusir kucing Bye Bye Cat 50g untuk cegah kucing buang kotoran sembarangan";

beforeEach(async () => {
  await bersihkan(sql);
  await sql`delete from variant_marketplace_names`;
});

afterAll(async () => {
  await sql.end();
});

async function idVarian(slug: string): Promise<number> {
  const [v] = await sql<{ id: number }[]>`select id::int as id from product_variants where slug = ${slug}`;
  return v.id;
}

describe("tambah, daftar, dan hapus nama marketplace", () => {
  it("menyimpan nama listing per ukuran dan menampilkannya per produk", async () => {
    const hasil = await tambahNamaMarketplace(sql, KUCING, "shopee", `  ${LISTING}  `);

    expect(hasil).toMatchObject({ ok: true, nama: { variant_slug: KUCING, source: "shopee", name: LISTING } });
    expect(await daftarNamaMarketplace(sql, KUCING)).toEqual([
      { id: expect.any(Number), variant_slug: KUCING, source: "shopee", name: LISTING },
    ]);
  });

  it("menolak nama dobel di ukuran yang sama, nama kosong, dan ukuran yang tidak ada", async () => {
    await tambahNamaMarketplace(sql, KUCING, "shopee", LISTING);

    expect(await tambahNamaMarketplace(sql, KUCING, "shopee", LISTING.toUpperCase())).toEqual({
      ok: false,
      alasan: "duplicate",
    });
    expect(await tambahNamaMarketplace(sql, KUCING, "tokopedia", LISTING)).toMatchObject({ ok: true });
    expect(await tambahNamaMarketplace(sql, KUCING, "shopee", " - ")).toEqual({ ok: false, alasan: "invalid_name" });
    expect(await tambahNamaMarketplace(sql, "tidak-ada", "shopee", LISTING)).toEqual({ ok: false, alasan: "not_found" });
  });

  it("menghapus nama sekali saja", async () => {
    const hasil = await tambahNamaMarketplace(sql, KUCING, "shopee", LISTING);
    const id = hasil.ok ? hasil.nama.id : 0;

    expect(await hapusNamaMarketplace(sql, id)).toBe(true);
    expect(await hapusNamaMarketplace(sql, id)).toBe(false);
    expect(await daftarNamaMarketplace(sql, KUCING)).toEqual([]);
  });
});

describe("pelajariNamaMarketplace", () => {
  it("menambah nama baru, tapi melewati nama terpotong yang sudah tercakup nama lengkapnya", async () => {
    await tambahNamaMarketplace(sql, KUCING, "shopee", LISTING);
    const id = await idVarian(KUCING);

    const masuk = await pelajariNamaMarketplace(sql, "shopee", [
      { variant_id: id, nama: "Alat pengusir kucing Bye Bye Cat 50g untuk ceg..." },
      { variant_id: id, nama: "Bye Bye Cat Gel 50 gram original" },
      { variant_id: id, nama: "Bye Bye Cat Gel 50 gram original" },
    ]);

    expect(masuk).toBe(1);
    expect((await daftarNamaMarketplace(sql, KUCING)).map((n) => n.name)).toEqual([
      LISTING,
      "Bye Bye Cat Gel 50 gram original",
    ]);
  });
});

describe("pencocokan memakai nama marketplace lebih dulu", () => {
  it("nama listing yang tercatat langsung memilih ukurannya, walaupun nama di screenshot terpotong", async () => {
    await tambahNamaMarketplace(sql, KUCING_BESAR, "tokopedia", "Gel Pengusir dan Training Kucing 100gr");

    const [saran] = await saranVarianUntuk(sql, "tokopedia", ["Gel Pengusir dan Training Kuc..."]);

    expect(saran.tebakan).toEqual({ slug: KUCING_BESAR, dari: "nama" });
    expect(saran.kandidat[0]).toBe(KUCING_BESAR);
  });

  it("nama Tokopedia tidak dipakai untuk screenshot Shopee", async () => {
    await tambahNamaMarketplace(sql, KUCING_BESAR, "tokopedia", "Gel Pengusir dan Training Kucing 100gr");

    const [saran] = await saranVarianUntuk(sql, "shopee", ["Gel Pengusir dan Training Kucing 100gr"]);

    expect(saran.tebakan?.dari).not.toBe("nama");
  });

  it("nama yang tercatat di dua ukuran tidak dipilih otomatis, keduanya jadi kandidat teratas", async () => {
    await tambahNamaMarketplace(sql, KUCING, "shopee", "Bye Bye Cat Gel pilihan ukuran");
    await tambahNamaMarketplace(sql, KUCING_BESAR, "shopee", "Bye Bye Cat Gel pilihan ukuran");

    const [saran] = await saranVarianUntuk(sql, "shopee", ["Bye Bye Cat Gel pilihan ukuran"]);

    expect(saran.tebakan).toBeNull();
    expect(saran.kandidat.slice(0, 2).sort()).toEqual([KUCING, KUCING_BESAR]);
  });
});
