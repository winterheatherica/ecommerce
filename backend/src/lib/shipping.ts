import type { OpsiRO } from "./rajaongkir";

export type OpsiOngkir = {
  courier: string;
  service: string;
  cost: number;
  etd: string;
};

export const KURIR_BAWAAN = "jne:jnt:sicepat";
export const UMUR_TARIF_JAM = 24;

export function kurirDipakai(env: Record<string, unknown>): string {
  const pilihan = env.RAJAONGKIR_KURIR;
  return typeof pilihan === "string" && pilihan.trim()
    ? pilihan.trim()
    : KURIR_BAWAAN;
}

export function rapikanEtd(etd: string | null | undefined): string {
  const bersih = (etd ?? "")
    .replace(/days?|hari/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!bersih) return "-";
  if (bersih === "0") return "hari ini";

  return `${bersih} hari`;
}

export function petakanOpsi(daftar: OpsiRO[]): OpsiOngkir[] {
  return daftar
    .filter((o) => Number.isFinite(o.cost) && o.cost > 0)
    .map((o) => ({
      courier: (o.code || o.name).toUpperCase(),
      service: o.service,
      cost: o.cost,
      etd: rapikanEtd(o.etd),
    }))
    .sort((a, b) => a.cost - b.cost);
}

export function cariOpsi(
  daftar: OpsiOngkir[],
  courier: string,
  service: string,
): OpsiOngkir | null {
  return (
    daftar.find((o) => o.courier === courier && o.service === service) ?? null
  );
}
