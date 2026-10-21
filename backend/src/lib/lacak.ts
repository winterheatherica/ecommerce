import type { HasilRO, LacakRO } from "./rajaongkir";

export type LacakResi = (
  awb: string,
  courier: string,
  hpAkhir: string | null,
) => Promise<HasilRO<LacakRO>>;

export type PeristiwaLacak = {
  at: string | null;
  description: string;
  city: string | null;
};

export type Lacak = {
  delivered: boolean;
  receiver: string | null;
  delivered_at: string | null;
  status: string | null;
  events: PeristiwaLacak[];
  fetched_at: string;
};

export const JEDA_LACAK_JAM = 3;
export const JEDA_LACAK_TERJADWAL_JAM = 12;
export const TUNGGU_SELESAI_JAM = 48;
export const UMUR_LACAK_MAKS_HARI = 30;
export const MAKS_PERISTIWA = 50;

export const PESAN_JATAH_LACAK = "Batas pelacakan harian tercapai";

const KODE_KURIR: Record<string, string> = {
  JNE: "jne",
  JNT: "jnt",
  "J&T": "jnt",
  SICEPAT: "sicepat",
};

export function kodeKurirLacak(courier: string): string {
  const kode = courier.trim().toUpperCase();
  return KODE_KURIR[kode] ?? kode.toLowerCase();
}

export function hpAkhir(hp: string): string | null {
  const angka = hp.replace(/\D/g, "");
  return angka.length >= 5 ? angka.slice(-5) : null;
}

export type KeadaanLacak = {
  status: string;
  tracking_number: string | null;
  delivered_at: string | null;
  tracking_checked_at: string | null;
};

export function perluDilacak(
  p: KeadaanLacak,
  jedaJam: number = JEDA_LACAK_JAM,
  sekarang: Date = new Date(),
): boolean {
  if (p.status !== "SHIPPED" || !p.tracking_number || p.delivered_at) return false;
  if (!p.tracking_checked_at) return true;

  return sekarang.getTime() - new Date(p.tracking_checked_at).getTime() >= jedaJam * 3600 * 1000;
}

const POLA_TANGGAL_ISO = /^(\d{4})-(\d{1,2})-(\d{1,2})/;
const POLA_TANGGAL_ID = /^(\d{1,2})-(\d{1,2})-(\d{4})/;
const POLA_JAM = /(\d{1,2})[:.](\d{2})(?:[:.](\d{2}))?/;

export function waktuWib(tanggal?: string | null, jam?: string | null): string | null {
  const t = (tanggal ?? "").trim();
  const iso = t.match(POLA_TANGGAL_ISO);
  const id = iso ? null : t.match(POLA_TANGGAL_ID);

  if (!iso && !id) return null;

  const [tahun, bulan, hari] = iso ? [iso[1], iso[2], iso[3]] : [id![3], id![2], id![1]];
  const sisa = t.slice((iso ?? id)![0].length);
  const j = (jam ?? "").trim().match(POLA_JAM) ?? sisa.match(POLA_JAM);

  const dua = (s: string) => s.padStart(2, "0");
  const teks = `${tahun}-${dua(bulan)}-${dua(hari)}T${dua(j?.[1] ?? "0")}:${j?.[2] ?? "00"}:${j?.[3] ?? "00"}+07:00`;
  const hasil = new Date(teks);

  return Number.isNaN(hasil.getTime()) ? null : hasil.toISOString();
}

function teks(nilai: string | null | undefined): string | null {
  const bersih = (nilai ?? "").replace(/\s+/g, " ").trim();
  return bersih ? bersih : null;
}

function urutTerbaru(a: PeristiwaLacak, b: PeristiwaLacak): number {
  if (a.at === b.at) return 0;
  if (a.at === null) return 1;
  if (b.at === null) return -1;
  return a.at < b.at ? 1 : -1;
}

export function rapikanLacak(data: LacakRO, sekarang: Date = new Date()): Lacak {
  const events = (data.manifest ?? [])
    .map((m) => ({
      at: waktuWib(m.manifest_date, m.manifest_time),
      description: teks(m.manifest_description) ?? "",
      city: teks(m.city_name),
    }))
    .filter((e) => e.description)
    .sort(urutTerbaru)
    .slice(0, MAKS_PERISTIWA);

  const kabar = data.delivery_status ?? {};
  const delivered =
    data.delivered === true ||
    String(data.delivered).toLowerCase() === "true" ||
    /^delivered$/i.test((kabar.status ?? "").trim());

  return {
    delivered,
    receiver: delivered ? teks(kabar.pod_receiver) : null,
    delivered_at: delivered ? (waktuWib(kabar.pod_date, kabar.pod_time) ?? events[0]?.at ?? null) : null,
    status: teks(data.summary?.status) ?? teks(kabar.status),
    events,
    fetched_at: sekarang.toISOString(),
  };
}
