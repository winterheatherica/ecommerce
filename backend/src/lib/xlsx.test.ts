import { describe, expect, it } from "vitest";

import { bacaZip } from "../test/zip";
import { buatXlsx, crc32, hurufKolom, serialExcelWib } from "./xlsx";

describe("crc32 dan kolom", () => {
  it("cocok dengan nilai acuan CRC-32 standar", () => {
    expect(crc32(new TextEncoder().encode("123456789"))).toBe(0xcbf43926);
  });

  it("menamai kolom seperti Excel", () => {
    expect([0, 25, 26, 51, 701, 702].map(hurufKolom)).toEqual(["A", "Z", "AA", "AZ", "ZZ", "AAA"]);
  });

  it("mengubah waktu ke angka tanggal Excel dalam WIB", () => {
    const hari = (Date.UTC(2026, 9, 10) - Date.UTC(1899, 11, 30)) / 86_400_000;
    expect(serialExcelWib(new Date("2026-10-10T09:15:00+07:00"))).toBeCloseTo(hari + (9 * 60 + 15) / 1440, 9);
  });
});

describe("buatXlsx", () => {
  const berkas = bacaZip(
    buatXlsx(
      "Pesanan",
      [
        { judul: "Nama & toko", lebar: 20 },
        { judul: "Dibuat", lebar: 17, jenis: "waktu" },
        { judul: "Total", lebar: 12, jenis: "rupiah" },
        { judul: "No. HP", lebar: 16 },
      ],
      [
        ["Ani <Toko> \"A\"\u0007", new Date("2026-10-10T09:15:00+07:00"), 49000, "081200000001"],
        ["=SUM(A1)", null, 0, " spasi "],
      ],
      new Date("2026-11-04T10:00:00Z"),
    ),
  );
  const sheet = berkas["xl/worksheets/sheet1.xml"];

  it("berisi semua bagian paket xlsx", () => {
    expect(Object.keys(berkas).sort()).toEqual([
      "[Content_Types].xml",
      "_rels/.rels",
      "xl/_rels/workbook.xml.rels",
      "xl/styles.xml",
      "xl/workbook.xml",
      "xl/worksheets/sheet1.xml",
    ]);
    expect(berkas["xl/workbook.xml"]).toContain('<sheet name="Pesanan" sheetId="1" r:id="rId1"/>');
  });

  it("menebalkan judul, mengunci baris judul, dan memasang filter", () => {
    expect(sheet).toContain('<c r="A1" t="inlineStr" s="1"><is><t>Nama &amp; toko</t></is></c>');
    expect(sheet).toContain('state="frozen"');
    expect(sheet).toContain('<autoFilter ref="A1:D3"/>');
    expect(sheet).toContain('<col min="1" max="1" width="20" customWidth="1"/>');
  });

  it("menyimpan teks, tanggal, dan rupiah dengan jenis yang benar", () => {
    expect(sheet).toContain('<c r="A2" t="inlineStr"><is><t>Ani &lt;Toko&gt; &quot;A&quot;</t></is></c>');
    expect(sheet).toMatch(/<c r="B2" s="3"><v>46305\.38541666/);
    expect(sheet).toContain('<c r="C2" s="2"><v>49000</v></c>');
    expect(sheet).toContain('<c r="D2" t="inlineStr"><is><t>081200000001</t></is></c>');
    expect(sheet).toContain('<ignoredError sqref="A1:D3" numberStoredAsText="1"/>');
  });

  it("rumus dari pembeli tetap teks biasa dan sel kosong dilewati", () => {
    expect(sheet).toContain('<c r="A3" t="inlineStr"><is><t>=SUM(A1)</t></is></c>');
    expect(sheet).not.toContain('r="B3"');
    expect(sheet).toContain('<t xml:space="preserve"> spasi </t>');
  });
});
