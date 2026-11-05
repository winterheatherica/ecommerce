import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Sql } from "../lib/db";
import { emailUji, type IsiEmail, type KonfigEmail, type PengirimEmail } from "../lib/notifikasi";
import { koneksiTes, urlTes } from "../test/db";
import {
  PANJANG_GALAT_EMAIL,
  kabarkan,
  kirimDanCatat,
  sapuCatatanEmail,
  statusKirimEmail,
} from "./notifikasi";

const sql: Sql = koneksiTes();
const TOKO = "https://menikstore.my.id";

beforeEach(async () => {
  await sql`delete from email_notifications`;
});

afterEach(() => {
  vi.restoreAllMocks();
});

afterAll(async () => {
  await sql.end();
});

function konfig(send: PengirimEmail["send"]): KonfigEmail {
  return { pengirim: { send }, dari: "notifikasi@menikstore.my.id", ke: ["a@contoh.test"], toko: TOKO };
}

const berhasil = () => konfig(async () => ({ messageId: "1" }));

function gagal(pesan: string) {
  vi.spyOn(console, "error").mockImplementation(() => {});
  return konfig(async () => {
    throw new Error(pesan);
  });
}

function emailBayar(nomor: string): IsiEmail {
  return { ...emailUji(TOKO), jenis: "order_paid", nomor };
}

async function sisipkan(sent: boolean, menitLalu: number, nomor: string | null = null) {
  await sql`
    insert into email_notifications (kind, order_no, sent, error, created_at)
    values (
      ${nomor ? "order_paid" : "test"}, ${nomor}, ${sent}, ${sent ? null : "E_GAGAL"},
      now() - make_interval(mins => ${menitLalu})
    )
  `;
}

describe("kirimDanCatat", () => {
  it("mencatat email yang terkirim beserta jenis dan nomor pesanannya", async () => {
    expect(await kirimDanCatat(sql, berhasil(), emailBayar("MNK-1"))).toEqual({ ok: true });

    const baris = await sql`select kind, order_no, sent, error from email_notifications`;
    expect([...baris]).toEqual([{ kind: "order_paid", order_no: "MNK-1", sent: true, error: null }]);
  });

  it("mencatat email yang gagal beserta alasan dari pengirim", async () => {
    const hasil = await kirimDanCatat(sql, gagal("E_SENDER_DOMAIN_NOT_AVAILABLE"), emailUji(TOKO));

    expect(hasil).toEqual({ ok: false, pesan: "E_SENDER_DOMAIN_NOT_AVAILABLE" });

    const baris = await sql`select kind, order_no, sent, error from email_notifications`;
    expect([...baris]).toEqual([
      { kind: "test", order_no: null, sent: false, error: "E_SENDER_DOMAIN_NOT_AVAILABLE" },
    ]);
  });

  it("alasan kosong diganti keterangan, alasan panjang dipotong", async () => {
    await kirimDanCatat(sql, gagal("   "), emailUji(TOKO));
    await kirimDanCatat(sql, gagal("x".repeat(900)), emailUji(TOKO));

    const baris = await sql<{ error: string }[]>`select error from email_notifications order by id`;
    expect(baris[0].error).toBe("Tanpa keterangan");
    expect(baris[1].error).toHaveLength(PANJANG_GALAT_EMAIL);
  });

  it("kegagalan mencatat tidak mengubah hasil kiriman", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const rusak = { ...emailUji(TOKO), jenis: "lainnya" } as unknown as IsiEmail;

    expect(await kirimDanCatat(sql, berhasil(), rusak)).toEqual({ ok: true });
    expect((await sql`select id from email_notifications`).length).toBe(0);
  });
});

describe("kabarkan", () => {
  it("membuka koneksi sendiri untuk mencatat, supaya bisa jalan setelah respons terkirim", async () => {
    expect(await kabarkan({ DATABASE_URL: urlTes() }, berhasil(), emailBayar("MNK-2"))).toEqual({ ok: true });

    const baris = await sql`select order_no, sent from email_notifications`;
    expect([...baris]).toEqual([{ order_no: "MNK-2", sent: true }]);
  });
});

describe("statusKirimEmail", () => {
  it("riwayat terbaru di atas dan dibatasi", async () => {
    await sisipkan(true, 30, "MNK-LAMA");
    await sisipkan(false, 20, "MNK-TENGAH");
    await sisipkan(true, 10, "MNK-BARU");

    const status = await statusKirimEmail(sql, 2);

    expect(status.riwayat.map((r) => r.order_no)).toEqual(["MNK-BARU", "MNK-TENGAH"]);
    expect(status.riwayat[1]).toMatchObject({ kind: "order_paid", sent: false, error: "E_GAGAL" });
    expect(new Date(status.riwayat[0].created_at).toISOString()).toBe(status.riwayat[0].created_at);
  });

  it("gagal beruntun dihitung sejak email terakhir yang terkirim", async () => {
    await sisipkan(false, 40);
    await sisipkan(true, 30);
    await sisipkan(false, 20);
    await sisipkan(false, 10);

    expect((await statusKirimEmail(sql)).gagalBeruntun).toBe(2);
  });

  it("satu email yang terkirim menghapus peringatan gagal", async () => {
    await sisipkan(false, 20);
    await sisipkan(true, 10);

    expect((await statusKirimEmail(sql)).gagalBeruntun).toBe(0);
  });

  it("kalau belum pernah ada yang terkirim, semua kegagalan dihitung", async () => {
    await sisipkan(false, 20);
    await sisipkan(false, 10);

    expect((await statusKirimEmail(sql)).gagalBeruntun).toBe(2);
  });

  it("kosong kalau belum ada catatan", async () => {
    expect(await statusKirimEmail(sql)).toEqual({ riwayat: [], gagalBeruntun: 0 });
  });
});

describe("sapuCatatanEmail", () => {
  it("menghapus catatan yang lebih tua dari 90 hari", async () => {
    await sisipkan(true, 91 * 24 * 60, "MNK-LAMA");
    await sisipkan(true, 89 * 24 * 60, "MNK-89");
    await sisipkan(true, 5, "MNK-BARU");

    expect(await sapuCatatanEmail(sql)).toBe(1);

    const sisa = await sql<{ order_no: string }[]>`select order_no from email_notifications order by order_no`;
    expect(sisa.map((s) => s.order_no)).toEqual(["MNK-89", "MNK-BARU"]);
  });
});
