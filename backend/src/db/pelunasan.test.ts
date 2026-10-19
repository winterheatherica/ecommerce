import { afterAll, beforeEach, describe, expect, it } from "vitest";

import type { Sql } from "../lib/db";
import type { KabarDoku, KonfigDoku } from "../lib/doku";
import type { OpsiOngkir } from "../lib/shipping";
import { bersihkan, koneksiTes } from "../test/db";
import {
  periksaKeDoku,
  periksaTertundaKeDoku,
  terapkanKabarDoku,
  type CekStatus,
} from "./pelunasan";
import {
  ambilPesanan,
  buatPesanan,
  cariPesanan,
  sapuKedaluwarsa,
  simpanPembayaran,
  tandaiTerbayar,
  type CariOngkir,
} from "./pesanan";

const sql: Sql = koneksiTes();
const KONFIG: KonfigDoku = { clientId: "BRN-1", secretKey: "SK-1", sandbox: true };
const ONGKIR: OpsiOngkir[] = [{ courier: "JNE", service: "REG", cost: 9000, etd: "1-2" }];
const cariOngkir: CariOngkir = async () => ONGKIR;
const KUCING = "bye-bye-cat-50g";
const TOTAL = 58000;

beforeEach(async () => {
  await bersihkan(sql);
});

afterAll(async () => {
  await sql.end();
});

let urutan = 0;

async function buat(): Promise<string> {
  urutan += 1;
  const hasil = await buatPesanan(
    sql,
    {
      customer_name: "Rina Kartika",
      phone: `0812345${10000 + urutan}`,
      email: `rina${urutan}@contoh.test`,
      address: "Jl. Cihampelas No. 42, Bandung",
      dest_id: "50001",
      courier: "JNE",
      service: "REG",
      items: [{ slug: KUCING, qty: 1 }],
    },
    1,
    cariOngkir,
  );

  if (!hasil.ok) throw new Error(`Gagal membuat pesanan: ${hasil.badan.error}`);
  return hasil.pesanan.order_no;
}

async function pasangLinkDoku(nomor: string, menitLalu = 5): Promise<void> {
  await simpanPembayaran(sql, nomor, {
    reference: `token-${nomor}`,
    url: "https://checkout.doku.com/checkout-link-v2/abc",
    channel: "DOKU",
    method: null,
  });

  await sql`
    update orders set created_at = now() - make_interval(mins => ${menitLalu})
    where order_no = ${nomor}
  `;
}

async function lewatkanBatas(nomor: string): Promise<void> {
  await sql`update orders set expires_at = now() - interval '1 minute' where order_no = ${nomor}`;
}

async function stok(): Promise<number> {
  const [p] = await sql<{ stock: number }[]>`select stock from products where slug = ${KUCING}`;
  return p.stock;
}

async function status(nomor: string) {
  return (await ambilPesanan(sql, nomor))?.status;
}

function kabar(
  nomor: string,
  statusDoku: string,
  amount: number | string = TOTAL,
  channel = "VIRTUAL_ACCOUNT_BCA",
): KabarDoku {
  return {
    order: { invoice_number: nomor, amount },
    transaction: { status: statusDoku },
    channel: { id: channel },
  };
}

function dokuPalsu(jawaban: Record<string, KabarDoku | number>) {
  const ditanya: string[] = [];

  const cek: CekStatus = async (_konfig, invoice) => {
    ditanya.push(invoice);
    const isi = jawaban[invoice];

    if (isi === undefined) return { ok: false, status: 404, pesan: "tidak ada" };
    if (typeof isi === "number") return { ok: false, status: isi, pesan: "galat" };
    return { ok: true, data: isi };
  };

  return { cek, ditanya };
}

describe("terapkanKabarDoku", () => {
  it("SUCCESS dengan nominal yang sama menandai lunas dan mencatat banknya", async () => {
    const nomor = await buat();

    const hasil = await terapkanKabarDoku(sql, kabar(nomor, "SUCCESS"));

    expect(hasil).toEqual({ jenis: "lunas", nomor, baru: true });
    const pesanan = await ambilPesanan(sql, nomor);
    expect(pesanan?.status).toBe("PAID");
    expect(pesanan?.payment_method).toBe("BCA Virtual Account");
  });

  it("nominal yang ditulis sebagai teks desimal tetap dicocokkan", async () => {
    const nomor = await buat();

    const hasil = await terapkanKabarDoku(sql, kabar(nomor, "SUCCESS", "58000.00"));

    expect(hasil.jenis).toBe("lunas");
  });

  it("nominal berbeda ditolak dan pesanan tetap menunggu", async () => {
    const nomor = await buat();

    const hasil = await terapkanKabarDoku(sql, kabar(nomor, "SUCCESS", TOTAL - 1000));

    expect(hasil.jenis).toBe("nominal_beda");
    expect(await status(nomor)).toBe("PENDING");
  });

  it("EXPIRED membatalkan pesanan dan mengembalikan stok", async () => {
    const awal = await stok();
    const nomor = await buat();
    expect(await stok()).toBe(awal - 1);

    const hasil = await terapkanKabarDoku(sql, kabar(nomor, "EXPIRED"));

    expect(hasil.jenis).toBe("kedaluwarsa");
    expect(await status(nomor)).toBe("EXPIRED");
    expect(await stok()).toBe(awal);
  });

  it("status selain SUCCESS dan EXPIRED diabaikan", async () => {
    const nomor = await buat();

    for (const s of ["PENDING", "FAILED", "ORDER_GENERATED"]) {
      expect((await terapkanKabarDoku(sql, kabar(nomor, s))).jenis).toBe("diabaikan");
    }

    expect(await status(nomor)).toBe("PENDING");
  });

  it("kabar tanpa nomor invoice diabaikan", async () => {
    const hasil = await terapkanKabarDoku(sql, { transaction: { status: "SUCCESS" } });

    expect(hasil.jenis).toBe("diabaikan");
  });

  it("SUCCESS tetap diterima walau batas waktunya baru lewat, selama stoknya belum dikembalikan", async () => {
    const awal = await stok();
    const nomor = await buat();
    await lewatkanBatas(nomor);

    const hasil = await terapkanKabarDoku(sql, kabar(nomor, "SUCCESS"));

    expect(hasil.jenis).toBe("lunas");
    expect(await sapuKedaluwarsa(sql)).toEqual([]);
    expect(await status(nomor)).toBe("PAID");
    expect(await stok()).toBe(awal - 1);
  });

  it("pesanan yang sudah disapu kedaluwarsa tidak bisa ditandai lunas otomatis", async () => {
    const nomor = await buat();
    await lewatkanBatas(nomor);
    await cariPesanan(sql, nomor);

    const hasil = await terapkanKabarDoku(sql, kabar(nomor, "SUCCESS"));

    expect(hasil).toEqual({ jenis: "gagal_tandai", nomor, alasan: "invalid_status" });
    expect(await status(nomor)).toBe("EXPIRED");
  });

  it("kabar yang sama dua kali tidak dihitung lunas dua kali", async () => {
    const nomor = await buat();

    await terapkanKabarDoku(sql, kabar(nomor, "SUCCESS"));
    const kedua = await terapkanKabarDoku(sql, kabar(nomor, "SUCCESS", TOTAL, "QRIS"));

    expect(kedua).toEqual({ jenis: "lunas", nomor, baru: false });
    expect((await ambilPesanan(sql, nomor))?.payment_method).toBe("BCA Virtual Account");
  });
});

describe("periksaKeDoku", () => {
  it("jawaban DOKU untuk invoice lain tidak dipakai", async () => {
    const nomor = await buat();
    const lain = await buat();
    const { cek } = dokuPalsu({ [nomor]: kabar(lain, "SUCCESS") });

    expect(await periksaKeDoku(sql, KONFIG, nomor, cek)).toBeNull();
    expect(await status(nomor)).toBe("PENDING");
    expect(await status(lain)).toBe("PENDING");
  });

  it("invoice yang belum dikenal DOKU dilewati tanpa mengubah apa pun", async () => {
    const nomor = await buat();
    const { cek } = dokuPalsu({});

    expect(await periksaKeDoku(sql, KONFIG, nomor, cek)).toBeNull();
    expect(await status(nomor)).toBe("PENDING");
  });
});

describe("periksaTertundaKeDoku", () => {
  it("hanya menanyakan pesanan DOKU yang menunggu dan link bayarnya sudah lebih dari semenit", async () => {
    const lama = await buat();
    const baru = await buat();
    const tanpaLink = await buat();
    const sudahLunas = await buat();

    await pasangLinkDoku(lama, 5);
    await pasangLinkDoku(baru, 0);
    await pasangLinkDoku(sudahLunas, 5);
    await tandaiTerbayar(sql, sudahLunas, "QRIS");

    const { cek, ditanya } = dokuPalsu({ [lama]: kabar(lama, "SUCCESS") });
    const hasil = await periksaTertundaKeDoku(sql, KONFIG, cek);

    expect(ditanya).toEqual([lama]);
    expect(hasil).toEqual([{ jenis: "lunas", nomor: lama, baru: true }]);
    expect(await status(baru)).toBe("PENDING");
    expect(await status(tanpaLink)).toBe("PENDING");
  });

  it("galat DOKU di satu pesanan tidak menghentikan pesanan lain", async () => {
    const gagal = await buat();
    const berhasil = await buat();
    await pasangLinkDoku(gagal, 10);
    await pasangLinkDoku(berhasil, 5);

    const { cek, ditanya } = dokuPalsu({ [gagal]: 500, [berhasil]: kabar(berhasil, "SUCCESS") });
    await periksaTertundaKeDoku(sql, KONFIG, cek);

    expect(ditanya.sort()).toEqual([gagal, berhasil].sort());
    expect(await status(gagal)).toBe("PENDING");
    expect(await status(berhasil)).toBe("PAID");
  });

  it("menyelamatkan pesanan lunas yang batas waktunya lewat sebelum sempat disapu", async () => {
    const nomor = await buat();
    await pasangLinkDoku(nomor, 400);
    await lewatkanBatas(nomor);

    const { cek } = dokuPalsu({ [nomor]: kabar(nomor, "SUCCESS", TOTAL, "QRIS") });
    await periksaTertundaKeDoku(sql, KONFIG, cek);
    await sapuKedaluwarsa(sql);

    const pesanan = await ambilPesanan(sql, nomor);
    expect(pesanan?.status).toBe("PAID");
    expect(pesanan?.payment_method).toBe("QRIS");
  });
});
