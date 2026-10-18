export type BagianCaraPakai = {
  judul: string | null;
  poin: boolean;
  isi: string[];
};

const PANJANG_JUDUL = 40;
const JUDUL_POIN = /^(peringatan|catatan)\b/i;

export function uraiCaraPakai(teks: string | null | undefined): BagianCaraPakai[] {
  if (!teks) return [];

  const bagian: BagianCaraPakai[] = [];

  for (const baris of teks.split("\n").map((b) => b.trim()).filter(Boolean)) {
    if (baris.endsWith(":") && baris.length <= PANJANG_JUDUL) {
      const judul = baris.slice(0, -1).trim();
      bagian.push({ judul, poin: JUDUL_POIN.test(judul), isi: [] });
      continue;
    }

    if (bagian.length === 0) bagian.push({ judul: null, poin: false, isi: [] });
    bagian[bagian.length - 1].isi.push(baris);
  }

  return bagian.filter((b) => b.isi.length > 0);
}
