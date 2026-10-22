import { describe, expect, it } from "vitest";

import type { Pesanan } from "../db/pesanan";
import type { Lacak } from "./lacak";
import {
  aksesPesanan,
  samarkanHp,
  samarkanLacak,
  samarkanNama,
  untukPublik,
} from "./privasi-pesanan";

function pesanan(ubah: Partial<Pesanan> = {}): Pesanan {
  return {
    id: 7,
    order_no: "MNK-482917365520",
    user_id: null,
    account_email: null,
    customer_name: "Rafii Anindito",
    phone: "0821-1141-3740",
    email: "rafii@contoh.test",
    address: "Jl. Buni RT 01/04 No. 24",
    notes: "Titip di pos satpam",
    dest_id: "50001",
    dest_label: "CIRACAS, JAKARTA TIMUR, DKI JAKARTA",
    dest_postal_code: "13720",
    courier: "JNE",
    service: "REG",
    etd: "1-2",
    weight_g: 70,
    subtotal: 35000,
    shipping_cost: 10000,
    total: 45000,
    status: "PAID",
    payment_reference: "token-rahasia",
    payment_url: "https://checkout.doku.com/checkout-link-v2/abc",
    payment_channel: "DOKU",
    expires_at: null,
    payment_method: "BNI Virtual Account",
    tracking_number: null,
    tracking: null,
    tracking_checked_at: null,
    tracking_error: null,
    created_at: "2026-10-19T03:00:00.000Z",
    paid_at: "2026-10-19T03:05:00.000Z",
    shipped_at: null,
    delivered_at: null,
    items: [],
    ...ubah,
  };
}

const LACAK_SAMPAI: Lacak = {
  delivered: true,
  receiver: "RAFII ANINDITO",
  delivered_at: "2026-10-21T08:40:00.000Z",
  status: "DELIVERED",
  events: [
    {
      at: "2026-10-21T08:40:00.000Z",
      description: "DELIVERED TO [RAFII ANINDITO | 21-10-2026 15:40 | JAKARTA ]",
      city: "JAKARTA",
    },
    {
      at: "2026-10-20T20:53:00.000Z",
      description: "WITH DELIVERY COURIER [CIPAYUNG ,JAKARTA TIMUR]",
      city: "JAKARTA",
    },
  ],
  fetched_at: "2026-10-21T09:00:00.000Z",
};

describe("aksesPesanan", () => {
  it("pesanan tamu selalu tampil tersamar, siapa pun yang membuka", () => {
    expect(aksesPesanan(null, null)).toBe("samar");
    expect(aksesPesanan(null, 3)).toBe("samar");
  });

  it("pesanan akun hanya terbuka penuh untuk pemiliknya", () => {
    expect(aksesPesanan(3, 3)).toBe("penuh");
    expect(aksesPesanan(3, null)).toBe("tolak");
    expect(aksesPesanan(3, 4)).toBe("tolak");
  });
});

describe("penyamaran", () => {
  it("nama: kata pertama dan inisial kata terakhir", () => {
    expect(samarkanNama("Rafii Anindito")).toBe("Rafii A.");
    expect(samarkanNama("  siti nur aisyah ")).toBe("siti A.");
    expect(samarkanNama("Rina")).toBe("Rina");
    expect(samarkanNama("")).toBe("");
  });

  it("nomor HP: empat digit depan dan empat digit belakang", () => {
    expect(samarkanHp("0821-1141-3740")).toBe("0821-****-3740");
    expect(samarkanHp("+62 821 1141 3740")).toBe("6282-****-3740");
    expect(samarkanHp("12345")).toBe("*****");
  });
});

describe("untukPublik", () => {
  it("versi tersamar membuang alamat jalan, email, catatan, dan link bayar", () => {
    const hasil = untukPublik(pesanan(), "samar");

    expect(hasil).toMatchObject({
      samar: true,
      customer_name: "Rafii A.",
      phone: "0821-****-3740",
      email: null,
      address: "",
      notes: null,
      payment_url: null,
      dest_label: "CIRACAS, JAKARTA TIMUR, DKI JAKARTA",
      total: 45000,
      status: "PAID",
    });
  });

  it("id pemilik, email akun, dan token DOKU tidak pernah ikut keluar, bahkan untuk pemiliknya", () => {
    for (const akses of ["samar", "penuh"] as const) {
      const hasil = untukPublik(pesanan({ user_id: 3, account_email: "rafii@gmail.test" }), akses);

      expect("user_id" in hasil, akses).toBe(false);
      expect("account_email" in hasil, akses).toBe(false);
      expect("payment_reference" in hasil, akses).toBe(false);
    }
  });

  it("pemilik melihat data lengkapnya", () => {
    const hasil = untukPublik(pesanan({ user_id: 3 }), "penuh");

    expect(hasil).toMatchObject({
      samar: false,
      customer_name: "Rafii Anindito",
      phone: "0821-1141-3740",
      address: "Jl. Buni RT 01/04 No. 24",
      notes: "Titip di pos satpam",
    });
  });

  it("pesan galat lacak tidak ikut keluar, siapa pun yang membuka", () => {
    for (const akses of ["samar", "penuh"] as const) {
      const hasil = untukPublik(pesanan({ tracking_error: "AWB not found" }), akses);
      expect("tracking_error" in hasil, akses).toBe(false);
    }
  });

  it("versi tersamar ikut menyamarkan nama penerima di riwayat kurir", () => {
    const hasil = untukPublik(pesanan({ status: "SHIPPED", tracking: LACAK_SAMPAI }), "samar");

    expect(hasil.tracking?.receiver).toBe("RAFII A.");
    expect(hasil.tracking?.events[0].description).toBe(
      "DELIVERED TO [RAFII A. | 21-10-2026 15:40 | JAKARTA ]",
    );
    expect(JSON.stringify(hasil.tracking)).not.toContain("ANINDITO");
  });

  it("pemilik melihat riwayat kurir apa adanya", () => {
    const hasil = untukPublik(
      pesanan({ user_id: 3, status: "SHIPPED", tracking: LACAK_SAMPAI }),
      "penuh",
    );

    expect(hasil.tracking).toEqual(LACAK_SAMPAI);
  });
});

describe("samarkanLacak", () => {
  it("menyamarkan nama pembeli juga, meski ditulis kurir dengan huruf dan spasi berbeda", () => {
    const hasil = samarkanLacak(
      {
        ...LACAK_SAMPAI,
        receiver: "SATPAM",
        events: [{ at: null, description: "DITERIMA OLEH rafii  anindito (SATPAM)", city: null }],
      },
      ["SATPAM", "Rafii Anindito"],
    );

    expect(hasil.receiver).toBe("SATPAM");
    expect(hasil.events[0].description).toBe("DITERIMA OLEH Rafii A. (SATPAM)");
  });

  it("nama yang terlalu pendek tidak dipakai sebagai pola", () => {
    const hasil = samarkanLacak(
      { ...LACAK_SAMPAI, receiver: "AB", events: [{ at: null, description: "ABADI JAYA", city: null }] },
      ["AB"],
    );

    expect(hasil.events[0].description).toBe("ABADI JAYA");
  });
});
