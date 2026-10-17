import { afterAll, beforeEach, describe, expect, it } from "vitest";

import type { Sql } from "../lib/db";
import type { OpsiOngkir } from "../lib/shipping";
import { hashToken, tokenAcak } from "../lib/sesi";
import { bersihkan, koneksiTes } from "../test/db";
import {
  alamatTerakhir,
  buatSesi,
  hapusSesi,
  penggunaDariCookie,
  penggunaDariToken,
  pesananPengguna,
  sapuSesi,
  selesaikanMasuk,
} from "./akun";
import { buatPesanan, type CariOngkir, type PermintaanPesanan } from "./pesanan";

const sql: Sql = koneksiTes();

const ONGKIR: OpsiOngkir[] = [{ courier: "JNE", service: "REG", cost: 9000, etd: "1-2" }];
const cariOngkir: CariOngkir = async () => ONGKIR;

const RINA = { sub: "google-rina", email: "rina@contoh.test", name: "Rina Kartika" };
const BUDI = { sub: "google-budi", email: "budi@contoh.test", name: "Budi" };

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
    items: [{ slug: "bye-bye-cat-50g", qty: 1 }],
    ...ubah,
  };
}

async function pesanSebagaiTamu(ubah: Partial<PermintaanPesanan> = {}): Promise<string> {
  const hasil = await buatPesanan(sql, permintaan(ubah), 1, cariOngkir);
  if (!hasil.ok) throw new Error(`gagal membuat pesanan: ${hasil.badan.error}`);
  return hasil.pesanan.order_no;
}

async function pemilik(orderNo: string): Promise<number | null> {
  const [b] = await sql<{ user_id: number | null }[]>`
    select user_id::int as user_id from orders where order_no = ${orderNo}
  `;
  return b.user_id;
}

describe("selesaikanMasuk", () => {
  it("membuat pengguna baru saat pertama kali masuk", async () => {
    const { pengguna } = await selesaikanMasuk(sql, RINA);

    expect(pengguna).toEqual({ id: expect.any(Number), email: RINA.email, name: RINA.name });
  });

  it("masuk lagi dengan akun Google yang sama memakai pengguna yang sama dan memperbarui namanya", async () => {
    const pertama = await selesaikanMasuk(sql, RINA);
    const kedua = await selesaikanMasuk(sql, { ...RINA, name: "Rina K." });

    expect(kedua.pengguna.id).toBe(pertama.pengguna.id);
    expect(kedua.pengguna.name).toBe("Rina K.");
  });

  it("menautkan pesanan tamu lama dengan email yang sama, tanpa peduli huruf besar", async () => {
    const a = await pesanSebagaiTamu({ email: "RINA@contoh.test" });
    const b = await pesanSebagaiTamu();

    const { pengguna, pesananTertaut } = await selesaikanMasuk(sql, RINA);

    expect(pesananTertaut).toBe(2);
    expect(await pemilik(a)).toBe(pengguna.id);
    expect(await pemilik(b)).toBe(pengguna.id);
  });

  it("tidak menyentuh pesanan tamu dengan email lain", async () => {
    const punyaOrangLain = await pesanSebagaiTamu({ email: "orang.lain@contoh.test" });

    await selesaikanMasuk(sql, RINA);

    expect(await pemilik(punyaOrangLain)).toBeNull();
  });

  it("tidak bisa merebut pesanan yang sudah tertaut ke akun lain", async () => {
    const budi = await selesaikanMasuk(sql, BUDI);
    const pesanan = await pesanSebagaiTamu({ email: "rina@contoh.test" });
    await sql`update orders set user_id = ${budi.pengguna.id} where order_no = ${pesanan}`;

    const rina = await selesaikanMasuk(sql, RINA);

    expect(rina.pesananTertaut).toBe(0);
    expect(await pemilik(pesanan)).toBe(budi.pengguna.id);
  });
});

describe("sesi", () => {
  it("token yang dibuat bisa dipakai menemukan penggunanya", async () => {
    const { pengguna } = await selesaikanMasuk(sql, RINA);
    const token = tokenAcak();
    await buatSesi(sql, pengguna.id, await hashToken(token), 30);

    expect(await penggunaDariToken(sql, token)).toEqual(pengguna);
    expect(await penggunaDariCookie(sql, `lain=1; sid=${token}`)).toEqual(pengguna);
  });

  it("database cuma menyimpan hash, bukan tokennya", async () => {
    const { pengguna } = await selesaikanMasuk(sql, RINA);
    const token = tokenAcak();
    await buatSesi(sql, pengguna.id, await hashToken(token), 30);

    const [b] = await sql<{ n: number }[]>`
      select count(*)::int as n from sessions where token_hash = ${token}
    `;
    expect(b.n).toBe(0);
  });

  it("token salah, kosong, atau sudah kedaluwarsa tidak dikenali", async () => {
    const { pengguna } = await selesaikanMasuk(sql, RINA);
    const token = tokenAcak();
    await buatSesi(sql, pengguna.id, await hashToken(token), 30);
    await sql`update sessions set expires_at = now() - interval '1 second'`;

    expect(await penggunaDariToken(sql, token)).toBeUndefined();
    expect(await penggunaDariToken(sql, tokenAcak())).toBeUndefined();
    expect(await penggunaDariToken(sql, null)).toBeUndefined();
    expect(await penggunaDariCookie(sql, undefined)).toBeUndefined();
  });

  it("keluar menghapus sesi itu saja, sesi di perangkat lain tetap jalan", async () => {
    const { pengguna } = await selesaikanMasuk(sql, RINA);
    const hp = tokenAcak();
    const laptop = tokenAcak();
    await buatSesi(sql, pengguna.id, await hashToken(hp), 30);
    await buatSesi(sql, pengguna.id, await hashToken(laptop), 30);

    await hapusSesi(sql, hp);

    expect(await penggunaDariToken(sql, hp)).toBeUndefined();
    expect(await penggunaDariToken(sql, laptop)).toEqual(pengguna);
  });

  it("penyapu hanya membuang sesi yang sudah kedaluwarsa", async () => {
    const { pengguna } = await selesaikanMasuk(sql, RINA);
    await buatSesi(sql, pengguna.id, await hashToken("basi"), 30);
    await buatSesi(sql, pengguna.id, await hashToken("segar"), 30);
    await sql`update sessions set expires_at = now() - interval '1 day' where token_hash = ${await hashToken("basi")}`;

    expect(await sapuSesi(sql)).toBe(1);
    expect(await penggunaDariToken(sql, "segar")).toEqual(pengguna);
  });
});

describe("checkout saat masuk", () => {
  it("pesanan langsung tertaut ke akun, walau email di form berbeda", async () => {
    const { pengguna } = await selesaikanMasuk(sql, RINA);

    const hasil = await buatPesanan(
      sql,
      permintaan({ email: "email.kantor@contoh.test" }),
      1,
      cariOngkir,
      pengguna.id,
    );

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(await pemilik(hasil.pesanan.order_no)).toBe(pengguna.id);
  });

  it("pesanan tamu tetap tanpa pemilik", async () => {
    const nomor = await pesanSebagaiTamu();
    expect(await pemilik(nomor)).toBeNull();
  });
});

describe("riwayat dan alamat", () => {
  it("riwayat hanya berisi pesanan milik pengguna itu, terbaru di atas", async () => {
    const lama = await pesanSebagaiTamu();
    const baru = await pesanSebagaiTamu({ items: [{ slug: "bye-bye-cat-50g", qty: 3 }] });
    await pesanSebagaiTamu({ email: "orang.lain@contoh.test" });
    await sql`update orders set created_at = now() - interval '1 day' where order_no = ${lama}`;

    const { pengguna } = await selesaikanMasuk(sql, RINA);
    const riwayat = await pesananPengguna(sql, pengguna.id);

    expect(riwayat.map((r) => [r.order_no, r.item_count])).toEqual([
      [baru, 3],
      [lama, 1],
    ]);
  });

  it("alamat terakhir diambil dari pesanan paling baru, lengkap dengan label kecamatan", async () => {
    await pesanSebagaiTamu({ address: "Alamat lama nomor satu" });
    const baru = await pesanSebagaiTamu({ address: "Alamat baru nomor dua" });
    await sql`update orders set created_at = now() + interval '1 minute' where order_no = ${baru}`;

    const { pengguna } = await selesaikanMasuk(sql, RINA);

    expect(await alamatTerakhir(sql, pengguna.id)).toEqual({
      customer_name: "Rina Kartika",
      phone: "081234567890",
      address: "Alamat baru nomor dua",
      dest_id: "50001",
      dest_label: "Coblong, Kota Bandung, Jawa Barat",
    });
  });

  it("menghapus pengguna tidak menghapus pesanannya, hanya melepas tautannya", async () => {
    const pesanan = await pesanSebagaiTamu();
    const { pengguna } = await selesaikanMasuk(sql, RINA);
    await buatSesi(sql, pengguna.id, await hashToken("t"), 30);

    await sql`delete from users where id = ${pengguna.id}`;

    expect(await pemilik(pesanan)).toBeNull();
    const [s] = await sql<{ n: number }[]>`select count(*)::int as n from sessions`;
    expect(s.n).toBe(0);
  });
});
