import { describe, expect, it } from "vitest";

import {
  hariIniWib,
  jumlahHari,
  keCsv,
  labelMetode,
  periksaRentang,
  pilihKelompok,
  rentangSebelumnya,
  tanggalSah,
} from "./laporan";

const SEKARANG = new Date("2026-11-03T18:30:00Z");

describe("periode laporan", () => {
  it("memakai tanggal WIB, jadi lewat jam 17.00 UTC sudah hari berikutnya", () => {
    expect(hariIniWib(SEKARANG)).toBe("2026-11-04");
    expect(hariIniWib(new Date("2026-11-03T16:59:00Z"))).toBe("2026-11-03");
  });

  it("tanpa tanggal memakai 30 hari terakhir sampai hari ini", () => {
    expect(periksaRentang({}, SEKARANG)).toEqual({ ok: true, rentang: { dari: "2026-10-06", sampai: "2026-11-04" } });
    expect(periksaRentang({ all: "true" }, SEKARANG)).toEqual({ ok: true, rentang: null });
  });

  it("menolak tanggal yang tidak ada, terbalik, atau terlalu panjang", () => {
    const pesan = (q: { from?: string; to?: string }) => {
      const hasil = periksaRentang(q, SEKARANG);
      return hasil.ok ? null : hasil.badan.message;
    };

    expect(tanggalSah("2026-02-29")).toBe(false);
    expect(tanggalSah("2028-02-29")).toBe(true);
    expect(pesan({ from: "2026-13-01", to: "2026-12-01" })).toBe("Tanggal harus berformat YYYY-MM-DD");
    expect(pesan({ from: "2026-10-20", to: "2026-10-01" })).toBe("Tanggal awal tidak boleh setelah tanggal akhir");
    expect(pesan({ from: "2020-01-01", to: "2026-10-01" })).toBe("Periode laporan maksimal 3 tahun");
    expect(pesan({ from: "2026-10-01", to: "2026-10-01" })).toBeNull();
  });

  it("membandingkan dengan periode sepanjang yang sama tepat sebelumnya", () => {
    expect(rentangSebelumnya({ dari: "2026-10-10", sampai: "2026-10-16" })).toEqual({
      dari: "2026-10-03",
      sampai: "2026-10-09",
    });
    expect(rentangSebelumnya({ dari: "2026-03-01", sampai: "2026-03-31" })).toEqual({
      dari: "2026-01-29",
      sampai: "2026-02-28",
    });
    expect(jumlahHari({ dari: "2026-10-30", sampai: "2026-11-02" })).toBe(4);
  });

  it("mengelompokkan per hari, per minggu, lalu per bulan sesuai panjang periode", () => {
    expect([1, 62, 63, 200, 201, 1000].map(pilihKelompok)).toEqual(["day", "day", "week", "week", "month", "month"]);
  });
});

describe("labelMetode", () => {
  it("menerjemahkan kode DOKU jadi nama yang dibaca pemilik toko", () => {
    expect(
      [
        "QRIS_DOKU",
        "VIRTUAL_ACCOUNT_BANK_MANDIRI",
        "VIRTUAL_ACCOUNT_BANK_SYARIAH_MANDIRI",
        "VIRTUAL_ACCOUNT_BNI",
        "BRI Virtual Account",
        "PEER_TO_PEER_AKULAKU",
      ].map(labelMetode),
    ).toEqual(["QRIS", "VA Mandiri", "VA BSI", "VA BNI", "VA BRI", "PEER TO PEER AKULAKU"]);
  });

  it("membiarkan kosong pesanan yang belum punya metode bayar", () => {
    expect(labelMetode(null)).toBeNull();
    expect(labelMetode("  ")).toBeNull();
  });
});

describe("keCsv", () => {
  it("memakai koma standar, BOM untuk Excel, dan mengutip isi yang perlu dikutip", () => {
    const csv = keCsv(["A", "B"], [["Jl. Mawar, No. 2", 'Kata "Bagus"'], ["Titik; koma", 1500], [null, null]]);

    expect(csv.startsWith("﻿A,B\r\n")).toBe(true);
    expect(csv).toContain('"Jl. Mawar, No. 2","Kata ""Bagus"""\r\n');
    expect(csv).toContain("Titik; koma,1500\r\n");
    expect(csv.endsWith(",\r\n")).toBe(true);
  });

  it("menjinakkan teks dari pembeli yang bisa dibaca Excel sebagai rumus", () => {
    const csv = keCsv(["Nama"], [["=HYPERLINK(\"x\")"], ["+62 812"], ["-1"], ["@ani"]]);

    expect(csv).toContain(`"'=HYPERLINK(""x"")"`);
    expect(csv).toContain("'+62 812");
    expect(csv).toContain("'-1");
    expect(csv).toContain("'@ani");
  });

  it("menjaga nomor panjang seperti resi tetap teks, bukan notasi ilmiah", () => {
    const csv = keCsv(["Resi", "HP"], [[{ digit: "300380022869426" }, { digit: "0812-3" }]]);

    expect(csv).toContain(`"=""300380022869426""",0812-3`);
  });
});
