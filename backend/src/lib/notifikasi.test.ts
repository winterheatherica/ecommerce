import { afterEach, describe, expect, it, vi } from "vitest";

import type { Pesanan } from "../db/pesanan";
import {
  bacaKonfigEmail,
  emailPerluDicek,
  emailPesananDibayar,
  emailUji,
  kirimEmail,
  samarkanEmail,
  type PengirimEmail,
} from "./notifikasi";

const TOKO = "https://menikstore.my.id";

function pesanan(ubah: Partial<Pesanan> = {}): Pesanan {
  return {
    id: 7,
    order_no: "MNK-482917365520",
    user_id: 3,
    account_email: "rafii@contoh.test",
    customer_name: "Rafii Anindito",
    phone: "082111413740",
    email: "rafii@contoh.test",
    address: "Jl. Buni RT 01/04 No. 24",
    notes: null,
    dest_id: "50001",
    dest_label: "MUNJUL, CIPAYUNG, JAKARTA TIMUR, DKI JAKARTA",
    dest_postal_code: "13850",
    courier: "JNE",
    service: "REG",
    etd: "1",
    weight_g: 150,
    subtotal: 35000,
    shipping_cost: 10000,
    total: 45000,
    status: "PAID",
    payment_reference: null,
    payment_url: null,
    payment_channel: "DOKU",
    expires_at: null,
    payment_method: "BNI Virtual Account",
    tracking_number: null,
    tracking: null,
    tracking_checked_at: null,
    tracking_error: null,
    created_at: "2026-10-22T11:50:00.000Z",
    paid_at: "2026-10-22T12:05:00.000Z",
    shipped_at: null,
    delivered_at: null,
    items: [
      {
        product_id: 1,
        slug: "ogoant-gel",
        product_active: true,
        variant_slug: "ogoant-gel-70g",
        sku: null,
        name_snapshot: "O'Goant Gel 70g",
        qty: 1,
        price_snapshot: 35000,
        list_price_snapshot: null,
        weight_g: 70,
        package_weight_g: 150,
        package_length_cm: null,
        package_width_cm: null,
        package_height_cm: null,
      },
    ],
    ...ubah,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("bacaKonfigEmail", () => {
  const pengirim: PengirimEmail = { send: async () => ({}) };

  it("aktif hanya kalau binding, alamat pengirim, dan penerima ketiganya ada", () => {
    expect(bacaKonfigEmail({})).toBeUndefined();
    expect(bacaKonfigEmail({ EMAIL: pengirim, EMAIL_PENGIRIM: "notifikasi@menikstore.my.id" })).toBeUndefined();
    expect(bacaKonfigEmail({ EMAIL: pengirim, EMAIL_NOTIFIKASI: "a@contoh.test" })).toBeUndefined();
    expect(
      bacaKonfigEmail({ EMAIL_PENGIRIM: "notifikasi@menikstore.my.id", EMAIL_NOTIFIKASI: "a@contoh.test" }),
    ).toBeUndefined();
  });

  it("penerima boleh lebih dari satu, dipisah koma", () => {
    const konfig = bacaKonfigEmail({
      EMAIL: pengirim,
      EMAIL_PENGIRIM: " notifikasi@menikstore.my.id ",
      EMAIL_NOTIFIKASI: "a@contoh.test, b@contoh.test,",
      STOREFRONT_URL: "https://menikstore.my.id/",
    });

    expect(konfig).toMatchObject({
      dari: "notifikasi@menikstore.my.id",
      ke: ["a@contoh.test", "b@contoh.test"],
      toko: "https://menikstore.my.id",
    });
  });
});

describe("samarkanEmail", () => {
  it("menyisakan dua huruf depan dan domainnya", () => {
    expect(samarkanEmail("rina.kartika@gmail.com")).toBe("ri••••••••••@gmail.com");
    expect(samarkanEmail("ab@x.id")).toBe("ab•••@x.id");
  });
});

describe("emailPesananDibayar", () => {
  it("memuat nomor, total, barang, alamat kirim, kurir, dan link admin", () => {
    const isi = emailPesananDibayar(pesanan(), TOKO);

    expect(isi.subjek).toBe("Pesanan dibayar: MNK-482917365520 (Rp45.000)");
    expect(isi.teks).toContain("Total: Rp45.000 lewat BNI Virtual Account");
    expect(isi.teks).toContain("1× O'Goant Gel 70g (Rp35.000)");
    expect(isi.teks).toContain("Jl. Buni RT 01/04 No. 24");
    expect(isi.teks).toContain("MUNJUL, CIPAYUNG, JAKARTA TIMUR, DKI JAKARTA 13850");
    expect(isi.teks).toContain("Kurir: JNE REG, 150 g");
    expect(isi.teks).toContain("https://menikstore.my.id/admin/pesanan");
  });

  it("jam bayar ditulis dalam WIB", () => {
    expect(emailPesananDibayar(pesanan(), TOKO).teks).toContain("19.05 WIB");
  });

  it("catatan pembeli hanya muncul kalau diisi", () => {
    expect(emailPesananDibayar(pesanan(), TOKO).teks).not.toContain("Catatan pembeli");
    expect(emailPesananDibayar(pesanan({ notes: "Titip di pos satpam" }), TOKO).teks).toContain(
      "Catatan pembeli:\nTitip di pos satpam",
    );
  });

  it("isian dari pembeli di-escape di versi HTML", () => {
    const isi = emailPesananDibayar(
      pesanan({ customer_name: '<script>alert("x")</script>', notes: "Titip <b>satpam</b>" }),
      TOKO,
    );

    expect(isi.html).not.toContain("<script>");
    expect(isi.html).toContain("&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;");
    expect(isi.html).toContain("Titip &lt;b&gt;satpam&lt;/b&gt;");
  });
});

describe("emailPerluDicek", () => {
  it("nominal yang beda menyebut kedua angkanya", () => {
    const isi = emailPerluDicek({ jenis: "nominal_beda", nomor: "MNK-1", dibayar: 40000, total: 45000 }, TOKO);

    expect(isi.subjek).toBe("Perlu dicek: pembayaran MNK-1 tidak tercatat otomatis");
    expect(isi.teks).toContain("sebesar Rp40.000, padahal total pesanannya Rp45.000");
  });

  it("menyebut keadaan pesanan yang membuatnya tidak bisa ditandai lunas", () => {
    expect(emailPerluDicek({ jenis: "gagal_tandai", nomor: "MNK-1", status: "EXPIRED" }, TOKO).teks).toContain(
      "pesanannya sudah kedaluwarsa",
    );
    expect(emailPerluDicek({ jenis: "gagal_tandai", nomor: "MNK-1", status: null }, TOKO).teks).toContain(
      "pesanannya tidak ditemukan",
    );
  });
});

describe("kirimEmail", () => {
  const konfig = (send: PengirimEmail["send"]) => ({
    pengirim: { send },
    dari: "notifikasi@menikstore.my.id",
    ke: ["a@contoh.test", "b@contoh.test"],
    toko: TOKO,
  });

  it("mengirim atas nama Menik Store ke semua penerima", async () => {
    const send = vi.fn(async () => ({ messageId: "1" }));

    expect(await kirimEmail(konfig(send), emailUji(TOKO))).toEqual({ ok: true });
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        from: { name: "Menik Store", email: "notifikasi@menikstore.my.id" },
        to: ["a@contoh.test", "b@contoh.test"],
        subject: "Uji notifikasi Menik Store",
      }),
    );
  });

  it("kegagalan mengirim dilaporkan tanpa melempar error", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const send = vi.fn(async () => {
      throw new Error("E_RECIPIENT_NOT_ALLOWED");
    });

    expect(await kirimEmail(konfig(send), emailUji(TOKO))).toEqual({
      ok: false,
      pesan: "E_RECIPIENT_NOT_ALLOWED",
    });
  });
});
