import type { StatusPesanan } from "@/app/data/status-pesanan";

export type RingkasanLaporan = {
  revenue: number;
  product_sales: number;
  shipping: number;
  discount: number;
  paid_orders: number;
  created_orders: number;
  created_paid_orders: number;
  items: number;
  buyers: number;
  new_buyers: number;
  returning_buyers: number;
  aov: number;
};

export type TitikTren = { start: string; revenue: number; orders: number; items: number };

export type LaporanAPI = {
  range: {
    from: string;
    to: string;
    days: number;
    bucket: "day" | "week" | "month";
    all: boolean;
    previous: { from: string; to: string } | null;
  };
  summary: RingkasanLaporan;
  previous_summary: RingkasanLaporan | null;
  trend: TitikTren[];
  statuses: { status: StatusPesanan; orders: number; value: number }[];
  actions: { to_ship: number; in_transit: number; awaiting_payment: number; out_of_stock: number; low_stock: number };
  top_products: {
    slug: string | null;
    name: string;
    variant_label: string | null;
    variant_count: number;
    qty: number;
    revenue: number;
  }[];
  unsold_products: { slug: string; name: string }[];
  categories: { slug: string; label: string; orders: number; qty: number; revenue: number }[];
  payments: { channel: string; method: string; orders: number; revenue: number }[];
  couriers: { courier: string; orders: number; shipping: number; avg_shipping: number; avg_weight_g: number }[];
  durations: {
    pay_minutes: number | null;
    pay_count: number;
    ship_hours: number | null;
    ship_count: number;
    deliver_days: number | null;
    deliver_count: number;
  };
  provinces: { province: string; orders: number; revenue: number }[];
  cities: { city: string; province: string; orders: number; revenue: number }[];
  customers: {
    new_accounts: number;
    account_orders: number;
    guest_orders: number;
    top: { name: string; orders: number; spent: number; has_account: boolean }[];
  };
  reviews: {
    by_source: { source: string; count: number; average: number }[];
    by_rating: { rating: number; count: number }[];
    all_time: { count: number; average: number };
  };
  heatmap: { dow: number; hour: number; orders: number }[];
};

export type Periode = "hari-ini" | "7-hari" | "30-hari" | "bulan-ini" | "bulan-lalu" | "90-hari" | "tahun-ini" | "semua";

export const PILIHAN_PERIODE: { kunci: Periode; label: string }[] = [
  { kunci: "hari-ini", label: "Hari ini" },
  { kunci: "7-hari", label: "7 hari" },
  { kunci: "30-hari", label: "30 hari" },
  { kunci: "bulan-ini", label: "Bulan ini" },
  { kunci: "bulan-lalu", label: "Bulan lalu" },
  { kunci: "90-hari", label: "90 hari" },
  { kunci: "tahun-ini", label: "Tahun ini" },
  { kunci: "semua", label: "Semua waktu" },
];

export const PERIODE_BAWAAN: Periode = "30-hari";

export type PilihanLaporan = { periode: Periode | "kustom"; dari: string | null; sampai: string | null };

const WIB_MS = 7 * 3_600_000;
const SEHARI_MS = 86_400_000;
const POLA_TANGGAL = /^\d{4}-\d{2}-\d{2}$/;

export function hariIniWib(sekarang: Date = new Date()): string {
  return new Date(sekarang.getTime() + WIB_MS).toISOString().slice(0, 10);
}

export function geserHari(t: string, n: number): string {
  return new Date(Date.parse(`${t}T00:00:00Z`) + n * SEHARI_MS).toISOString().slice(0, 10);
}

function awalBulan(t: string): string {
  return `${t.slice(0, 7)}-01`;
}

function tanggalSah(t: string | undefined): t is string {
  if (!t || !POLA_TANGGAL.test(t)) return false;
  const d = new Date(`${t}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === t;
}

export function rentangPeriode(p: Periode, hariIni: string): { dari: string; sampai: string } | null {
  switch (p) {
    case "hari-ini":
      return { dari: hariIni, sampai: hariIni };
    case "7-hari":
      return { dari: geserHari(hariIni, -6), sampai: hariIni };
    case "30-hari":
      return { dari: geserHari(hariIni, -29), sampai: hariIni };
    case "90-hari":
      return { dari: geserHari(hariIni, -89), sampai: hariIni };
    case "bulan-ini":
      return { dari: awalBulan(hariIni), sampai: hariIni };
    case "bulan-lalu": {
      const akhir = geserHari(awalBulan(hariIni), -1);
      return { dari: awalBulan(akhir), sampai: akhir };
    }
    case "tahun-ini":
      return { dari: `${hariIni.slice(0, 4)}-01-01`, sampai: hariIni };
    case "semua":
      return null;
  }
}

export function bacaPilihan(
  q: { periode?: string; dari?: string; sampai?: string },
  hariIni: string,
): PilihanLaporan {
  if (tanggalSah(q.dari) && tanggalSah(q.sampai) && q.dari <= q.sampai) {
    return { periode: "kustom", dari: q.dari, sampai: q.sampai };
  }

  const periode = PILIHAN_PERIODE.some((x) => x.kunci === q.periode) ? (q.periode as Periode) : PERIODE_BAWAAN;
  const r = rentangPeriode(periode, hariIni);
  return { periode, dari: r?.dari ?? null, sampai: r?.sampai ?? null };
}

export function kueriApi(p: PilihanLaporan): string {
  return p.dari && p.sampai ? `from=${p.dari}&to=${p.sampai}` : "all=true";
}

const FORMAT_TANGGAL = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const FORMAT_HARI_BULAN = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", timeZone: "UTC" });
const FORMAT_BULAN = new Intl.DateTimeFormat("id-ID", { month: "short", year: "numeric", timeZone: "UTC" });
const FORMAT_HARI_PANJANG = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const keTanggal = (t: string) => new Date(`${t}T00:00:00Z`);

export function tanggalPendek(t: string): string {
  return FORMAT_TANGGAL.format(keTanggal(t));
}

export function teksRentang(dari: string, sampai: string): string {
  if (dari === sampai) return tanggalPendek(dari);
  if (dari.slice(0, 7) === sampai.slice(0, 7)) {
    return `${Number(dari.slice(8))}–${tanggalPendek(sampai)}`;
  }
  if (dari.slice(0, 4) === sampai.slice(0, 4)) {
    return `${FORMAT_HARI_BULAN.format(keTanggal(dari))} – ${tanggalPendek(sampai)}`;
  }
  return `${tanggalPendek(dari)} – ${tanggalPendek(sampai)}`;
}

export function labelEmber(start: string, ember: LaporanAPI["range"]["bucket"], singkat = false): string {
  if (ember === "month") return FORMAT_BULAN.format(keTanggal(start));
  if (ember === "week") return `${singkat ? "" : "Minggu "}${FORMAT_HARI_BULAN.format(keTanggal(start))}`;
  return singkat ? FORMAT_HARI_BULAN.format(keTanggal(start)) : FORMAT_HARI_PANJANG.format(keTanggal(start));
}

const FORMAT_ANGKA = new Intl.NumberFormat("id-ID");
const FORMAT_DESIMAL = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 });

export const angka = (n: number) => FORMAT_ANGKA.format(n);

export function rupiahRingkas(n: number): string {
  const mutlak = Math.abs(n);
  if (mutlak >= 1e9) return `Rp${FORMAT_DESIMAL.format(n / 1e9)} M`;
  if (mutlak >= 1e6) return `Rp${FORMAT_DESIMAL.format(n / 1e6)} jt`;
  if (mutlak >= 1e3) return `Rp${FORMAT_DESIMAL.format(n / 1e3)} rb`;
  return `Rp${FORMAT_ANGKA.format(n)}`;
}

export function persen(bagian: number, total: number): string {
  if (total <= 0) return "0%";
  return `${FORMAT_DESIMAL.format((bagian / total) * 100)}%`;
}

export function teksMenit(menit: number): string {
  if (menit < 60) return `${Math.max(1, Math.round(menit))} menit`;
  if (menit < 48 * 60) return `${FORMAT_DESIMAL.format(menit / 60)} jam`;
  return `${FORMAT_DESIMAL.format(menit / 1440)} hari`;
}

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

export function labelMetode(channel: string, method: string): string {
  const m = method.trim();
  if (!m) return channel ? `${channel} (metode tidak tercatat)` : "Manual lewat WhatsApp";
  if (/qris/i.test(m)) return "QRIS";

  const kode = m.match(/^VIRTUAL_ACCOUNT_(?:BANK_)?([A-Z_]+)$/i);
  if (kode) return `VA ${NAMA_BANK[kode[1].toUpperCase()] ?? kode[1].replace(/_/g, " ")}`;

  const teks = m.match(/^(.+?)\s+virtual account$/i);
  if (teks) return `VA ${NAMA_BANK[teks[1].toUpperCase()] ?? teks[1]}`;

  if (/indomaret/i.test(m)) return "Indomaret";
  if (/alfa/i.test(m)) return "Alfamart";
  return m.replace(/_/g, " ");
}

export const NAMA_SUMBER_ULASAN: Record<string, string> = {
  shopee: "Shopee",
  tokopedia: "Tokopedia",
  web: "Website",
};

export const HARI_SINGKAT = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
export const HARI_PANJANG = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
