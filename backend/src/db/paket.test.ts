import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import type { Sql } from "../lib/db";
import type { OpsiOngkir } from "../lib/shipping";
import { bersihkan, koneksiTes, pecahUkuran } from "../test/db";
import { buatPesanan, type CariOngkir } from "./pesanan";
import { perbaruiVarian } from "./varian";

const sql: Sql = koneksiTes();
const KUCING = "bye-bye-cat-50g";
const ONGKIR: OpsiOngkir[] = [{ courier: "JNE", service: "REG", cost: 9000, etd: "1-2" }];
const cariOngkir: CariOngkir = async () => ONGKIR;

const ATURAN = (() => {
  const isi = readFileSync(join(process.cwd(), "migrations", "0028_paket_kirim.sql"), "utf8");
  return isi.slice(isi.indexOf("UPDATE"));
})();

const KECIL = { g: 150, p: 18, l: 8, t: 6 };
const SEDANG = { g: 400, p: 10, l: 10, t: 22 };
const SPRAY_BESAR = { g: 400, p: 7, l: 7, t: 22 };
const KOSONG = { g: null, p: null, l: null, t: null };

beforeEach(async () => {
  await bersihkan(sql);
});

afterAll(async () => {
  await sql.end();
});

async function paket(slug: string) {
  const [v] = await sql<{ g: number | null; p: number | null; l: number | null; t: number | null }[]>`
    select
      package_weight_g as g,
      package_length_cm as p,
      package_width_cm as l,
      package_height_cm as t
    from product_variants
    where slug = ${slug}
  `;
  return v;
}

const ukuran = (slug: string, label: string, weight_g: number) => ({
  slug,
  label,
  price: 30000,
  weight_g,
  stock: 5,
});

describe("aturan paket dari klien", () => {
  it("mengisi berat dan dimensi dari berat produk, spray 220/250 ml punya aturan sendiri", async () => {
    await pecahUkuran(sql, KUCING, [
      ukuran("uji-50g", "50 g", 50),
      ukuran("uji-70g", "70 g", 70),
      ukuran("uji-100g", "100 g", 100),
      ukuran("uji-110g", "100 ml", 110),
      ukuran("uji-250g", "Standar", 250),
      ukuran("uji-220ml", "220 ml", 240),
      ukuran("uji-250ml", "250ml", 270),
      ukuran("uji-280g", "Standar", 280),
    ]);

    await sql.unsafe(ATURAN).simple();

    expect(await paket("uji-50g")).toEqual(KOSONG);
    expect(await paket("uji-70g")).toEqual(KECIL);
    expect(await paket("uji-100g")).toEqual(KECIL);
    expect(await paket("uji-110g")).toEqual(SEDANG);
    expect(await paket("uji-250g")).toEqual(SEDANG);
    expect(await paket("uji-220ml")).toEqual(SPRAY_BESAR);
    expect(await paket("uji-250ml")).toEqual(SPRAY_BESAR);
    expect(await paket("uji-280g")).toEqual(KOSONG);
  });

  it("tidak menimpa paket yang sudah diatur admin, termasuk spray besar", async () => {
    await pecahUkuran(sql, KUCING, [ukuran("uji-80g", "80 g", 80), ukuran("uji-220ml", "220 ml", 240)]);
    await sql`
      update product_variants
      set package_weight_g = 200, package_length_cm = 20, package_width_cm = 10, package_height_cm = 5
    `;

    await sql.unsafe(ATURAN).simple();

    expect(await paket("uji-80g")).toEqual({ g: 200, p: 20, l: 10, t: 5 });
    expect(await paket("uji-220ml")).toEqual({ g: 200, p: 20, l: 10, t: 5 });
  });
});

describe("paket di varian", () => {
  it("dimensi harus lengkap tiga-tiganya atau kosong semua", async () => {
    expect(await perbaruiVarian(sql, KUCING, { package_length_cm: 18 })).toEqual({
      ok: false,
      alasan: "package_dimensions_incomplete",
    });

    const lengkap = await perbaruiVarian(sql, KUCING, {
      package_weight_g: 150,
      package_length_cm: 18,
      package_width_cm: 8,
      package_height_cm: 6,
    });
    expect(lengkap.ok).toBe(true);

    expect((await perbaruiVarian(sql, KUCING, { package_height_cm: 7 })).ok).toBe(true);
    expect(await paket(KUCING)).toEqual({ g: 150, p: 18, l: 8, t: 7 });

    const hapus = await perbaruiVarian(sql, KUCING, {
      package_length_cm: null,
      package_width_cm: null,
      package_height_cm: null,
    });
    expect(hapus.ok).toBe(true);
    expect(await paket(KUCING)).toEqual({ g: 150, p: null, l: null, t: null });
  });

  it("item pesanan membawa paket dari variannya, supaya label bisa menjumlahkan", async () => {
    await perbaruiVarian(sql, KUCING, {
      package_weight_g: 150,
      package_length_cm: 18,
      package_width_cm: 8,
      package_height_cm: 6,
    });

    const hasil = await buatPesanan(
      sql,
      {
        customer_name: "Rina Kartika",
        phone: "0812-3456-7890",
        email: "rina@contoh.test",
        address: "Jl. Cihampelas No. 42, Bandung",
        dest_id: "50001",
        courier: "JNE",
        service: "REG",
        items: [{ slug: KUCING, qty: 2 }],
      },
      1,
      cariOngkir,
    );

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(hasil.pesanan.items[0]).toMatchObject({
      qty: 2,
      package_weight_g: 150,
      package_length_cm: 18,
      package_width_cm: 8,
      package_height_cm: 6,
    });
  });
});
