export type StatusPesanan =
  | "PENDING"
  | "PAID"
  | "SHIPPED"
  | "DELIVERED"
  | "EXPIRED"
  | "CANCELLED";

const DIGIT_NOMOR = 12;

function digitAcak(terkecil: number): number {
  const rentang = 10 - terkecil;
  const batas = 256 - (256 % rentang);
  const bita = new Uint8Array(1);

  for (;;) {
    crypto.getRandomValues(bita);
    if (bita[0] < batas) return terkecil + (bita[0] % rentang);
  }
}

export function nomorPesananBaru(): string {
  let hasil = String(digitAcak(1));
  while (hasil.length < DIGIT_NOMOR) hasil += String(digitAcak(0));

  return `MNK-${hasil}`;
}

export function bersihkanHp(phone: string): string {
  return phone.replace(/[\s-]/g, "");
}

export function kedaluwarsa(
  status: StatusPesanan,
  expiresAt: string | null,
  sekarang = new Date(),
): boolean {
  if (status !== "PENDING" || !expiresAt) return false;
  return new Date(expiresAt) < sekarang;
}

export type ItemDiminta = { slug: string; qty: number };

export function gabungkanItem(items: ItemDiminta[]): ItemDiminta[] {
  const peta = new Map<string, number>();

  for (const item of items) {
    peta.set(item.slug, (peta.get(item.slug) ?? 0) + item.qty);
  }

  return [...peta.entries()]
    .map(([slug, qty]) => ({ slug, qty }))
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

const POLA_HP = /^(?:0|\+62)\d{8,13}$/;
const POLA_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const BATAS_RUPIAH = 2_000_000_000;

export function hpSah(phone: string): boolean {
  return POLA_HP.test(bersihkanHp(phone));
}

export function emailSah(email: string): boolean {
  return POLA_EMAIL.test(email.trim());
}

export const UMUR_PESANAN_JAM = 1;

export function umurPesananJam(env: Record<string, unknown>): number {
  const n = Number(env.UMUR_PESANAN_JAM);
  return Number.isFinite(n) && n > 0 && n <= 72 ? n : UMUR_PESANAN_JAM;
}
