export type StatusPesanan =
  | "PENDING"
  | "PAID"
  | "SHIPPED"
  | "DELIVERED"
  | "EXPIRED"
  | "CANCELLED";

export const statusLabel: Record<StatusPesanan, string> = {
  PENDING: "Menunggu bayar",
  PAID: "Perlu dikirim",
  SHIPPED: "Dikirim",
  DELIVERED: "Selesai",
  EXPIRED: "Kedaluwarsa",
  CANCELLED: "Dibatalkan",
};

export const statusWarna: Record<StatusPesanan, string> = {
  PENDING: "border-amber-300 bg-amber-50 text-amber-800",
  PAID: "border-brand-300 bg-brand-50 text-brand-700",
  SHIPPED: "border-accent-300 bg-accent-50 text-accent-700",
  DELIVERED: "border-emerald-300 bg-emerald-50 text-emerald-700",
  EXPIRED: "border-stone-300 bg-stone-100 text-stone-500",
  CANCELLED: "border-stone-300 bg-stone-100 text-stone-500",
};
