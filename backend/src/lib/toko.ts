import type { Gagal } from "./products";

export type TautanSosial = { label: string; url: string };

export type TokoBaru = {
  wa_number: string;
  wa_link?: string | null;
  address_street: string;
  address_village: string;
  address_district: string;
  address_city: string;
  address_province: string;
  postal_code: string;
  maps_url?: string | null;
  open_days: number[];
  opens_at: string;
  closes_at: string;
  closed_on_holidays: boolean;
  social_links: TautanSosial[];
};

export type TokoBersih = Omit<TokoBaru, "wa_link" | "maps_url"> & {
  wa_link: string | null;
  maps_url: string | null;
};

export const SOSIAL_MAKS = 8;

const POLA_JAM = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;
const POLA_URL = /^https:\/\/\S{4,300}$/;

const ALAMAT = [
  ["address_street", "Jalan", 3, 200],
  ["address_village", "Kelurahan", 2, 80],
  ["address_district", "Kecamatan", 2, 80],
  ["address_city", "Kota", 2, 80],
  ["address_province", "Provinsi", 2, 80],
] as const;

function gagal(error: string, message: string, field: string): { ok: false } & Gagal {
  return { ok: false, status: 422, badan: { error, message, field } };
}

function teks(nilai: string | null | undefined): string {
  return (nilai ?? "").replace(/\s+/g, " ").trim();
}

function urlOpsional(nilai: string | null | undefined): string | null | false {
  const t = teks(nilai);
  if (!t) return null;
  return POLA_URL.test(t) ? t : false;
}

export function rapikanNomorWa(nilai: string): string | null {
  let angka = nilai.replace(/[\s().-]/g, "");
  if (angka.startsWith("+")) angka = angka.slice(1);
  if (angka.startsWith("0")) angka = `62${angka.slice(1)}`;

  return /^62[1-9][0-9]{7,12}$/.test(angka) ? angka : null;
}

export function periksaToko(
  data: TokoBaru,
): { ok: true; bersih: TokoBersih } | ({ ok: false } & Gagal) {
  const wa = rapikanNomorWa(data.wa_number);
  if (!wa) return gagal("invalid_wa_number", "Nomor WhatsApp tidak valid, contohnya 0813-1724-4671", "wa_number");

  const waLink = urlOpsional(data.wa_link);
  if (waLink === false) return gagal("invalid_wa_link", "Link WhatsApp harus diawali https://", "wa_link");

  const alamat: Record<string, string> = {};
  for (const [kolom, nama, min, maks] of ALAMAT) {
    const isi = teks(data[kolom]);
    if (isi.length < min || isi.length > maks) {
      return gagal("invalid_address", `${nama} harus ${min} sampai ${maks} huruf`, kolom);
    }
    alamat[kolom] = isi;
  }

  const kodePos = teks(data.postal_code);
  if (!/^[0-9]{5}$/.test(kodePos)) return gagal("invalid_postal_code", "Kode pos harus 5 angka", "postal_code");

  const maps = urlOpsional(data.maps_url);
  if (maps === false) return gagal("invalid_maps_url", "Link Google Maps harus diawali https://", "maps_url");

  const hari = [...new Set(data.open_days)].sort((a, b) => a - b);
  if (hari.length === 0 || hari.some((h) => !Number.isInteger(h) || h < 1 || h > 7)) {
    return gagal("invalid_open_days", "Pilih minimal satu hari buka", "open_days");
  }

  if (!POLA_JAM.test(data.opens_at) || !POLA_JAM.test(data.closes_at)) {
    return gagal("invalid_hours", "Jam buka dan tutup harus berformat JJ:MM", "hours");
  }
  if (data.opens_at >= data.closes_at) {
    return gagal("invalid_hours", "Jam tutup harus setelah jam buka", "hours");
  }

  if (data.social_links.length > SOSIAL_MAKS) {
    return gagal("too_many_social_links", `Maksimal ${SOSIAL_MAKS} link media sosial`, "social_links");
  }

  const sosial: TautanSosial[] = [];
  for (const s of data.social_links) {
    const label = teks(s.label);
    const url = teks(s.url);

    if (label.length < 2 || label.length > 30) {
      return gagal("invalid_social_link", "Nama media sosial harus 2 sampai 30 huruf", "social_links");
    }
    if (!POLA_URL.test(url)) {
      return gagal("invalid_social_link", `Link ${label} harus diawali https://`, "social_links");
    }
    sosial.push({ label, url });
  }

  return {
    ok: true,
    bersih: {
      wa_number: wa,
      wa_link: waLink,
      address_street: alamat.address_street,
      address_village: alamat.address_village,
      address_district: alamat.address_district,
      address_city: alamat.address_city,
      address_province: alamat.address_province,
      postal_code: kodePos,
      maps_url: maps,
      open_days: hari,
      opens_at: data.opens_at,
      closes_at: data.closes_at,
      closed_on_holidays: data.closed_on_holidays,
      social_links: sosial,
    },
  };
}
