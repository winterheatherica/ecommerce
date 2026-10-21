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

export type UrutanUlasan = "lengkap" | "terbaru" | "terlama" | "bintang_tinggi" | "bintang_rendah";

export const PILIHAN_URUTAN: { nilai: UrutanUlasan; label: string }[] = [
  { nilai: "lengkap", label: "Paling lengkap" },
  { nilai: "terbaru", label: "Terbaru" },
  { nilai: "terlama", label: "Terlama" },
  { nilai: "bintang_tinggi", label: "Bintang tertinggi" },
  { nilai: "bintang_rendah", label: "Bintang terendah" },
];

export type SaringanUlasan = {
  urut: UrutanUlasan;
  bintang: number | null;
  sumber: SumberUlasan | null;
  ukuran: string | null;
};

export const SARINGAN_AWAL: SaringanUlasan = { urut: "lengkap", bintang: null, sumber: null, ukuran: null };

export function saringanAwal(s: SaringanUlasan): boolean {
  return s.urut === "lengkap" && s.bintang === null && s.sumber === null && s.ukuran === null;
}

export async function ambilUlasanLanjutan(
  jalur: string,
  offset: number,
  saringan: SaringanUlasan = SARINGAN_AWAL,
): Promise<{ data: Ulasan[]; total: number }> {
  const q = new URLSearchParams({ offset: String(offset), limit: String(ULASAN_PER_HALAMAN), urut: saringan.urut });
  if (saringan.bintang) q.set("bintang", String(saringan.bintang));
  if (saringan.sumber) q.set("sumber", saringan.sumber);
  if (saringan.ukuran) q.set("ukuran", saringan.ukuran);

  const res = await fetch(`${jalur}?${q}`, { cache: "no-store" });

  if (!res.ok) throw new Error(`Gagal memuat ulasan (${res.status})`);

  const isi = (await res.json()) as { data: UlasanAPI[]; total: number };
  return { data: isi.data.map(petakanUlasan), total: isi.total };
}
