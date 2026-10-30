export const kelasLabel = "block font-mono text-[12px] tracking-[0.2em] text-stone-500 uppercase";

export const kelasKotak =
  "mt-2 w-full border border-ink/15 bg-white px-4 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-stone-400 focus:border-brand-500 disabled:bg-stone-100";

export const kelasTombolKecil =
  "border border-ink/15 px-2.5 py-1.5 font-mono text-[11px] tracking-[0.14em] indent-[0.14em] text-stone-600 uppercase transition-colors hover:border-brand-500 hover:text-brand-600 disabled:cursor-not-allowed disabled:border-ink/10 disabled:text-stone-300";

export const kelasTombolUtama =
  "border border-brand-500 bg-brand-500 px-8 py-3 font-mono text-[13px] tracking-[0.2em] indent-[0.2em] text-white uppercase transition-colors hover:border-brand-600 hover:bg-brand-600 disabled:cursor-not-allowed disabled:border-stone-300 disabled:bg-stone-300";

export const kelasTombolTambah =
  "border border-dashed border-ink/25 px-5 py-2.5 font-mono text-[12px] tracking-[0.16em] indent-[0.16em] text-stone-600 uppercase transition-colors hover:border-brand-500 hover:text-brand-600 disabled:cursor-not-allowed disabled:text-stone-300";

export function pindahkan<T>(daftar: T[], dari: number, ke: number): T[] {
  if (ke < 0 || ke >= daftar.length) return daftar;

  const baru = [...daftar];
  const [item] = baru.splice(dari, 1);
  baru.splice(ke, 0, item);
  return baru;
}

export function keSlug(teks: string): string {
  return teks
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function slugIkutNama(slugLama: string, namaLama: string, namaBaru: string): string {
  return slugLama === "" || slugLama === keSlug(namaLama) ? keSlug(namaBaru) : slugLama;
}
