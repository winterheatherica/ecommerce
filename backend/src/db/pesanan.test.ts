import { afterAll, beforeEach, describe, expect, it } from "vitest";

import type { Sql } from "../lib/db";
import { bersihkan, koneksiTes } from "../test/db";
import {
  ambilPesanan,
  batalkanPesanan,
  buatPesanan,
  cariPesanan,
  daftarPesanan,
  gagalkanPembayaran,
  sapuKedaluwarsa,
  simpanPembayaran,
  tandaiDikirim,
  tandaiSelesai,
  tandaiTerbayar,
  type CariOngkir,
  type PermintaanPesanan,
} from "./pesanan";
import type { OpsiOngkir } from "../lib/shipping";

const UMUR_JAM = 1;

const ONGKIR: OpsiOngkir[] = [
  { courier: "JNE", service: "REG", cost: 9000, etd: "1-2" },
  { courier: "J&T", service: "EZ", cost: 8500, etd: "2-3" },
];

const cariOngkir: CariOngkir = async () => ONGKIR;
const ongkirKosong: CariOngkir = async () => null;
const KUCING = "bye-bye-cat-50g";
const NYAMUK = "goito-gel-nyamuk";
const HABIS = "bye-bye-cicak-gel-80gr";

const sql: Sql = koneksiTes();

beforeEach(async () => {
  await bersihkan(sql);
});

afterAll(async () => {
  await sql.end();
});

function permintaan(ubah: Partial<PermintaanPesanan> = {}): PermintaanPesanan {
  return {
    customer_name: "Rina Kartika",
    phone: "0812-3456-7890",
    email: "rina@contoh.test",
    address: "Jl. Cihampelas No. 42, Bandung",
    dest_id: "50001",
    courier: "JNE",
    service: "REG",
    items: [{ slug: KUCING, qty: 1 }],
    ...ubah,
  };
}

async function stok(slug: string): Promise<number> {
  const [p] = await sql<{ stock: number }[]>`
    select stock from products where slug = ${slug}
  `;
  return p.stock;
}

async function lewatkanBatas(orderNo: string): Promise<void> {
  await sql`
    update orders set expires_at = now() - interval '1 hour'
    where order_no = ${orderNo}
  `;
}

async function buat(ubah: Partial<PermintaanPesanan> = {}) {
  const hasil = await buatPesanan(sql, permintaan(ubah), UMUR_JAM, cariOngkir);
  if (!hasil.ok) throw new Error(`Gagal membuat pesanan: ${hasil.badan.error}`);
  return hasil.pesanan;
}

describe("buatPesanan", () => {
  it("menghitung subtotal dari harga katalog", async () => {
    const pesanan = await buat({ items: [{ slug: KUCING, qty: 2 }] });

    expect(pesanan.subtotal).toBe(49000 * 2);
    expect(pesanan.total).toBe(pesanan.subtotal + pesanan.shipping_cost);
  });

  it("menjumlahkan berat dari katalog", async () => {
    const pesanan = await buat({
      items: [
        { slug: KUCING, qty: 2 },
        { slug: NYAMUK, qty: 1 },
      ],
    });

    expect(pesanan.weight_g).toBe(50 * 2 + 100);
  });

  it("memotong stok sebanyak yang dipesan", async () => {
    const sebelum = await stok(KUCING);
    await buat({ items: [{ slug: KUCING, qty: 3 }] });

    expect(await stok(KUCING)).toBe(sebelum - 3);
  });

  it("menolak kalau stok kurang dan tidak menyentuh stok sama sekali", async () => {
    const sebelum = await stok(KUCING);
    const hasil = await buatPesanan(
      sql,
      permintaan({ items: [{ slug: KUCING, qty: sebelum + 1 }] }),
      UMUR_JAM,
      cariOngkir,
    );

    expect(hasil.ok).toBe(false);
    if (hasil.ok) return;
    expect(hasil.status).toBe(409);
    expect(hasil.badan.error).toBe("insufficient_stock");
    expect(hasil.badan.available).toBe(sebelum);
    expect(await stok(KUCING)).toBe(sebelum);
  });

  it("menjumlahkan slug yang sama supaya tidak bisa melewati batas stok", async () => {
    const sebelum = await stok(KUCING);
    const hasil = await buatPesanan(
      sql,
      permintaan({
        items: [
          { slug: KUCING, qty: sebelum },
          { slug: KUCING, qty: 1 },
        ],
      }),
      UMUR_JAM,
      cariOngkir,
    );

    expect(hasil.ok).toBe(false);
    expect(await stok(KUCING)).toBe(sebelum);
  });

  it("menggabungkan slug kembar jadi satu baris item", async () => {
    const pesanan = await buat({
      items: [
        { slug: KUCING, qty: 1 },
        { slug: KUCING, qty: 2 },
      ],
    });

    expect(pesanan.items).toHaveLength(1);
    expect(pesanan.items[0].qty).toBe(3);
  });

  it("menolak produk yang stoknya nol", async () => {
    const hasil = await buatPesanan(
      sql,
      permintaan({ items: [{ slug: HABIS, qty: 1 }] }),
      UMUR_JAM,
      cariOngkir,
    );

    expect(hasil.ok).toBe(false);
    if (hasil.ok) return;
    expect(hasil.badan.error).toBe("insufficient_stock");
  });

  it("menolak produk yang tidak aktif", async () => {
    await sql`update products set is_active = false where slug = ${KUCING}`;

    const hasil = await buatPesanan(sql, permintaan(), UMUR_JAM, cariOngkir);

    expect(hasil.ok).toBe(false);
    if (hasil.ok) return;
    expect(hasil.status).toBe(422);
    expect(hasil.badan.error).toBe("product_not_found");
  });

  it("menolak produk yang tidak ada", async () => {
    const hasil = await buatPesanan(
      sql,
      permintaan({ items: [{ slug: "tidak-ada", qty: 1 }] }),
      UMUR_JAM,
      cariOngkir,
    );

    expect(hasil.ok).toBe(false);
    if (hasil.ok) return;
    expect(hasil.badan.error).toBe("product_not_found");
  });

  it("menolak kecamatan tujuan yang tidak dikenal", async () => {
    const hasil = await buatPesanan(sql, permintaan({ dest_id: "99999" }), UMUR_JAM, cariOngkir);

    expect(hasil.ok).toBe(false);
    if (hasil.ok) return;
    expect(hasil.badan.error).toBe("region_not_found");
  });

  it("menolak kalau ongkir tidak bisa diambil sama sekali", async () => {
    const sebelum = await stok(KUCING);
    const hasil = await buatPesanan(
      sql,
      permintaan(),
      UMUR_JAM,
      ongkirKosong,
    );

    expect(hasil.ok).toBe(false);
    if (hasil.ok) return;
    expect(hasil.badan.error).toBe("service_unavailable");
    expect(await stok(KUCING)).toBe(sebelum);
  });

  it("menolak layanan pengiriman yang tidak ada, dan stok tetap utuh", async () => {
    const sebelum = await stok(KUCING);
    const hasil = await buatPesanan(
      sql,
      permintaan({ courier: "POS", service: "KILAT" }),
      UMUR_JAM,
      cariOngkir,
    );

    expect(hasil.ok).toBe(false);
    if (hasil.ok) return;
    expect(hasil.badan.error).toBe("service_unavailable");
    expect(await stok(KUCING)).toBe(sebelum);
  });

  it("membekukan harga dan nama produk di item pesanan", async () => {
    const pesanan = await buat();
    await sql`update products set price = 1, name = 'Diganti' where slug = ${KUCING}`;

    const lagi = await cariPesanan(sql, pesanan.order_no);

    expect(lagi?.items[0].price_snapshot).toBe(49000);
    expect(lagi?.items[0].name_snapshot).toBe(
      "Alat pengusir kucing Bye Bye Cat 50g",
    );
  });

  it("membuat nomor pesanan yang tidak berurutan", async () => {
    const a = await buat();
    const b = await buat();

    expect(a.order_no).not.toBe(b.order_no);
    expect(a.order_no).toMatch(/^MNK-/);
  });

  it("belum punya transaksi pembayaran, tapi sudah punya batas waktu", async () => {
    const pesanan = await buat();

    expect(pesanan.payment_reference).toBeNull();
    expect(pesanan.payment_url).toBeNull();
    expect(pesanan.payment_channel).toBeNull();
    expect(new Date(pesanan.expires_at as string).getTime()).toBeGreaterThan(
      Date.now(),
    );
  });

  it("batas waktu mengikuti umur yang diminta", async () => {
    const hasil = await buatPesanan(sql, permintaan(), 3, cariOngkir);

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;

    const jam =
      (new Date(hasil.pesanan.expires_at as string).getTime() - Date.now()) /
      3_600_000;

    expect(jam).toBeGreaterThan(2.9);
    expect(jam).toBeLessThan(3.1);
  });

  it("membersihkan spasi dan tanda hubung di nomor HP", async () => {
    const pesanan = await buat();

    expect(pesanan.phone).toBe("081234567890");
  });

  it("selalu mulai dari status PENDING", async () => {
    const pesanan = await buat();

    expect(pesanan.status).toBe("PENDING");
    expect(pesanan.paid_at).toBeNull();
    expect(pesanan.tracking_number).toBeNull();
  });

  it("menolak nomor HP yang bukan nomor, tanpa menyentuh stok", async () => {
    const sebelum = await stok(KUCING);
    const hasil = await buatPesanan(
      sql,
      permintaan({ phone: "abcdefghij" }),
      UMUR_JAM,
      cariOngkir,
    );

    expect(hasil.ok).toBe(false);
    if (hasil.ok) return;
    expect(hasil.status).toBe(422);
    expect(hasil.badan.error).toBe("invalid_phone");
    expect(await stok(KUCING)).toBe(sebelum);
  });

  it("menolak email yang tidak valid", async () => {
    const hasil = await buatPesanan(
      sql,
      permintaan({ email: "bukan-email" }),
      UMUR_JAM,
      cariOngkir,
    );

    expect(hasil.ok).toBe(false);
    if (hasil.ok) return;
    expect(hasil.badan.error).toBe("invalid_email");
  });

  it("menolak pesanan tanpa email karena Tripay mewajibkannya", async () => {
    const hasil = await buatPesanan(sql, permintaan({ email: "" }), UMUR_JAM, cariOngkir);

    expect(hasil.ok).toBe(false);
    if (hasil.ok) return;
    expect(hasil.badan.error).toBe("invalid_email");
  });

  it("menolak nilai pesanan yang melampaui batas integer, stok kembali utuh", async () => {
    await sql`update products set price = 100000000, stock = 99 where slug = ${KUCING}`;
    const hasil = await buatPesanan(
      sql,
      permintaan({ items: [{ slug: KUCING, qty: 99 }] }),
      UMUR_JAM,
      cariOngkir,
    );

    expect(hasil.ok).toBe(false);
    if (hasil.ok) return;
    expect(hasil.badan.error).toBe("order_too_large");
    expect(await stok(KUCING)).toBe(99);
  });

  it("menyertakan label kecamatan hasil join", async () => {
    const pesanan = await buat();

    expect(pesanan.dest_label).toBe("Coblong, Kota Bandung, Jawa Barat");
  });
});

describe("balapan stok", () => {
  it("dua pesanan berebut stok terakhir, hanya satu yang berhasil", async () => {
    await sql`update products set stock = 1 where slug = ${KUCING}`;

    const a = koneksiTes();
    const b = koneksiTes();

    try {
      const hasil = await Promise.all([
        buatPesanan(a, permintaan(), UMUR_JAM, cariOngkir),
        buatPesanan(b, permintaan(), UMUR_JAM, cariOngkir),
      ]);

      expect(hasil.filter((h) => h.ok)).toHaveLength(1);
      expect(hasil.filter((h) => !h.ok)).toHaveLength(1);
      expect(await stok(KUCING)).toBe(0);
    } finally {
      await a.end();
      await b.end();
    }
  });
});

describe("cariPesanan", () => {
  it("menemukan tanpa peduli huruf besar-kecil dan spasi", async () => {
    const pesanan = await buat();

    const a = await cariPesanan(sql, pesanan.order_no.toLowerCase());
    const b = await cariPesanan(sql, `  ${pesanan.order_no}  `);

    expect(a?.id).toBe(pesanan.id);
    expect(b?.id).toBe(pesanan.id);
  });

  it("mengembalikan undefined kalau tidak ada", async () => {
    expect(await cariPesanan(sql, "MNK-TIDAKADA")).toBeUndefined();
  });

  it("mengedaluwarsakan sendiri saat dibaca", async () => {
    const pesanan = await buat();
    await lewatkanBatas(pesanan.order_no);

    const lagi = await cariPesanan(sql, pesanan.order_no);

    expect(lagi?.status).toBe("EXPIRED");
  });
});

describe("tandaiTerbayar", () => {
  it("mengubah PENDING jadi PAID", async () => {
    const pesanan = await buat();
    const hasil = await tandaiTerbayar(sql, pesanan.order_no, "BCA_VA");

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(hasil.pesanan.status).toBe("PAID");
    expect(hasil.pesanan.payment_method).toBe("BCA_VA");
    expect(hasil.pesanan.paid_at).not.toBeNull();
    expect(hasil.sudahPernah).toBe(false);
  });

  it("idempoten: dipanggil dua kali tidak menimpa waktu bayar", async () => {
    const pesanan = await buat();

    const pertama = await tandaiTerbayar(sql, pesanan.order_no, "BCA_VA");
    const kedua = await tandaiTerbayar(sql, pesanan.order_no, "OVO");

    expect(pertama.ok && kedua.ok).toBe(true);
    if (!pertama.ok || !kedua.ok) return;
    expect(kedua.sudahPernah).toBe(true);
    expect(kedua.pesanan.paid_at).toBe(pertama.pesanan.paid_at);
    expect(kedua.pesanan.payment_method).toBe("BCA_VA");
  });

  it("tidak peduli huruf besar-kecil", async () => {
    const pesanan = await buat();
    const hasil = await tandaiTerbayar(sql, pesanan.order_no.toLowerCase(), null);

    expect(hasil.ok).toBe(true);
  });

  it("menolak pesanan yang tidak ada", async () => {
    const hasil = await tandaiTerbayar(sql, "MNK-TIDAKADA", null);

    expect(hasil.ok).toBe(false);
    if (hasil.ok) return;
    expect(hasil.alasan).toBe("not_found");
  });

  it("menolak pesanan yang sudah kedaluwarsa", async () => {
    const pesanan = await buat();
    await lewatkanBatas(pesanan.order_no);

    const hasil = await tandaiTerbayar(sql, pesanan.order_no, null);

    expect(hasil.ok).toBe(false);
    if (hasil.ok) return;
    expect(hasil.alasan).toBe("invalid_status");
  });

  it("menolak pesanan yang sudah dikirim", async () => {
    const pesanan = await buat();
    await tandaiTerbayar(sql, pesanan.order_no, null);
    await tandaiDikirim(sql, pesanan.order_no, "JNE123456");

    const hasil = await tandaiTerbayar(sql, pesanan.order_no, null);

    expect(hasil.ok).toBe(false);
    if (hasil.ok) return;
    expect(hasil.alasan).toBe("invalid_status");
  });
});

describe("tandaiDikirim", () => {
  it("mengubah PAID jadi SHIPPED dan menyimpan resi", async () => {
    const pesanan = await buat();
    await tandaiTerbayar(sql, pesanan.order_no, null);

    const hasil = await tandaiDikirim(sql, pesanan.order_no, "  JNE123456  ");

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(hasil.pesanan.status).toBe("SHIPPED");
    expect(hasil.pesanan.tracking_number).toBe("JNE123456");
    expect(hasil.pesanan.shipped_at).not.toBeNull();
  });

  it("menolak pesanan yang belum dibayar", async () => {
    const pesanan = await buat();
    const hasil = await tandaiDikirim(sql, pesanan.order_no, "JNE123456");

    expect(hasil.ok).toBe(false);
    if (hasil.ok) return;
    expect(hasil.alasan).toBe("invalid_status");
    expect(hasil.status).toBe("PENDING");
  });
});

describe("sapuKedaluwarsa", () => {
  it("mengubah status jadi EXPIRED dan mengembalikan stok", async () => {
    const sebelum = await stok(KUCING);
    const pesanan = await buat({ items: [{ slug: KUCING, qty: 2 }] });

    expect(await stok(KUCING)).toBe(sebelum - 2);

    await lewatkanBatas(pesanan.order_no);
    const disapu = await sapuKedaluwarsa(sql);

    expect(disapu).toEqual([pesanan.order_no]);
    expect(await stok(KUCING)).toBe(sebelum);
  });

  it("tidak mengembalikan stok dua kali walau dipanggil berulang", async () => {
    const sebelum = await stok(KUCING);
    const pesanan = await buat({ items: [{ slug: KUCING, qty: 2 }] });
    await lewatkanBatas(pesanan.order_no);

    await sapuKedaluwarsa(sql);
    await sapuKedaluwarsa(sql);
    await sapuKedaluwarsa(sql);

    expect(await stok(KUCING)).toBe(sebelum);
  });

  it("tidak menyentuh pesanan yang belum lewat batas", async () => {
    const pesanan = await buat();
    const disapu = await sapuKedaluwarsa(sql);

    expect(disapu).toEqual([]);
    expect((await cariPesanan(sql, pesanan.order_no))?.status).toBe("PENDING");
  });

  it("tidak menyentuh pesanan yang sudah dibayar", async () => {
    const pesanan = await buat();
    await tandaiTerbayar(sql, pesanan.order_no, null);
    await lewatkanBatas(pesanan.order_no);

    const disapu = await sapuKedaluwarsa(sql);

    expect(disapu).toEqual([]);
    expect((await cariPesanan(sql, pesanan.order_no))?.status).toBe("PAID");
  });

  it("menyapu beberapa pesanan sekaligus", async () => {
    const a = await buat({ items: [{ slug: KUCING, qty: 1 }] });
    const b = await buat({ items: [{ slug: NYAMUK, qty: 2 }] });

    await lewatkanBatas(a.order_no);
    await lewatkanBatas(b.order_no);

    const disapu = await sapuKedaluwarsa(sql);

    expect(disapu.sort()).toEqual([a.order_no, b.order_no].sort());
  });

  it("pesanan yang kedaluwarsa tidak bisa dibayar lagi", async () => {
    const pesanan = await buat();
    await lewatkanBatas(pesanan.order_no);
    await sapuKedaluwarsa(sql);

    const hasil = await tandaiTerbayar(sql, pesanan.order_no, null);

    expect(hasil.ok).toBe(false);
  });
});

describe("daftarPesanan", () => {
  it("mengurutkan dari yang terbaru", async () => {
    const a = await buat();
    const b = await buat();

    const { data, total } = await daftarPesanan(sql, { limit: 50, offset: 0 });

    expect(total).toBe(2);
    expect(data.map((p) => p.order_no)).toContain(a.order_no);
    expect(data[0].order_no).toBe(b.order_no);
  });

  it("menyaring berdasarkan status", async () => {
    const a = await buat();
    await buat();
    await tandaiTerbayar(sql, a.order_no, null);

    const { data, total } = await daftarPesanan(sql, {
      status: "PAID",
      limit: 50,
      offset: 0,
    });

    expect(total).toBe(1);
    expect(data[0].order_no).toBe(a.order_no);
  });

  it("menghitung total di luar batas halaman", async () => {
    await buat();
    await buat();
    await buat();

    const { data, total } = await daftarPesanan(sql, { limit: 2, offset: 0 });

    expect(data).toHaveLength(2);
    expect(total).toBe(3);
  });

  it("mengembalikan daftar kosong tanpa galat", async () => {
    const { data, total } = await daftarPesanan(sql, { limit: 50, offset: 0 });

    expect(data).toEqual([]);
    expect(total).toBe(0);
  });
});

describe("tandaiSelesai", () => {
  it("mengubah SHIPPED jadi DELIVERED", async () => {
    const pesanan = await buat();
    await tandaiTerbayar(sql, pesanan.order_no, null);
    await tandaiDikirim(sql, pesanan.order_no, "JNE123456");

    const hasil = await tandaiSelesai(sql, pesanan.order_no);

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(hasil.pesanan.status).toBe("DELIVERED");
    expect(hasil.pesanan.tracking_number).toBe("JNE123456");
  });

  it("menolak pesanan yang belum dikirim", async () => {
    const pesanan = await buat();
    await tandaiTerbayar(sql, pesanan.order_no, null);

    const hasil = await tandaiSelesai(sql, pesanan.order_no);

    expect(hasil.ok).toBe(false);
    if (hasil.ok) return;
    expect(hasil.alasan).toBe("invalid_status");
    expect(hasil.status).toBe("PAID");
  });

  it("menolak pesanan yang tidak ada", async () => {
    const hasil = await tandaiSelesai(sql, "MNK-TIDAKADA");

    expect(hasil.ok).toBe(false);
    if (hasil.ok) return;
    expect(hasil.alasan).toBe("not_found");
  });
});

describe("batalkanPesanan", () => {
  it("membatalkan pesanan yang belum dibayar dan mengembalikan stok", async () => {
    const sebelum = await stok(KUCING);
    const pesanan = await buat({ items: [{ slug: KUCING, qty: 2 }] });

    expect(await stok(KUCING)).toBe(sebelum - 2);

    const hasil = await batalkanPesanan(sql, pesanan.order_no);

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(hasil.pesanan.status).toBe("CANCELLED");
    expect(await stok(KUCING)).toBe(sebelum);
  });

  it("tidak mengembalikan stok dua kali", async () => {
    const sebelum = await stok(KUCING);
    const pesanan = await buat({ items: [{ slug: KUCING, qty: 2 }] });

    await batalkanPesanan(sql, pesanan.order_no);
    await batalkanPesanan(sql, pesanan.order_no);
    await batalkanPesanan(sql, pesanan.order_no);

    expect(await stok(KUCING)).toBe(sebelum);
  });

  it("menolak pesanan yang sudah dibayar, stok tetap terpotong", async () => {
    const sebelum = await stok(KUCING);
    const pesanan = await buat({ items: [{ slug: KUCING, qty: 2 }] });
    await tandaiTerbayar(sql, pesanan.order_no, null);

    const hasil = await batalkanPesanan(sql, pesanan.order_no);

    expect(hasil.ok).toBe(false);
    if (hasil.ok) return;
    expect(hasil.alasan).toBe("invalid_status");
    expect(hasil.status).toBe("PAID");
    expect(await stok(KUCING)).toBe(sebelum - 2);
  });

  it("pesanan yang dibatalkan tidak bisa dibayar", async () => {
    const pesanan = await buat();
    await batalkanPesanan(sql, pesanan.order_no);

    const hasil = await tandaiTerbayar(sql, pesanan.order_no, null);

    expect(hasil.ok).toBe(false);
  });

  it("menolak pesanan yang tidak ada", async () => {
    const hasil = await batalkanPesanan(sql, "MNK-TIDAKADA");

    expect(hasil.ok).toBe(false);
    if (hasil.ok) return;
    expect(hasil.alasan).toBe("not_found");
  });
});

describe("simpanPembayaran", () => {
  const bayar = {
    reference: "T0001000000000000006",
    url: "https://tripay.co.id/checkout/T0001000000000000006",
    channel: "QRIS",
    method: "QRIS by ShopeePay",
  };

  it("menyimpan referensi dan alamat pembayaran", async () => {
    const pesanan = await buat();
    const hasil = await simpanPembayaran(sql, pesanan.order_no, bayar);

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(hasil.pesanan.payment_reference).toBe(bayar.reference);
    expect(hasil.pesanan.payment_url).toBe(bayar.url);
    expect(hasil.pesanan.payment_channel).toBe("QRIS");
    expect(hasil.pesanan.payment_method).toBe(bayar.method);
    expect(hasil.pesanan.status).toBe("PENDING");
  });

  it("menolak pesanan yang sudah dibayar", async () => {
    const pesanan = await buat();
    await tandaiTerbayar(sql, pesanan.order_no, null);

    const hasil = await simpanPembayaran(sql, pesanan.order_no, bayar);

    expect(hasil.ok).toBe(false);
    if (hasil.ok) return;
    expect(hasil.alasan).toBe("invalid_status");
  });

  it("menolak pesanan yang tidak ada", async () => {
    const hasil = await simpanPembayaran(sql, "MNK-TIDAKADA", bayar);

    expect(hasil.ok).toBe(false);
    if (hasil.ok) return;
    expect(hasil.alasan).toBe("not_found");
  });
});

describe("gagalkanPembayaran", () => {
  it("mengembalikan stok saat Tripay bilang kedaluwarsa", async () => {
    const sebelum = await stok(KUCING);
    const pesanan = await buat({ items: [{ slug: KUCING, qty: 2 }] });

    expect(await stok(KUCING)).toBe(sebelum - 2);

    const nomor = await gagalkanPembayaran(sql, pesanan.order_no, "EXPIRED");

    expect(nomor).toBe(pesanan.order_no);
    expect(await stok(KUCING)).toBe(sebelum);
    expect((await ambilPesanan(sql, pesanan.order_no))?.status).toBe("EXPIRED");
  });

  it("tidak mengembalikan stok dua kali", async () => {
    const sebelum = await stok(KUCING);
    const pesanan = await buat({ items: [{ slug: KUCING, qty: 2 }] });

    await gagalkanPembayaran(sql, pesanan.order_no, "EXPIRED");
    await gagalkanPembayaran(sql, pesanan.order_no, "EXPIRED");

    expect(await stok(KUCING)).toBe(sebelum);
  });

  it("tidak menyentuh pesanan yang sudah dibayar", async () => {
    const sebelum = await stok(KUCING);
    const pesanan = await buat({ items: [{ slug: KUCING, qty: 2 }] });
    await tandaiTerbayar(sql, pesanan.order_no, null);

    const nomor = await gagalkanPembayaran(sql, pesanan.order_no, "EXPIRED");

    expect(nomor).toBeUndefined();
    expect(await stok(KUCING)).toBe(sebelum - 2);
    expect((await ambilPesanan(sql, pesanan.order_no))?.status).toBe("PAID");
  });
});
