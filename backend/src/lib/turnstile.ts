const ALAMAT_PERIKSA = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const BATAS_MS = 8000;

export type KonfigTurnstile = { siteKey: string; secret: string };

export function bacaKonfigTurnstile(env: Record<string, unknown>): KonfigTurnstile | null {
  const siteKey = env.TURNSTILE_SITE_KEY;
  const secret = env.TURNSTILE_SECRET_KEY;

  if (typeof siteKey !== "string" || typeof secret !== "string") return null;
  if (!siteKey.trim() || !secret.trim()) return null;

  return { siteKey: siteKey.trim(), secret: secret.trim() };
}

export async function periksaTurnstile(
  secret: string,
  token: string | null | undefined,
  ip: string | null,
): Promise<boolean> {
  if (!token) return false;

  const badan = new URLSearchParams({ secret, response: token });
  if (ip) badan.set("remoteip", ip);

  try {
    const res = await fetch(ALAMAT_PERIKSA, {
      method: "POST",
      body: badan,
      signal: AbortSignal.timeout(BATAS_MS),
    });
    const isi = (await res.json().catch(() => null)) as {
      success?: boolean;
      "error-codes"?: string[];
    } | null;

    if (res.ok && isi?.success === true) return true;

    console.warn("[turnstile] ditolak", res.status, isi?.["error-codes"] ?? []);
    return false;
  } catch (e) {
    console.error("[turnstile] tidak merespons", e);
    return false;
  }
}
