const NAMA_KURIR: Record<string, string> = {
  JNE: "JNE",
  JNT: "J&T",
  "J&T": "J&T",
  SICEPAT: "SiCepat",
};

const NAMA_LAYANAN: Record<string, Record<string, string>> = {
  JNE: {
    REG: "Reguler",
    CTC: "Reguler",
    YES: "YES",
    CTCYES: "YES",
    SPS: "Super Speed",
    CTCSPS: "Super Speed",
    OKE: "OKE",
    CTCOKE: "OKE",
  },
  "J&T": { EZ: "Reguler" },
};

export function namaKurir(kode: string): string {
  return NAMA_KURIR[kode.trim().toUpperCase()] ?? kode;
}

export function namaLayanan(kurir: string, layanan: string): string {
  const k = namaKurir(kurir);
  return `${k} ${NAMA_LAYANAN[k.toUpperCase()]?.[layanan.trim().toUpperCase()] ?? layanan}`;
}
