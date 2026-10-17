export const COOKIE_SESI = "sid";
export const UMUR_SESI_HARI = 30;

export function base64url(bita: Uint8Array): string {
  let biner = "";
  for (const b of bita) biner += String.fromCharCode(b);
  return btoa(biner).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function tokenAcak(panjang = 32): string {
  return base64url(crypto.getRandomValues(new Uint8Array(panjang)));
}

export async function hashToken(token: string): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function bacaCookie(header: string | null | undefined, nama: string): string | null {
  if (!header) return null;

  for (const bagian of header.split(";")) {
    const pisah = bagian.indexOf("=");
    if (pisah === -1) continue;

    if (bagian.slice(0, pisah).trim() === nama) {
      const nilai = bagian.slice(pisah + 1).trim();
      return nilai || null;
    }
  }

  return null;
}

export type OpsiCookie = { maxAge: number; path?: string; domain?: string };

export function cookie(nama: string, nilai: string, opsi: OpsiCookie): string {
  return [
    `${nama}=${nilai}`,
    `Path=${opsi.path ?? "/"}`,
    ...(opsi.domain ? [`Domain=${opsi.domain}`] : []),
    `Max-Age=${opsi.maxAge}`,
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
  ].join("; ");
}

export function hapusCookie(nama: string, opsi: Omit<OpsiCookie, "maxAge"> = {}): string {
  return cookie(nama, "", { ...opsi, maxAge: 0 });
}

export function domainCookie(env: Record<string, unknown>): string | undefined {
  const d = env.COOKIE_DOMAIN;
  return typeof d === "string" && d.trim() ? d.trim() : undefined;
}

export function tujuanAman(next: string | null | undefined, cadangan = "/akun"): string {
  if (!next || next.length > 200) return cadangan;
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return cadangan;
  if (/[\u0000-\u001f\\]/.test(next)) return cadangan;
  return next;
}
