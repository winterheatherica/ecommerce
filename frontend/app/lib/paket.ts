import type { DimensiPaket } from "@/app/data/produk";

type KolomPaket = {
  package_weight_g?: number | null;
  package_length_cm?: number | null;
  package_width_cm?: number | null;
  package_height_cm?: number | null;
};

type ItemBerpaket = KolomPaket & {
  name_snapshot: string;
  qty: number;
  weight_g?: number | null;
};

export type RingkasanPaket = {
  beratG: number;
  dimensi: { teks: string; qty: number }[];
  tanpaDimensi: number;
  produkTanpaDimensi: string[];
};

export function beratKirim(v: { beratG: number; paketBeratG?: number | null }): number {
  return v.paketBeratG ?? v.beratG;
}

export function dimensiPaket(k: KolomPaket): DimensiPaket | null {
  const { package_length_cm: p, package_width_cm: l, package_height_cm: t } = k;
  return p && l && t ? { p, l, t } : null;
}

export function teksDimensi(d: DimensiPaket): string {
  return `${d.p} × ${d.l} × ${d.t} cm`;
}

export function ringkasPaket(items: ItemBerpaket[]): RingkasanPaket {
  let berat = 0;
  let tanpaDimensi = 0;
  const kelompok = new Map<string, number>();
  const produkTanpaDimensi: string[] = [];

  for (const it of items) {
    berat += (it.package_weight_g ?? it.weight_g ?? 0) * it.qty;

    const d = dimensiPaket(it);

    if (d) {
      const teks = teksDimensi(d);
      kelompok.set(teks, (kelompok.get(teks) ?? 0) + it.qty);
    } else {
      tanpaDimensi += it.qty;
      produkTanpaDimensi.push(it.name_snapshot);
    }
  }

  return {
    beratG: berat,
    dimensi: [...kelompok].map(([teks, qty]) => ({ teks, qty })),
    tanpaDimensi,
    produkTanpaDimensi,
  };
}
