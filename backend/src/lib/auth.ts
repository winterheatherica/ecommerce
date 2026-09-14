export type HasilPenjaga =
  | { lolos: true }
  | { lolos: false; status: number; badan: { error: string; message: string } };

const DITOLAK: HasilPenjaga = {
  lolos: false,
  status: 401,
  badan: {
    error: "unauthorized",
    message: "Endpoint admin butuh autentikasi",
  },
};

export function samaAman(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  let beda = 0;
  for (let i = 0; i < a.length; i++) {
    beda |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return beda === 0;
}

export function bacaBasic(header: string | undefined): string | undefined {
  if (!header) return undefined;

  const cocok = header.match(/^Basic\s+(.+)$/i);
  if (!cocok) return undefined;

  try {
    return atob(cocok[1].trim());
  } catch {
    return undefined;
  }
}

export function periksaAdmin(
  env: Record<string, unknown>,
  header?: string,
): HasilPenjaga {
  if (env.ADMIN_DEV_BYPASS === "true") return { lolos: true };

  const pengguna = env.ADMIN_USER;
  const sandi = env.ADMIN_PASSWORD;

  if (
    typeof pengguna !== "string" ||
    typeof sandi !== "string" ||
    !pengguna.trim() ||
    !sandi.trim()
  ) {
    return DITOLAK;
  }

  const dikirim = bacaBasic(header);
  if (!dikirim) return DITOLAK;

  const diharapkan = `${pengguna.trim()}:${sandi.trim()}`;

  return samaAman(dikirim, diharapkan) ? { lolos: true } : DITOLAK;
}
