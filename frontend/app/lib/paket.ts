import type { DimensiPaket } from "@/app/data/produk";

type KolomDimensi = {
  package_length_cm?: number | null;
  package_width_cm?: number | null;
  package_height_cm?: number | null;
};

type ItemBerpaket = {
  qty: number;
  weight_g?: number | null;
  package_weight_g?: number | null;
};

export function beratKirim(v: { beratG: number; paketBeratG?: number | null }): number {
  return v.paketBeratG ?? v.beratG;
}

export function dimensiPaket(k: KolomDimensi): DimensiPaket | null {
  const { package_length_cm: p, package_width_cm: l, package_height_cm: t } = k;
  return p && l && t ? { p, l, t } : null;
}

export function beratPaket(items: ItemBerpaket[]): number {
  return items.reduce((s, it) => s + (it.package_weight_g ?? it.weight_g ?? 0) * it.qty, 0);
}
