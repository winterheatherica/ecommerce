import { base64url, tokenAcak } from "./sesi";

export type KonfigGoogle = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
};

const URL_OTORISASI = "https://accounts.google.com/o/oauth2/v2/auth";
const URL_TOKEN = "https://oauth2.googleapis.com/token";
const PENERBIT = new Set(["https://accounts.google.com", "accounts.google.com"]);

export const JALUR_CALLBACK = "/api/auth/google/callback";
export const COOKIE_OAUTH = "g_oauth";
export const JALUR_COOKIE_OAUTH = "/api/auth/google";

export function bacaKonfigGoogle(
  env: Record<string, unknown>,
  asalApi: string,
): KonfigGoogle | undefined {
  const clientId = env.GOOGLE_CLIENT_ID;
  const clientSecret = env.GOOGLE_CLIENT_SECRET;

  if (
    typeof clientId !== "string" ||
    typeof clientSecret !== "string" ||
    !clientId.trim() ||
    !clientSecret.trim()
  ) {
    return undefined;
  }

  return {
    clientId: clientId.trim(),
    clientSecret: clientSecret.trim(),
    redirectUri: `${asalApi.replace(/\/+$/, "")}${JALUR_CALLBACK}`,
  };
}

export async function tantanganPkce(verifier: string): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return base64url(new Uint8Array(hash));
}

export type JejakOauth = {
  state: string;
  verifier: string;
  nonce: string;
  next: string;
};

export function jejakBaru(next: string): JejakOauth {
  return { state: tokenAcak(24), verifier: tokenAcak(32), nonce: tokenAcak(24), next };
}

export function kemasJejak(j: JejakOauth): string {
  return base64url(new TextEncoder().encode(JSON.stringify(j)));
}

function dariBase64url(teks: string): Uint8Array {
  const biasa = teks.replace(/-/g, "+").replace(/_/g, "/");
  const biner = atob(biasa + "=".repeat((4 - (biasa.length % 4)) % 4));
  return Uint8Array.from(biner, (c) => c.charCodeAt(0));
}

export function bukaJejak(nilai: string | null): JejakOauth | null {
  if (!nilai) return null;

  try {
    const j = JSON.parse(new TextDecoder().decode(dariBase64url(nilai))) as Partial<JejakOauth>;
    if (
      typeof j.state !== "string" ||
      typeof j.verifier !== "string" ||
      typeof j.nonce !== "string" ||
      typeof j.next !== "string"
    ) {
      return null;
    }
    return { state: j.state, verifier: j.verifier, nonce: j.nonce, next: j.next };
  } catch {
    return null;
  }
}

export async function urlMasuk(konfig: KonfigGoogle, jejak: JejakOauth): Promise<string> {
  const q = new URLSearchParams({
    client_id: konfig.clientId,
    redirect_uri: konfig.redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state: jejak.state,
    nonce: jejak.nonce,
    code_challenge: await tantanganPkce(jejak.verifier),
    code_challenge_method: "S256",
    prompt: "select_account",
  });

  return `${URL_OTORISASI}?${q}`;
}

export type HasilTukar =
  | { ok: true; idToken: string }
  | { ok: false; pesan: string };

export async function tukarKode(
  konfig: KonfigGoogle,
  kode: string,
  verifier: string,
): Promise<HasilTukar> {
  try {
    const res = await fetch(URL_TOKEN, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: kode,
        client_id: konfig.clientId,
        client_secret: konfig.clientSecret,
        redirect_uri: konfig.redirectUri,
        grant_type: "authorization_code",
        code_verifier: verifier,
      }),
      signal: AbortSignal.timeout(10000),
    });

    const isi = (await res.json().catch(() => null)) as {
      id_token?: string;
      error?: string;
      error_description?: string;
    } | null;

    if (!res.ok || !isi?.id_token) {
      return {
        ok: false,
        pesan: isi?.error_description || isi?.error || `Google menolak (${res.status})`,
      };
    }

    return { ok: true, idToken: isi.id_token };
  } catch (e) {
    console.error("[google] penukaran kode gagal", e);
    return { ok: false, pesan: "Google tidak merespons tepat waktu" };
  }
}

export type Klaim = {
  iss?: string;
  aud?: string | string[];
  sub?: string;
  email?: string;
  email_verified?: boolean | string;
  name?: string;
  given_name?: string;
  exp?: number;
  nonce?: string;
};

export function bacaIdToken(idToken: string): Klaim | null {
  const bagian = idToken.split(".");
  if (bagian.length !== 3) return null;

  try {
    return JSON.parse(new TextDecoder().decode(dariBase64url(bagian[1]))) as Klaim;
  } catch {
    return null;
  }
}

export type ProfilGoogle = { sub: string; email: string; name: string };

export type HasilKlaim =
  | { ok: true; profil: ProfilGoogle }
  | { ok: false; alasan: string };

export function periksaKlaim(
  klaim: Klaim | null,
  harapan: { clientId: string; nonce: string; sekarang: Date },
): HasilKlaim {
  if (!klaim) return { ok: false, alasan: "id_token tidak terbaca" };
  if (!klaim.iss || !PENERBIT.has(klaim.iss)) return { ok: false, alasan: "penerbit salah" };

  const aud = Array.isArray(klaim.aud) ? klaim.aud : [klaim.aud];
  if (!aud.includes(harapan.clientId)) return { ok: false, alasan: "audiens salah" };

  if (typeof klaim.exp !== "number" || klaim.exp * 1000 <= harapan.sekarang.getTime()) {
    return { ok: false, alasan: "id_token kedaluwarsa" };
  }

  if (klaim.nonce !== harapan.nonce) return { ok: false, alasan: "nonce tidak cocok" };
  if (!klaim.sub) return { ok: false, alasan: "sub kosong" };

  if (!klaim.email || (klaim.email_verified !== true && klaim.email_verified !== "true")) {
    return { ok: false, alasan: "email belum diverifikasi Google" };
  }

  const nama = (klaim.name || klaim.given_name || klaim.email.split("@")[0]).trim();

  return {
    ok: true,
    profil: { sub: klaim.sub, email: klaim.email.trim().toLowerCase(), name: nama.slice(0, 120) },
  };
}
