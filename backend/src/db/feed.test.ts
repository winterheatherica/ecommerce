import { afterAll, beforeEach, describe, expect, it } from "vitest";

import type { Sql } from "../lib/db";
import { bersihkan, koneksiTes, pecahUkuran } from "../test/db";
import { barisFeed } from "./feed";

const sql: Sql = koneksiTes();
const KUCING = "bye-bye-cat-50g";
const LAIN = "bye-bye-cat-80g";

beforeEach(async () => {
  await bersihkan(sql);
});

afterAll(async () => {
  await sql.end();
});

const ukuran = (slug: string, label: string, price: number, stock = 5) => ({
  slug,
  label,
  price,
  weight_g: 50,
  stock,
});

describe("barisFeed", () => {
  it("satu baris per ukuran aktif dari produk aktif, foto khusus ukuran di depan, berat paket dipakai", async () => {
    await pecahUkuran(sql, KUCING, [
      ukuran("uji-50g", "50 g", 45000),
      ukuran("uji-80g", "80 g", 54000, 0),
      ukuran("uji-200g", "200 g", 90000),
    ]);
    await sql`update product_variants set is_active = false where slug = 'uji-200g'`;
    await sql`update product_variants set package_weight_g = 75 where slug = 'uji-50g'`;
    await sql`update products set brand = 'Bye Bye' where slug = ${KUCING}`;
    await sql`update products set is_active = false where slug = ${LAIN}`;
    await sql`delete from product_images where product_id = (select id from products where slug = ${KUCING})`;
    await sql`
      insert into product_images (product_id, cloudinary_id, version, sort_order, variant_id)
      select p.id, f.foto, f.versi, f.urut, (select v.id from product_variants v where v.slug = f.varian)
      from products p,
        (values
          ('menik-store/produk/umum-1', 1, 0, null),
          ('menik-store/produk/umum-2', null, 1, null),
          ('menik-store/produk/khusus-80', 7, 2, 'uji-80g')
        ) as f(foto, versi, urut, varian)
      where p.slug = ${KUCING}
    `;

    const semua = await barisFeed(sql);
    const kucing = semua.filter((b) => b.product_slug === KUCING);

    expect(kucing.map((b) => [b.variant_slug, b.label, b.jumlah_ukuran, b.price, b.stock, b.weight_g])).toEqual([
      ["uji-50g", "50 g", 2, 45000, 5, 75],
      ["uji-80g", "80 g", 2, 54000, 0, 50],
    ]);
    expect(kucing.every((b) => b.brand === "Bye Bye")).toBe(true);
    expect(kucing[0].images).toEqual([
      { cloudinary_id: "menik-store/produk/umum-1", version: 1 },
      { cloudinary_id: "menik-store/produk/umum-2", version: null },
    ]);
    expect(kucing[1].images.map((f) => f.cloudinary_id)).toEqual([
      "menik-store/produk/khusus-80",
      "menik-store/produk/umum-1",
      "menik-store/produk/umum-2",
    ]);
    expect(semua.some((b) => b.product_slug === LAIN)).toBe(false);

    const [jenis] = await sql<{ teks: string }[]>`
      select concat_ws(' > ', g.label, c.label) as teks
      from products p join categories c on c.slug = p.category join category_groups g on g.slug = c.group_slug
      where p.slug = ${KUCING}
    `;
    expect(kucing[0].product_type).toBe(jenis.teks);
  });

  it("status promo dihitung dari waktu sekarang", async () => {
    await pecahUkuran(sql, KUCING, [
      ukuran("uji-a", "A", 50000),
      ukuran("uji-b", "B", 50000),
      ukuran("uji-c", "C", 50000),
    ]);
    await sql`
      update product_variants
      set promo_price = 40000, promo_starts_at = now() - interval '1 day', promo_ends_at = now() + interval '1 day'
      where slug = 'uji-a'
    `;
    await sql`
      update product_variants
      set promo_price = 40000, promo_starts_at = now() + interval '1 day', promo_ends_at = now() + interval '2 day'
      where slug = 'uji-b'
    `;
    await sql`
      update product_variants
      set promo_price = 40000, promo_starts_at = now() - interval '2 day', promo_ends_at = now() - interval '1 day'
      where slug = 'uji-c'
    `;

    const kucing = (await barisFeed(sql)).filter((b) => b.product_slug === KUCING);

    expect(kucing.map((b) => [b.variant_slug, b.promo_status, b.promo_price])).toEqual([
      ["uji-a", "active", 40000],
      ["uji-b", "scheduled", 40000],
      ["uji-c", "ended", 40000],
    ]);
    expect(kucing[0].promo_ends_at).not.toBeNull();
  });
});
