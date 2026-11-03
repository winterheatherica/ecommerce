export type KolomXlsx = { judul: string; lebar: number; jenis?: "teks" | "angka" | "rupiah" | "waktu" };
export type SelXlsx = string | number | Date | null;

const enc = new TextEncoder();
const WIB_MS = 7 * 3_600_000;
const GAYA = { judul: 1, rupiah: 2, waktu: 3 } as const;

const TABEL_CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

export function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (const b of data) crc = TABEL_CRC[(crc ^ b) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

export function zipSimpan(berkas: { nama: string; isi: Uint8Array }[], waktu: Date = new Date()): Uint8Array {
  const jam = ((waktu.getUTCHours() << 11) | (waktu.getUTCMinutes() << 5) | (waktu.getUTCSeconds() >> 1)) & 0xffff;
  const tanggal =
    (((waktu.getUTCFullYear() - 1980) << 9) | ((waktu.getUTCMonth() + 1) << 5) | waktu.getUTCDate()) & 0xffff;
  const bagian: Uint8Array[] = [];
  const pusat: Uint8Array[] = [];
  let posisi = 0;

  for (const f of berkas) {
    const nama = enc.encode(f.nama);
    const crc = crc32(f.isi);

    const lokal = new Uint8Array(30 + nama.length);
    const l = new DataView(lokal.buffer);
    l.setUint32(0, 0x04034b50, true);
    l.setUint16(4, 20, true);
    l.setUint16(6, 0x0800, true);
    l.setUint16(8, 0, true);
    l.setUint16(10, jam, true);
    l.setUint16(12, tanggal, true);
    l.setUint32(14, crc, true);
    l.setUint32(18, f.isi.length, true);
    l.setUint32(22, f.isi.length, true);
    l.setUint16(26, nama.length, true);
    lokal.set(nama, 30);
    bagian.push(lokal, f.isi);

    const entri = new Uint8Array(46 + nama.length);
    const p = new DataView(entri.buffer);
    p.setUint32(0, 0x02014b50, true);
    p.setUint16(4, 20, true);
    p.setUint16(6, 20, true);
    p.setUint16(8, 0x0800, true);
    p.setUint16(10, 0, true);
    p.setUint16(12, jam, true);
    p.setUint16(14, tanggal, true);
    p.setUint32(16, crc, true);
    p.setUint32(20, f.isi.length, true);
    p.setUint32(24, f.isi.length, true);
    p.setUint16(28, nama.length, true);
    p.setUint32(42, posisi, true);
    entri.set(nama, 46);
    pusat.push(entri);

    posisi += lokal.length + f.isi.length;
  }

  const ukuranPusat = pusat.reduce((a, b) => a + b.length, 0);
  const akhir = new Uint8Array(22);
  const a = new DataView(akhir.buffer);
  a.setUint32(0, 0x06054b50, true);
  a.setUint16(8, berkas.length, true);
  a.setUint16(10, berkas.length, true);
  a.setUint32(12, ukuranPusat, true);
  a.setUint32(16, posisi, true);

  const hasil = new Uint8Array(posisi + ukuranPusat + akhir.length);
  let i = 0;
  for (const b of [...bagian, ...pusat, akhir]) {
    hasil.set(b, i);
    i += b.length;
  }
  return hasil;
}

export function hurufKolom(indeks: number): string {
  let n = indeks + 1;
  let s = "";
  while (n > 0) {
    const sisa = (n - 1) % 26;
    s = String.fromCharCode(65 + sisa) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

function xml(teks: string): string {
  return teks
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f￾￿]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function serialExcelWib(d: Date): number {
  return (d.getTime() + WIB_MS) / 86_400_000 + 25569;
}

function sel(ref: string, nilai: SelXlsx, kolom: KolomXlsx | undefined, gaya?: number): string {
  if (nilai === null) return "";
  if (nilai instanceof Date) return `<c r="${ref}" s="${GAYA.waktu}"><v>${serialExcelWib(nilai)}</v></c>`;
  if (typeof nilai === "number") {
    const s = gaya ?? (kolom?.jenis === "rupiah" ? GAYA.rupiah : undefined);
    return `<c r="${ref}"${s ? ` s="${s}"` : ""}><v>${nilai}</v></c>`;
  }
  const spasi = /^\s|\s$/.test(nilai) ? ' xml:space="preserve"' : "";
  return `<c r="${ref}" t="inlineStr"${gaya ? ` s="${gaya}"` : ""}><is><t${spasi}>${xml(nilai)}</t></is></c>`;
}

const KEPALA_XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
const NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
const NS_REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const NS_PKG = "http://schemas.openxmlformats.org/package/2006/relationships";

export function buatXlsx(namaSheet: string, kolom: KolomXlsx[], baris: SelXlsx[][], waktu: Date = new Date()): Uint8Array {
  const sheet = xml(namaSheet.replace(/[\\/?*[\]:]/g, " ").slice(0, 31));
  const terakhir = hurufKolom(kolom.length - 1);
  const jangkauan = `A1:${terakhir}${baris.length + 1}`;

  const judul = `<row r="1">${kolom.map((k, i) => sel(`${hurufKolom(i)}1`, k.judul, k, GAYA.judul)).join("")}</row>`;
  const isi = baris
    .map(
      (b, r) =>
        `<row r="${r + 2}">${b.map((v, i) => sel(`${hurufKolom(i)}${r + 2}`, v, kolom[i])).join("")}</row>`,
    )
    .join("");
  const lebar = kolom
    .map((k, i) => `<col min="${i + 1}" max="${i + 1}" width="${k.lebar}" customWidth="1"/>`)
    .join("");

  const berkas: Record<string, string> = {
    "[Content_Types].xml":
      `${KEPALA_XML}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
      '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
      '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
      "</Types>",
    "_rels/.rels":
      `${KEPALA_XML}<Relationships xmlns="${NS_PKG}">` +
      `<Relationship Id="rId1" Type="${NS_REL}/officeDocument" Target="xl/workbook.xml"/>` +
      "</Relationships>",
    "xl/workbook.xml":
      `${KEPALA_XML}<workbook xmlns="${NS}" xmlns:r="${NS_REL}">` +
      `<sheets><sheet name="${sheet}" sheetId="1" r:id="rId1"/></sheets>` +
      `<definedNames><definedName name="_xlnm._FilterDatabase" localSheetId="0" hidden="1">'${sheet.replace(/'/g, "''")}'!$A$1:$${terakhir}$${baris.length + 1}</definedName></definedNames>` +
      "</workbook>",
    "xl/_rels/workbook.xml.rels":
      `${KEPALA_XML}<Relationships xmlns="${NS_PKG}">` +
      `<Relationship Id="rId1" Type="${NS_REL}/worksheet" Target="worksheets/sheet1.xml"/>` +
      `<Relationship Id="rId2" Type="${NS_REL}/styles" Target="styles.xml"/>` +
      "</Relationships>",
    "xl/styles.xml":
      `${KEPALA_XML}<styleSheet xmlns="${NS}">` +
      '<numFmts count="2"><numFmt numFmtId="164" formatCode="#,##0"/><numFmt numFmtId="165" formatCode="yyyy-mm-dd hh:mm"/></numFmts>' +
      '<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>' +
      '<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>' +
      '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
      '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
      '<cellXfs count="4">' +
      '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
      '<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>' +
      '<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
      '<xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
      "</cellXfs>" +
      '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' +
      "</styleSheet>",
    "xl/worksheets/sheet1.xml":
      `${KEPALA_XML}<worksheet xmlns="${NS}" xmlns:r="${NS_REL}">` +
      `<dimension ref="${jangkauan}"/>` +
      '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>' +
      '<sheetFormatPr defaultRowHeight="15"/>' +
      `<cols>${lebar}</cols>` +
      `<sheetData>${judul}${isi}</sheetData>` +
      `<autoFilter ref="${jangkauan}"/>` +
      `<ignoredErrors><ignoredError sqref="${jangkauan}" numberStoredAsText="1"/></ignoredErrors>` +
      "</worksheet>",
  };

  return zipSimpan(
    Object.entries(berkas).map(([nama, teks]) => ({ nama, isi: enc.encode(teks) })),
    waktu,
  );
}
