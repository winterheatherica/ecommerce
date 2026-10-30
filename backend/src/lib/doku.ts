import { samaAman } from "./auth";

export type KonfigDoku = {
  clientId: string;
  secretKey: string;
  sandbox: boolean;
};

const DASAR_SANDBOX = "https://api-sandbox.doku.com";
const DASAR_PRODUKSI = "https://api.doku.com";

export const JALUR_CHECKOUT = "/checkout/v1/payment";
export const JALUR_STATUS = "/orders/v1/status";
export const JALUR_NOTIFIKASI = "/api/webhooks/doku";

export type KabarDoku = {
  order?: { invoice_number?: string; amount?: number | string };
  transaction?: { status?: string; date?: string };
  channel?: { id?: string };
  service?: { id?: string };
};

export const METODE_BAYAR = [
  { code: "QRIS", name: "QRIS", group: "QR" },
  { code: "VIRTUAL_ACCOUNT_BNI", name: "BNI", group: "Virtual Account" },
  { code: "VIRTUAL_ACCOUNT_BRI", name: "BRI", group: "Virtual Account" },
  { code: "VIRTUAL_ACCOUNT_BANK_MANDIRI", name: "Mandiri", group: "Virtual Account" },
  { code: "VIRTUAL_ACCOUNT_BANK_SYARIAH_MANDIRI", name: "BSI", group: "Virtual Account" },
  { code: "VIRTUAL_ACCOUNT_BANK_CIMB", name: "CIMB Niaga", group: "Virtual Account" },
  { code: "VIRTUAL_ACCOUNT_BANK_PERMATA", name: "Permata", group: "Virtual Account" },
  { code: "VIRTUAL_ACCOUNT_BANK_DANAMON", name: "Danamon", group: "Virtual Account" },
  { code: "VIRTUAL_ACCOUNT_BTN", name: "BTN", group: "Virtual Account" },
  { code: "VIRTUAL_ACCOUNT_DOKU", name: "DOKU", group: "Virtual Account" },
  { code: "ONLINE_TO_OFFLINE_INDOMARET", name: "Indomaret", group: "Minimarket" },
  { code: "ONLINE_TO_OFFLINE_ALFA", name: "Alfamart", group: "Minimarket" },
] as const;

const NAMA_METODE: Record<string, string> = {
  QRIS: "QRIS",
  VIRTUAL_ACCOUNT_BCA: "BCA Virtual Account",
  VIRTUAL_ACCOUNT_BNI: "BNI Virtual Account",
  VIRTUAL_ACCOUNT_BRI: "BRI Virtual Account",
  VIRTUAL_ACCOUNT_BANK_MANDIRI: "Mandiri Virtual Account",
  VIRTUAL_ACCOUNT_BANK_SYARIAH_MANDIRI: "BSI Virtual Account",
  VIRTUAL_ACCOUNT_BANK_CIMB: "CIMB Niaga Virtual Account",
  VIRTUAL_ACCOUNT_BANK_PERMATA: "Permata Virtual Account",
  VIRTUAL_ACCOUNT_BANK_DANAMON: "Danamon Virtual Account",
  VIRTUAL_ACCOUNT_BTN: "BTN Virtual Account",
  VIRTUAL_ACCOUNT_DOKU: "DOKU Virtual Account",
  ONLINE_TO_OFFLINE_INDOMARET: "Indomaret",
  ONLINE_TO_OFFLINE_ALFA: "Alfamart",
  EMONEY_OVO: "OVO",
  EMONEY_DANA: "DANA",
};

export function dasarDoku(konfig: KonfigDoku): string {
  return konfig.sandbox ? DASAR_SANDBOX : DASAR_PRODUKSI;
}

export function bacaKonfig(env: Record<string, unknown>): KonfigDoku | undefined {
  const clientId = env.DOKU_CLIENT_ID;
  const secretKey = env.DOKU_SECRET_KEY;

  if (
    typeof clientId !== "string" ||
    typeof secretKey !== "string" ||
    !clientId.trim() ||
    !secretKey.trim()
  ) {
    return undefined;
  }

  return {
    clientId: clientId.trim(),
    secretKey: secretKey.trim(),
    sandbox: env.DOKU_SANDBOX !== "false",
  };
}

function keBase64(bita: ArrayBuffer): string {
  let biner = "";
  for (const b of new Uint8Array(bita)) biner += String.fromCharCode(b);
  return btoa(biner);
}

export async function digestBadan(badan: string): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(badan));
  return keBase64(hash);
}

export function stempelWaktu(waktu: Date): string {
  return `${waktu.toISOString().slice(0, 19)}Z`;
}

export type Komponen = {
  clientId: string;
  requestId: string;
  timestamp: string;
  target: string;
  digest?: string;
};

export function stringKomponen(k: Komponen): string {
  const baris = [
    `Client-Id:${k.clientId}`,
    `Request-Id:${k.requestId}`,
    `Request-Timestamp:${k.timestamp}`,
    `Request-Target:${k.target}`,
  ];

  if (k.digest !== undefined) baris.push(`Digest:${k.digest}`);

  return baris.join("\n");
}

export async function tandaTangan(secretKey: string, komponen: string): Promise<string> {
  const enc = new TextEncoder();
  const kunci = await crypto.subtle.importKey(
    "raw",
    enc.encode(secretKey),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const hasil = await crypto.subtle.sign("HMAC", kunci, enc.encode(komponen));
  return `HMACSHA256=${keBase64(hasil)}`;
}

export async function kepalaPermintaan(
  konfig: KonfigDoku,
  target: string,
  badan: string | null,
  requestId: string,
  waktu: Date,
): Promise<Record<string, string>> {
  const timestamp = stempelWaktu(waktu);
  const digest = badan === null ? undefined : await digestBadan(badan);

  const signature = await tandaTangan(
    konfig.secretKey,
    stringKomponen({ clientId: konfig.clientId, requestId, timestamp, target, digest }),
  );

  return {
    "Client-Id": konfig.clientId,
    "Request-Id": requestId,
    "Request-Timestamp": timestamp,
    Signature: signature,
  };
}

export type KepalaNotifikasi = {
  clientId?: string;
  requestId?: string;
  timestamp?: string;
  signature?: string;
};

export async function notifikasiSah(
  konfig: KonfigDoku,
  kepala: KepalaNotifikasi,
  badanMentah: string,
  target: string,
): Promise<boolean> {
  const { clientId, requestId, timestamp, signature } = kepala;

  if (!clientId || !requestId || !timestamp || !signature) return false;
  if (!samaAman(clientId, konfig.clientId)) return false;

  const diharapkan = await tandaTangan(
    konfig.secretKey,
    stringKomponen({
      clientId,
      requestId,
      timestamp,
      target,
      digest: await digestBadan(badanMentah),
    }),
  );

  return samaAman(signature, diharapkan);
}

export function namaMetode(channelId?: string | null): string | null {
  if (!channelId) return null;
  return NAMA_METODE[channelId] ?? channelId;
}

export function teksAmanDoku(teks: string, cadangan: string): string {
  const bersih = teks
    .normalize("NFKD")
    .replace(/[̀-ͯ'’`]/g, "")
    .replace(/[^A-Za-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return bersih || cadangan;
}

export function hpInternasional(hp: string): string {
  const angka = hp.replace(/\D/g, "");
  if (angka.startsWith("62")) return angka;
  if (angka.startsWith("0")) return `62${angka.slice(1)}`;
  return angka;
}

export const CADANGAN_MENIT = 5;

export function menitBayar(kedaluwarsa: string | null, sekarang: Date): number {
  if (!kedaluwarsa) return 60;

  const sisa = Math.floor(
    (new Date(kedaluwarsa).getTime() - sekarang.getTime()) / 60000,
  );

  return Math.max(1, sisa - CADANGAN_MENIT);
}
