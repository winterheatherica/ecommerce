import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Sql } from "../lib/db";
import { PESAN_JATAH_LACAK, type LacakResi } from "../lib/lacak";
import type { HasilRO, LacakRO } from "../lib/rajaongkir";
import type { OpsiOngkir } from "../lib/shipping";
import { bersihkan, koneksiTes } from "../test/db";
import {
  lacakTerjadwal,
  perbaruiLacak,
  segarkanLacak,
  selesaikanOtomatis,
  targetTerjadwal,
} from "./lacak";
import {
  ambilPesanan,
  buatPesanan,
  tandaiDikirim,
  tandaiTerbayar,
  ubahResi,
  type CariOngkir,
  type Pesanan,
} from "./pesanan";

const sql: Sql = koneksiTes();
const ONGKIR: OpsiOngkir[] = [{ courier: "JNE", service: "CTC", cost: 9000, etd: "1-2" }];
const cariOngkir: CariOngkir = async () => ONGKIR;
const RESI = "300380022869426";

const SAMPAI: LacakRO = {
  delivered: true,
  summary: { status: "DELIVERED" },
  delivery_status: {
    status: "DELIVERED",
    pod_receiver: "RAFII ANINDITO",
    pod_date: "2026-10-21",
    pod_time: "15:40",
  },
  manifest: [
    {
      manifest_description: "DELIVERED TO [RAFII ANINDITO | 21-10-2026 15:40 | JAKARTA ]",
      manifest_date: "2026-10-21",
      manifest_time: "15:40",
      city_name: "JAKARTA",
    },
    {
      manifest_description: "WITH DELIVERY COURIER [CIPAYUNG ,JAKARTA TIMUR]",
      manifest_date: "2026-10-21",
      manifest_time: "03:53",
      city_name: "JAKARTA",
    },
  ],
};

const JALAN: LacakRO = {
  delivered: false,
  delivery_status: { status: "ON PROCESS" },
  manifest: [SAMPAI.manifest![1]],
};

function pelacakUji(...jawaban: HasilRO<LacakRO>[]) {
  const antrean = [...jawaban];
  return vi.fn<LacakResi>(async () => antrean.shift() ?? { ok: true, data: JALAN });
}

beforeEach(async () => {
  await bersihkan(sql);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

afterAll(async () => {
  await sql.end();
});

let urutan = 0;

async function pesananDikirim(resi: string | null = RESI): Promise<Pesanan> {
  urutan += 1;
  const hasil = await buatPesanan(
    sql,
    {
      customer_name: "Rafii Anindito",
      phone: `0821-1141-${String(3700 + urutan).padStart(4, "0")}`,
      email: `rafii${urutan}@contoh.test`,
      address: "Jl. Buni RT 01/04 No. 24",
      dest_id: "50001",
      courier: "JNE",
      service: "CTC",
      items: [{ slug: "bye-bye-cat-50g", qty: 1 }],
    },
    1,
    cariOngkir,
  );

  if (!hasil.ok) throw new Error(`Gagal membuat pesanan: ${hasil.badan.error}`);

  const nomor = hasil.pesanan.order_no;
  await tandaiTerbayar(sql, nomor, "BNI_VA");
  if (resi) await tandaiDikirim(sql, nomor, resi);

  return (await ambilPesanan(sql, nomor))!;
}

async function mundurkanCek(nomor: string, jam: number): Promise<void> {
  await sql`
    update orders set tracking_checked_at = now() - make_interval(hours => ${jam})
    where order_no = ${nomor}
  `;
}

describe("perbaruiLacak", () => {
  it("menyimpan riwayat kurir dan mengirim kode kurir serta 5 digit HP", async () => {
    const p = await pesananDikirim();
    const lacak = pelacakUji({ ok: true, data: JALAN });

    expect(await perbaruiLacak(sql, p, lacak, { jedaJam: 3 })).toBe("diperbarui");
    expect(lacak).toHaveBeenCalledWith(RESI, "jne", p.phone.replace(/\D/g, "").slice(-5));

    const sesudah = (await ambilPesanan(sql, p.order_no))!;
    expect(sesudah.tracking?.events).toHaveLength(1);
    expect(sesudah.tracking?.delivered).toBe(false);
    expect(sesudah.tracking_checked_at).not.toBeNull();
    expect(sesudah.delivered_at).toBeNull();
    expect(sesudah.status).toBe("SHIPPED");
  });

  it("tidak memanggil kurir lagi sebelum jeda lewat", async () => {
    const p = await pesananDikirim();
    const lacak = pelacakUji();

    await perbaruiLacak(sql, p, lacak, { jedaJam: 3 });
    expect(await perbaruiLacak(sql, p, lacak, { jedaJam: 3 })).toBe("dilewati");
    expect(lacak).toHaveBeenCalledTimes(1);

    await mundurkanCek(p.order_no, 4);
    expect(await perbaruiLacak(sql, p, lacak, { jedaJam: 3 })).toBe("diperbarui");
    expect(lacak).toHaveBeenCalledTimes(2);
  });

  it("dua permintaan bersamaan hanya memanggil kurir sekali", async () => {
    const p = await pesananDikirim();
    const lacak = pelacakUji();

    const hasil = await Promise.all([
      perbaruiLacak(sql, p, lacak, { jedaJam: 3 }),
      perbaruiLacak(sql, p, lacak, { jedaJam: 3 }),
    ]);

    expect(hasil.sort()).toEqual(["dilewati", "diperbarui"]);
    expect(lacak).toHaveBeenCalledTimes(1);
  });

  it("paket sampai: jam terima tercatat dan pelacakan berhenti", async () => {
    const p = await pesananDikirim();
    const lacak = pelacakUji({ ok: true, data: SAMPAI });

    expect(await perbaruiLacak(sql, p, lacak, { jedaJam: 3 })).toBe("diperbarui");

    const sesudah = (await ambilPesanan(sql, p.order_no))!;
    expect(sesudah.delivered_at).toBe("2026-10-21T08:40:00.000Z");
    expect(sesudah.tracking?.receiver).toBe("RAFII ANINDITO");
    expect(sesudah.status).toBe("SHIPPED");

    await mundurkanCek(p.order_no, 24);
    expect(await perbaruiLacak(sql, sesudah, lacak, { jedaJam: 3 })).toBe("dilewati");
    expect(lacak).toHaveBeenCalledTimes(1);
  });

  it("gagal dari kurir dicatat tanpa menghapus riwayat sebelumnya", async () => {
    const p = await pesananDikirim();
    const lacak = pelacakUji(
      { ok: true, data: JALAN },
      { ok: false, status: 404, pesan: "Waybill not found" },
    );
    vi.spyOn(console, "warn").mockImplementation(() => {});

    await perbaruiLacak(sql, p, lacak, { jedaJam: 3 });
    await mundurkanCek(p.order_no, 4);
    expect(await perbaruiLacak(sql, p, lacak, { jedaJam: 3 })).toBe("gagal");

    const sesudah = (await ambilPesanan(sql, p.order_no))!;
    expect(sesudah.tracking_error).toBe("Waybill not found");
    expect(sesudah.tracking?.events).toHaveLength(1);
  });

  it("berhasil lagi setelah gagal menghapus catatan galat", async () => {
    const p = await pesananDikirim();
    const lacak = pelacakUji({ ok: false, status: 404, pesan: "Waybill not found" }, { ok: true, data: JALAN });
    vi.spyOn(console, "warn").mockImplementation(() => {});

    await perbaruiLacak(sql, p, lacak, { jedaJam: 3 });
    await mundurkanCek(p.order_no, 4);
    await perbaruiLacak(sql, p, lacak, { jedaJam: 3 });

    expect((await ambilPesanan(sql, p.order_no))!.tracking_error).toBeNull();
  });

  it("jatah habis: kurir tidak dipanggil dan alasannya dicatat", async () => {
    const p = await pesananDikirim();
    const lacak = pelacakUji();

    expect(await perbaruiLacak(sql, p, lacak, { jedaJam: 3, jaga: async () => false })).toBe("dibatasi");
    expect(lacak).not.toHaveBeenCalled();
    expect((await ambilPesanan(sql, p.order_no))!.tracking_error).toBe(PESAN_JATAH_LACAK);
  });

  it("pesanan yang belum dikirim tidak pernah dilacak", async () => {
    const p = await pesananDikirim(null);
    const lacak = pelacakUji();

    expect(await perbaruiLacak(sql, { ...p, tracking_number: RESI }, lacak, { jedaJam: 3 })).toBe("dilewati");
    expect(lacak).not.toHaveBeenCalled();
  });

  it("hasil lacak resi lama tidak menimpa resi yang baru diganti admin", async () => {
    const p = await pesananDikirim();
    const lacak = vi.fn<LacakResi>(async () => {
      await ubahResi(sql, p.order_no, "300380099999999");
      return { ok: true, data: SAMPAI };
    });

    await perbaruiLacak(sql, p, lacak, { jedaJam: 3 });

    const sesudah = (await ambilPesanan(sql, p.order_no))!;
    expect(sesudah.tracking_number).toBe("300380099999999");
    expect(sesudah.tracking).toBeNull();
    expect(sesudah.delivered_at).toBeNull();
  });
});

describe("ubahResi", () => {
  it("mengganti resi dan mengosongkan data lacak lama", async () => {
    const p = await pesananDikirim();
    await perbaruiLacak(sql, p, pelacakUji({ ok: true, data: SAMPAI }), { jedaJam: 3 });

    const hasil = await ubahResi(sql, p.order_no, " 300380011111111 ");

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(hasil.pesanan).toMatchObject({
      tracking_number: "300380011111111",
      tracking: null,
      tracking_checked_at: null,
      tracking_error: null,
      delivered_at: null,
      status: "SHIPPED",
    });
  });

  it("hanya untuk pesanan yang sedang dikirim", async () => {
    const p = await pesananDikirim(null);
    expect(await ubahResi(sql, p.order_no, RESI)).toEqual({
      ok: false,
      alasan: "invalid_status",
      status: "PAID",
    });
  });
});

describe("selesaikanOtomatis", () => {
  it("menyelesaikan pesanan 48 jam setelah paket diterima, tidak lebih cepat", async () => {
    const lama = await pesananDikirim();
    const baru = await pesananDikirim();
    const belum = await pesananDikirim();

    await sql`update orders set delivered_at = now() - interval '49 hours' where order_no = ${lama.order_no}`;
    await sql`update orders set delivered_at = now() - interval '47 hours' where order_no = ${baru.order_no}`;

    expect(await selesaikanOtomatis(sql)).toEqual([lama.order_no]);

    expect((await ambilPesanan(sql, lama.order_no))!.status).toBe("DELIVERED");
    expect((await ambilPesanan(sql, baru.order_no))!.status).toBe("SHIPPED");
    expect((await ambilPesanan(sql, belum.order_no))!.status).toBe("SHIPPED");
    expect(await selesaikanOtomatis(sql)).toEqual([]);
  });
});

describe("pelacakan terjadwal", () => {
  it("memilih yang belum pernah dicek dulu, melewatkan yang baru dicek, sudah sampai, atau terlalu lama", async () => {
    const pernah = await pesananDikirim();
    const belumPernah = await pesananDikirim();
    const baruDicek = await pesananDikirim();
    const sampai = await pesananDikirim();
    const kuno = await pesananDikirim();
    await pesananDikirim(null);

    await mundurkanCek(pernah.order_no, 13);
    await mundurkanCek(baruDicek.order_no, 2);
    await sql`update orders set delivered_at = now() where order_no = ${sampai.order_no}`;
    await sql`update orders set shipped_at = now() - interval '31 days' where order_no = ${kuno.order_no}`;

    const target = await targetTerjadwal(sql);
    expect(target.map((t) => t.order_no)).toEqual([belumPernah.order_no, pernah.order_no]);
  });

  it("berhenti begitu jatah habis", async () => {
    await pesananDikirim();
    await pesananDikirim();
    await pesananDikirim();
    const lacak = pelacakUji();
    let sisa = 1;

    const hasil = await lacakTerjadwal(sql, lacak, async () => sisa-- > 0);

    expect(hasil).toEqual({ diperbarui: 1, dilewati: 0, dibatasi: 1, gagal: 0 });
    expect(lacak).toHaveBeenCalledTimes(1);
  });
});

describe("segarkanLacak", () => {
  const ENV = { RAJAONGKIR_API_KEY: "kunci-uji", RAJAONGKIR_ORIGIN_ID: "17485" };

  it("mengambil data kurir lewat RajaOngkir lalu mengembalikan pesanan terbaru", async () => {
    const p = await pesananDikirim();
    vi.stubGlobal("fetch", vi.fn(async () =>
      new Response(JSON.stringify({ meta: { status: "success" }, data: SAMPAI }), { status: 200 }),
    ));

    const hasil = await segarkanLacak(sql, ENV, p);

    expect(hasil.tracking?.delivered).toBe(true);
    expect(hasil.delivered_at).toBe("2026-10-21T08:40:00.000Z");
  });

  it("tanpa kunci RajaOngkir, pesanan dikembalikan apa adanya", async () => {
    const p = await pesananDikirim();
    const tangkap = vi.fn();
    vi.stubGlobal("fetch", tangkap);

    expect(await segarkanLacak(sql, {}, p)).toBe(p);
    expect(tangkap).not.toHaveBeenCalled();
    expect((await ambilPesanan(sql, p.order_no))!.tracking_checked_at).toBeNull();
  });

  it("galat database tidak menggagalkan halaman pesanan", async () => {
    const p = await pesananDikirim();
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(await segarkanLacak(sql, ENV, { ...p, id: Number.NaN })).toMatchObject({ order_no: p.order_no });
  });
});
