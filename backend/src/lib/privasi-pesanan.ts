import type { Pesanan } from "../db/pesanan";

export type Akses = "penuh" | "samar" | "tolak";

export function aksesPesanan(pemilik: number | null, peminta: number | null): Akses {
  if (pemilik === null) return "samar";
  return peminta === pemilik ? "penuh" : "tolak";
}

export function samarkanNama(nama: string): string {
  const kata = nama.trim().split(/\s+/).filter(Boolean);
  if (kata.length <= 1) return kata[0] ?? "";

  return `${kata[0]} ${kata[kata.length - 1][0].toUpperCase()}.`;
}

export function samarkanHp(hp: string): string {
  const angka = hp.replace(/\D/g, "");
  if (angka.length < 8) return "*".repeat(angka.length);

  return `${angka.slice(0, 4)}-****-${angka.slice(-4)}`;
}

export type PesananPublik = Omit<Pesanan, "user_id" | "payment_reference"> & {
  samar: boolean;
};

export function untukPublik(p: Pesanan, akses: "penuh" | "samar"): PesananPublik {
  const { user_id: _pemilik, payment_reference: _referensi, ...sisa } = p;

  if (akses === "penuh") return { ...sisa, samar: false };

  return {
    ...sisa,
    customer_name: samarkanNama(p.customer_name),
    phone: samarkanHp(p.phone),
    email: null,
    address: "",
    notes: null,
    payment_url: null,
    samar: true,
  };
}

export const BADAN_PERLU_MASUK = {
  error: "login_required",
  message: "Pesanan ini terhubung ke akun. Masuk dengan akun yang dipakai waktu memesan.",
};
