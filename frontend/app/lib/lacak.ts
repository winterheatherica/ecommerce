import type { Lacak, Pesanan } from "@/app/lib/api";

export const TUNGGU_SELESAI_JAM = 48;
const HARI_TANPA_PERGERAKAN = 3;

export function waktuKurir(iso: string): string {
  return new Date(iso).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });
}

export function batasKomplain(deliveredAt: string): string {
  return new Date(new Date(deliveredAt).getTime() + TUNGGU_SELESAI_JAM * 3600 * 1000).toISOString();
}

export function sejak(iso: string, sekarang: Date = new Date()): string {
  const menit = Math.max(0, Math.floor((sekarang.getTime() - new Date(iso).getTime()) / 60000));

  if (menit < 1) return "baru saja";
  if (menit < 60) return `${menit} menit lalu`;

  const jam = Math.floor(menit / 60);
  if (jam < 24) return `${jam} jam lalu`;

  return `${Math.floor(jam / 24)} hari lalu`;
}

function rapikanKota(kota: string): string {
  return kota
    .toLowerCase()
    .replace(/\s*,\s*/g, ", ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/(^|[\s,(])(\p{L})/gu, (_, awal: string, huruf: string) => awal + huruf.toUpperCase());
}

function lokasiDariKeterangan(teks: string): string | null {
  for (const cocok of teks.matchAll(/\[([^\]]*)\]/g)) {
    const isi = cocok[1].trim();
    if (isi && !isi.includes("|")) return isi;
  }

  return null;
}

export function posisiTerakhir(lacak: Lacak): { teks: string; at: string | null } | null {
  const terbaru = lacak.events[0];
  if (!terbaru) return null;

  const lokasi = terbaru.city ?? lokasiDariKeterangan(terbaru.description);

  return { teks: lokasi ? rapikanKota(lokasi) : terbaru.description, at: terbaru.at };
}

export function tanpaPergerakan(
  p: Pick<Pesanan, "status" | "delivered_at" | "shipped_at" | "tracking">,
  sekarang: Date = new Date(),
): boolean {
  if (p.status !== "SHIPPED" || p.delivered_at) return false;

  const terakhir = p.tracking?.events[0]?.at ?? p.shipped_at;
  if (!terakhir) return false;

  return sekarang.getTime() - new Date(terakhir).getTime() >= HARI_TANPA_PERGERAKAN * 24 * 3600 * 1000;
}

export type BarisRiwayat = { waktu: string | null; keterangan: string };

export function barisRiwayat(lacak: Lacak): BarisRiwayat[] {
  return lacak.events.map((e) => ({
    waktu: e.at ? waktuKurir(e.at) : null,
    keterangan: e.description,
  }));
}
