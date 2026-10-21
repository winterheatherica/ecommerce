import type { Pesanan } from "../db/pesanan";
import type { Lacak } from "./lacak";

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

function polaNama(nama: string): RegExp {
  return new RegExp(nama.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+"), "gi");
}

export function samarkanLacak(lacak: Lacak, nama: (string | null)[]): Lacak {
  const daftar = [...new Set(nama.map((n) => (n ?? "").trim()).filter((n) => n.length >= 3))]
    .sort((a, b) => b.length - a.length);

  const ganti = (teks: string) =>
    daftar.reduce((hasil, n) => hasil.replace(polaNama(n), () => samarkanNama(n)), teks);

  return {
    ...lacak,
    receiver: lacak.receiver ? samarkanNama(lacak.receiver) : null,
    events: lacak.events.map((e) => ({ ...e, description: ganti(e.description) })),
  };
}

export type PesananPublik = Omit<Pesanan, "user_id" | "payment_reference" | "tracking_error"> & {
  samar: boolean;
};

export function untukPublik(p: Pesanan, akses: "penuh" | "samar"): PesananPublik {
  const {
    user_id: _pemilik,
    payment_reference: _referensi,
    tracking_error: _galatLacak,
    ...sisa
  } = p;

  if (akses === "penuh") return { ...sisa, samar: false };

  return {
    ...sisa,
    customer_name: samarkanNama(p.customer_name),
    phone: samarkanHp(p.phone),
    email: null,
    address: "",
    notes: null,
    payment_url: null,
    tracking: p.tracking ? samarkanLacak(p.tracking, [p.tracking.receiver, p.customer_name]) : null,
    samar: true,
  };
}

export const BADAN_PERLU_MASUK = {
  error: "login_required",
  message: "Pesanan ini terhubung ke akun. Masuk dengan akun yang dipakai waktu memesan.",
};
