import { crc32 } from "../lib/xlsx";

const dec = new TextDecoder();

export function bacaZip(data: Uint8Array): Record<string, string> {
  const v = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const isi: Record<string, string> = {};
  let i = 0;

  while (v.getUint32(i, true) === 0x04034b50) {
    if (v.getUint16(i + 8, true) !== 0) throw new Error("berkas zip terkompresi, harusnya disimpan apa adanya");
    const crc = v.getUint32(i + 14, true);
    const ukuran = v.getUint32(i + 18, true);
    const panjangNama = v.getUint16(i + 26, true);
    const panjangEkstra = v.getUint16(i + 28, true);
    const nama = dec.decode(data.subarray(i + 30, i + 30 + panjangNama));
    const awal = i + 30 + panjangNama + panjangEkstra;
    const badan = data.subarray(awal, awal + ukuran);

    if (crc32(badan) !== crc) throw new Error(`CRC ${nama} tidak cocok`);
    isi[nama] = dec.decode(badan);
    i = awal + ukuran;
  }

  const akhir = data.length - 22;
  if (v.getUint32(akhir, true) !== 0x06054b50) throw new Error("penutup zip tidak ada");
  if (v.getUint16(akhir + 10, true) !== Object.keys(isi).length) throw new Error("jumlah entri pusat tidak cocok");

  return isi;
}
