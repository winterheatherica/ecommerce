import type { PresisiUlasan, SumberUlasan, Ulasan } from "@/app/data/produk";

export type UlasanAPI = {
  id: number;
  source: SumberUlasan;
  rating: number;
  author_name: string;
  body: string | null;
  follow_up: string | null;
  follow_up_at: string | null;
  reviewed_at: string;
  reviewed_precision?: PresisiUlasan;
  source_product?: string | null;
  source_url?: string | null;
  variant_slug: string;
  variant_label: string;
  is_hidden?: boolean;
};

export const ULASAN_PER_HALAMAN = 30;

export function petakanUlasan(r: UlasanAPI): Ulasan {
  return {
    id: r.id,
    sumber: r.source,
    bintang: r.rating,
    nama: r.author_name,
    teks: r.body,
    susulan: r.follow_up,
    susulanPada: r.follow_up_at,
    pada: r.reviewed_at,
    presisi: r.reviewed_precision ?? "day",
    produkAsal: r.source_product ?? null,
    urlAsal: r.source_url ?? null,
    ukuran: r.variant_label,
    ukuranSlug: r.variant_slug,
    tersembunyi: r.is_hidden,
  };
}

export function tanggalUlasan(iso: string, presisi: PresisiUlasan): string {
  if (presisi === "over_year") return "Lebih dari setahun lalu";

  const tanggal = new Date(iso);

  if (presisi === "month") {
    return tanggal.toLocaleDateString("id-ID", { month: "short", year: "numeric", timeZone: "Asia/Jakarta" });
  }

  return tanggal.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });
}

export async function ambilUlasanLanjutan(
  jalur: string,
  offset: number,
): Promise<Ulasan[]> {
  const res = await fetch(`${jalur}?offset=${offset}&limit=${ULASAN_PER_HALAMAN}`, { cache: "no-store" });

  if (!res.ok) throw new Error(`Gagal memuat ulasan (${res.status})`);

  return ((await res.json()) as { data: UlasanAPI[] }).data.map(petakanUlasan);
}
