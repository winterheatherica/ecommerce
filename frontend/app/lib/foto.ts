import type { Foto } from "@/app/data/produk";

export type FotoUnggahan = {
  cloudinary_id: string;
  version: number | null;
  width: number | null;
  height: number | null;
  url: string;
};

export type FotoAPI = FotoUnggahan & {
  id: number;
  alt: string | null;
  variant_slug: string | null;
};

export function petakanFoto(f: FotoAPI): Foto {
  return { id: f.id, url: f.url, alt: f.alt, varianSlug: f.variant_slug };
}
