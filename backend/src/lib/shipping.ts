import { regions } from "../data/regions";

export type OpsiOngkir = {
  courier: string;
  service: string;
  cost: number;
  etd: string;
};

const ZONA: Record<string, number> = {
  "Jawa Barat": 1,
  "DKI Jakarta": 1,
  "Jawa Tengah": 2,
  "DI Yogyakarta": 2,
  "Jawa Timur": 2,
  Bali: 3,
  "Sumatera Utara": 4,
  "Sulawesi Selatan": 4,
};

const KURIR = [
  { courier: "JNE", service: "REG", faktor: 1.0, etd: ["1-2", "2-3", "3-4", "4-6"] },
  { courier: "J&T", service: "EZ", faktor: 0.92, etd: ["1-2", "2-3", "3-5", "4-7"] },
  { courier: "SiCepat", service: "BEST", faktor: 1.25, etd: ["1-1", "1-2", "2-3", "3-5"] },
];

export function opsiOngkir(destId: string, weightG: number): OpsiOngkir[] {
  const tujuan = regions.find((r) => r.id === destId);
  if (!tujuan) return [];

  const zona = ZONA[tujuan.province] ?? 3;
  const kg = Math.max(1, Math.ceil(weightG / 1000));
  const dasar = 9000 + (zona - 1) * 7000;

  return KURIR.map((k) => ({
    courier: k.courier,
    service: k.service,
    cost: Math.round((dasar * kg * k.faktor) / 500) * 500,
    etd: k.etd[zona - 1],
  }));
}

export function cariOpsi(
  destId: string,
  weightG: number,
  courier: string,
  service: string,
): OpsiOngkir | null {
  return (
    opsiOngkir(destId, weightG).find(
      (o) => o.courier === courier && o.service === service,
    ) ?? null
  );
}
