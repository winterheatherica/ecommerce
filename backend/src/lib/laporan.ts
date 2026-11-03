import type { Gagal } from "./products";

export type Rentang = { dari: string; sampai: string };
export type Kelompok = "day" | "week" | "month";

export const RENTANG_BAWAAN_HARI = 30;
export const RENTANG_MAKS_HARI = 3 * 366;
export const AMBANG_STOK_MENIPIS = 10;

export const LABEL_STATUS: Record<string, string> = {
  PENDING: "Menunggu bayar",
  PAID: "Dibayar, perlu dikirim",
  SHIPPED: "Dikirim",
  DELIVERED: "Selesai",
  EXPIRED: "Kedaluwarsa",
  CANCELLED: "Dibatalkan",
};

const NAMA_BANK: Record<string, string> = {
  BNI: "BNI",
  BRI: "BRI",
  MANDIRI: "Mandiri",
  SYARIAH_MANDIRI: "BSI",
  BSI: "BSI",
  CIMB: "CIMB Niaga",
  PERMATA: "Permata",
  DANAMON: "Danamon",
  BTN: "BTN",
  DOKU: "DOKU",
};

export function labelMetode(metode: string | null): string | null {
  const m = metode?.trim();
  if (!m) return null;
  if (/qris/i.test(m)) return "QRIS";

  const kode = m.match(/^VIRTUAL_ACCOUNT_(?:BANK_)?([A-Z_]+)$/i);
  if (kode) return `VA ${NAMA_BANK[kode[1].toUpperCase()] ?? kode[1].replace(/_/g, " ")}`;

  const teks = m.match(/^(.+?)\s+virtual account$/i);
  if (teks) return `VA ${NAMA_BANK[teks[1].toUpperCase()] ?? teks[1]}`;

  if (/indomaret/i.test(m)) return "Indomaret";
  if (/alfa/i.test(m)) return "Alfamart";
  return m.replace(/_/g, " ");
}

export type SelCsv = string | number | null | { digit: string };

const POLA_TANGGAL = /^\d{4}-\d{2}-\d{2}$/;
const SEHARI_MS = 86_400_000;
const WIB_MS = 7 * 3_600_000;

function gagal(message: string): { ok: false } & Gagal {
  return { ok: false, status: 422, badan: { error: "invalid_range", message, field: "range" } };
}

export function tanggalSah(t: string): boolean {
  if (!POLA_TANGGAL.test(t)) return false;
  const d = new Date(`${t}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === t;
}

export function geserHari(t: string, n: number): string {
  return new Date(Date.parse(`${t}T00:00:00Z`) + n * SEHARI_MS).toISOString().slice(0, 10);
}

export function jumlahHari(r: Rentang): number {
  return Math.round((Date.parse(`${r.sampai}T00:00:00Z`) - Date.parse(`${r.dari}T00:00:00Z`)) / SEHARI_MS) + 1;
}

export function hariIniWib(sekarang: Date = new Date()): string {
  return new Date(sekarang.getTime() + WIB_MS).toISOString().slice(0, 10);
}

export function rentangSebelumnya(r: Rentang): Rentang {
  const n = jumlahHari(r);
  return { dari: geserHari(r.dari, -n), sampai: geserHari(r.dari, -1) };
}

export function pilihKelompok(hari: number): Kelompok {
  if (hari <= 62) return "day";
  if (hari <= 200) return "week";
  return "month";
}

export function periksaRentang(
  q: { from?: string; to?: string; all?: string },
  sekarang: Date = new Date(),
): { ok: true; rentang: Rentang | null } | ({ ok: false } & Gagal) {
  if (q.all === "true") return { ok: true, rentang: null };

  const hariIni = hariIniWib(sekarang);
  const sampai = q.to?.trim() || hariIni;
  const dari = q.from?.trim() || geserHari(sampai, -(RENTANG_BAWAAN_HARI - 1));

  if (!tanggalSah(dari) || !tanggalSah(sampai)) return gagal("Tanggal harus berformat YYYY-MM-DD");
  if (dari > sampai) return gagal("Tanggal awal tidak boleh setelah tanggal akhir");

  const rentang = { dari, sampai };
  if (jumlahHari(rentang) > RENTANG_MAKS_HARI) return gagal("Periode laporan maksimal 3 tahun");

  return { ok: true, rentang };
}

function selCsv(nilai: SelCsv): string {
  if (nilai === null) return "";
  if (typeof nilai === "object") return /^\d{1,40}$/.test(nilai.digit) ? `"=""${nilai.digit}"""` : selCsv(nilai.digit);
  let isi = String(nilai);
  if (typeof nilai === "string" && /^[=+\-@\t\r]/.test(isi)) isi = `'${isi}`;
  return /[",\r\n]/.test(isi) ? `"${isi.replace(/"/g, '""')}"` : isi;
}

export function keCsv(kepala: string[], baris: SelCsv[][]): string {
  const isi = [kepala, ...baris].map((b) => b.map(selCsv).join(",")).join("\r\n");
  return `﻿${isi}\r\n`;
}
