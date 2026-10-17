import { rupiah } from "@/app/data/produk";

type Props = {
  harga: number;
  normal?: number;
  kelasHarga?: string;
  kecil?: boolean;
};

export function persenHemat(harga: number, normal: number): number {
  return Math.round((1 - harga / normal) * 100);
}

export default function HargaCoret({ harga, normal, kelasHarga = "", kecil = false }: Props) {
  const promo = normal !== undefined && normal > harga;

  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
      <span className={kelasHarga}>{rupiah(harga)}</span>
      {promo && (
        <>
          <s className={`text-stone-400 ${kecil ? "text-xs" : "text-sm"}`}>{rupiah(normal)}</s>
          <span
            className={`bg-red-600 px-1.5 py-0.5 font-mono font-semibold leading-none text-white ${
              kecil ? "text-[10px]" : "text-[11px]"
            }`}
          >
            -{persenHemat(harga, normal)}%
          </span>
        </>
      )}
    </span>
  );
}
