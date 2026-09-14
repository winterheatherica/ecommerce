import { describe, expect, it } from "vitest";

import { kiloBulat } from "../db/ongkir";
import {
  KURIR_BAWAAN,
  cariOpsi,
  kurirDipakai,
  petakanOpsi,
  pilihTerbaik,
  rapikanEtd,
  type OpsiOngkir,
} from "./shipping";
import type { OpsiRO } from "./rajaongkir";

function mentah(ubah: Partial<OpsiRO> = {}): OpsiRO {
  return {
    name: "JNE",
    code: "jne",
    service: "REG",
    description: "Layanan Reguler",
    cost: 12000,
    etd: "2-3 day",
    ...ubah,
  };
}

describe("petakanOpsi", () => {
  it("mengubah bentuk RajaOngkir jadi bentuk kita", () => {
    const [o] = petakanOpsi([mentah()]);

    expect(o).toEqual({
      courier: "JNE",
      service: "REG",
      cost: 12000,
      etd: "2-3 hari",
    });
  });

  it("mengurutkan dari yang termurah", () => {
    const hasil = petakanOpsi([
      mentah({ service: "YES", cost: 30000 }),
      mentah({ service: "REG", cost: 12000 }),
      mentah({ service: "OKE", cost: 9000 }),
    ]);

    expect(hasil.map((o) => o.cost)).toEqual([9000, 12000, 30000]);
  });

  it("membuang layanan tanpa tarif", () => {
    const hasil = petakanOpsi([
      mentah({ service: "REG", cost: 12000 }),
      mentah({ service: "KOSONG", cost: 0 }),
    ]);

    expect(hasil).toHaveLength(1);
    expect(hasil[0].service).toBe("REG");
  });

  it("memakai kode kurir, bukan nama hukumnya yang panjang", () => {
    const [o] = petakanOpsi([
      mentah({ name: "Jalur Nugraha Ekakurir (JNE)", code: "jne" }),
    ]);

    expect(o.courier).toBe("JNE");
  });
});

describe("rapikanEtd", () => {
  it("membuang satuan bahasa Inggris dan memakai bahasa kita", () => {
    expect(rapikanEtd("2-3 day")).toBe("2-3 hari");
    expect(rapikanEtd("1 days")).toBe("1 hari");
    expect(rapikanEtd("4")).toBe("4 hari");
  });

  it("menerjemahkan nol jadi hari ini", () => {
    expect(rapikanEtd("0 day")).toBe("hari ini");
  });

  it("memberi tanda hubung kalau kosong", () => {
    expect(rapikanEtd("   ")).toBe("-");
    expect(rapikanEtd(null)).toBe("-");
  });

  it("tidak menggandakan kata hari", () => {
    expect(rapikanEtd("2 hari")).toBe("2 hari");
  });
});

describe("cariOpsi", () => {
  const daftar: OpsiOngkir[] = [
    { courier: "JNE", service: "REG", cost: 12000, etd: "2-3" },
    { courier: "SiCepat", service: "BEST", cost: 15000, etd: "1-2" },
  ];

  it("menemukan kombinasi kurir dan layanan yang cocok", () => {
    expect(cariOpsi(daftar, "JNE", "REG")?.cost).toBe(12000);
  });

  it("menolak layanan yang tidak dimiliki kurir itu", () => {
    expect(cariOpsi(daftar, "JNE", "BEST")).toBeNull();
  });

  it("menolak kurir yang tidak dikenal", () => {
    expect(cariOpsi(daftar, "Ninja", "REG")).toBeNull();
  });

  it("menolak dari daftar kosong", () => {
    expect(cariOpsi([], "JNE", "REG")).toBeNull();
  });
});

describe("kurirDipakai", () => {
  it("memakai daftar bawaan kalau tidak diatur", () => {
    expect(kurirDipakai({})).toBe(KURIR_BAWAAN);
    expect(kurirDipakai({ RAJAONGKIR_KURIR: "   " })).toBe(KURIR_BAWAAN);
  });

  it("memakai daftar dari lingkungan kalau diisi", () => {
    expect(kurirDipakai({ RAJAONGKIR_KURIR: " jne:pos " })).toBe("jne:pos");
  });
});

describe("kiloBulat", () => {
  it("membulatkan ke atas per kilogram", () => {
    expect(kiloBulat(1)).toBe(1);
    expect(kiloBulat(999)).toBe(1);
    expect(kiloBulat(1000)).toBe(1);
    expect(kiloBulat(1001)).toBe(2);
    expect(kiloBulat(2500)).toBe(3);
  });

  it("tidak pernah nol, supaya kunci cache selalu sah", () => {
    expect(kiloBulat(0)).toBe(1);
  });

  it("berat di bawah 1 kg berbagi kunci cache yang sama", () => {
    expect(kiloBulat(50)).toBe(kiloBulat(950));
  });
});

describe("pilihTerbaik", () => {
  const banyak: OpsiOngkir[] = Array.from({ length: 12 }, (_, i) => ({
    courier: "JNE",
    service: `S${i}`,
    cost: (i + 1) * 1000,
    etd: "1 hari",
  }));

  it("hanya menampilkan enam termurah", () => {
    const hasil = pilihTerbaik(banyak);

    expect(hasil).toHaveLength(6);
    expect(hasil.at(-1)?.cost).toBe(6000);
  });

  it("membuang layanan kargo yang jauh lebih mahal", () => {
    const hasil = pilihTerbaik(banyak);

    expect(hasil.some((o) => o.cost >= 300000)).toBe(false);
  });

  it("membiarkan daftar pendek apa adanya", () => {
    expect(pilihTerbaik(banyak.slice(0, 3))).toHaveLength(3);
  });
});
