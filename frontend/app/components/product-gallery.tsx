"use client";

import Image from "next/image";

import { usePilihanUkuran } from "@/app/components/pilihan-ukuran";

export default function ProductGallery({ nama, habis }: { nama: string; habis: boolean }) {
  const { foto, indeksFoto, setIndeksFoto } = usePilihanUkuran();
  const utama = foto[indeksFoto] ?? foto[0];

  return (
    <div>
      <div className="relative aspect-square overflow-hidden border border-brand-100 bg-brand-50">
        {utama ? (
          <Image
            src={utama.url}
            alt={utama.alt ?? nama}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center font-mono text-[13px] tracking-[0.2em] text-brand-300 uppercase">
            Foto produk
          </span>
        )}

        {habis && (
          <span className="absolute inset-0 flex items-center justify-center bg-white/70 font-mono text-xs tracking-[0.2em] text-ink uppercase">
            Stok habis
          </span>
        )}
      </div>

      {foto.length > 1 && (
        <ul className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-6">
          {foto.map((f, i) => {
            const aktif = i === indeksFoto;

            return (
              <li key={f.id}>
                <button
                  type="button"
                  onClick={() => setIndeksFoto(i)}
                  aria-label={`Lihat foto ${i + 1} dari ${foto.length}`}
                  aria-pressed={aktif}
                  className={`relative block aspect-square w-full overflow-hidden border bg-brand-50 transition-colors ${
                    aktif ? "border-brand-500" : "border-brand-100 hover:border-brand-300"
                  }`}
                >
                  <Image src={f.url} alt="" fill sizes="96px" className="object-cover" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
