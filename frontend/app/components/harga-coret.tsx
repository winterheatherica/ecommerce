import { rupiah } from "@/app/data/produk";

type Props = {
  harga: number;
  normal?: number;
  kelasHarga?: string;
  kecil?: boolean;
  kelasNormal?: string;
};

export function persenHemat(harga: number, normal: number): number {
  return Math.round((1 - harga / normal) * 100);
}

export default function HargaCoret({
  harga,
  normal,
  kelasHarga = "",
  kecil = false,
  kelasNormal = "text-stone-400",
}: Props) {
  const promo = normal !== undefined && normal > harga;

  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
      <span className={kelasHarga}>{rupiah(harga)}</span>
      {promo && (
        <>
          <s className={`${kelasNormal} ${kecil ? "text-xs lg:text-sm" : "text-sm"}`}>{rupiah(normal)}</s>
          <span
            className={`rounded-full bg-oranye-600 px-2 py-1 leading-none font-bold text-white ${
              kecil ? "text-[12px]" : "text-[13px]"
            }`}
          >
            -{persenHemat(harga, normal)}%
          </span>
        </>
      )}
    </span>
  );
}
