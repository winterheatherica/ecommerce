export type StatusPesanan =
  | "PENDING"
  | "PAID"
  | "SHIPPED"
  | "DELIVERED"
  | "EXPIRED"
  | "CANCELLED";

const ALFABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function nomorPesananBaru(): string {
  let hasil = "";
  const acak = new Uint8Array(8);
  crypto.getRandomValues(acak);

  for (const b of acak) {
    hasil += ALFABET[b % ALFABET.length];
  }

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
