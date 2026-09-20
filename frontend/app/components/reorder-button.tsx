"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { tambahKeKeranjang } from "@/app/lib/keranjang";

type Item = { slug: string; qty: number; name_snapshot: string };

type Props = {
  items: Item[];
  tersedia: string[] | null;
  label?: string;
};

export default function ReorderButton({ items, tersedia, label }: Props) {
  const router = useRouter();
  const [memproses, setMemproses] = useState(false);

  const bisa = tersedia
    ? items.filter((i) => tersedia.includes(i.slug))
    : items;
  const hilang = items.length - bisa.length;

  if (bisa.length === 0) {
    return (
      <p className="mt-6 text-sm text-stone-500">
        Produk di pesanan ini sudah tidak dijual lagi.
      </p>
    );
  }

  const pesanLagi = () => {
    setMemproses(true);
    for (const i of bisa) tambahKeKeranjang(i.slug, i.qty);
    router.push("/keranjang");
  };

  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={pesanLagi}
        disabled={memproses}
        className="border border-brand-500 bg-brand-500 px-8 py-3.5 font-mono text-[11px] tracking-[0.22em] text-white uppercase transition-colors hover:border-brand-600 hover:bg-brand-600 disabled:cursor-not-allowed disabled:border-stone-300 disabled:bg-stone-300"
      >
        {memproses ? "Menyiapkan..." : (label ?? "Pesan lagi")}
      </button>

      {hilang > 0 && (
        <p className="mt-3 text-sm text-stone-500">
          {hilang} dari {items.length} produk sudah tidak dijual dan tidak ikut
          dimasukkan.
        </p>
      )}
    </div>
  );
}
