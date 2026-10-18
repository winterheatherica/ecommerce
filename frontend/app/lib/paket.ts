import type { DimensiPaket } from "@/app/data/produk";

type KolomPaket = {
  package_weight_g?: number | null;
  package_length_cm?: number | null;
  package_width_cm?: number | null;
  package_height_cm?: number | null;
};

type ItemBerpaket = KolomPaket & { name_snapshot: string; qty: number };

export type RingkasanPaket = {
  beratG: number | null;
  dimensi: { teks: string; qty: number }[] | null;
  belumLengkap: string[];
};

export function dimensiPaket(k: KolomPaket): DimensiPaket | null {
  const { package_length_cm: p, package_width_cm: l, package_height_cm: t } = k;
  return p && l && t ? { p, l, t } : null;
}

export function teksDimensi(d: DimensiPaket): string {
  return `${d.p} × ${d.l} × ${d.t} cm`;
}

export function ringkasPaket(items: ItemBerpaket[]): RingkasanPaket {
  let berat = 0;
  const kelompok = new Map<string, number>();
  const belumLengkap: string[] = [];

  for (const it of items) {
    const d = dimensiPaket(it);

    if (!it.package_weight_g || !d) {
      belumLengkap.push(it.name_snapshot);
      continue;
    }

    berat += it.package_weight_g * it.qty;
    const teks = teksDimensi(d);
    kelompok.set(teks, (kelompok.get(teks) ?? 0) + it.qty);
  }

  if (belumLengkap.length > 0) return { beratG: null, dimensi: null, belumLengkap };

  return {
    beratG: berat,
    dimensi: [...kelompok].map(([teks, qty]) => ({ teks, qty })),
    belumLengkap,
  };
}
