export const BADAN_ADMIN_DITOLAK = {
  error: "unauthorized",
  message: "Endpoint admin butuh autentikasi",
};

export function samaAman(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  let beda = 0;
  for (let i = 0; i < a.length; i++) {
    beda |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return beda === 0;
}

export function bypassAdmin(env: Record<string, unknown>): boolean {
  return env.ADMIN_DEV_BYPASS === "true";
}

export function kredensialAdminCocok(
  env: Record<string, unknown>,
  pengguna: string,
  sandi: string,
): boolean {
  const benarPengguna = env.ADMIN_USER;
  const benarSandi = env.ADMIN_PASSWORD;

  if (
    typeof benarPengguna !== "string" ||
    typeof benarSandi !== "string" ||
    !benarPengguna.trim() ||
    !benarSandi.trim()
  ) {
    return false;
  }

  const cocokPengguna = samaAman(pengguna.trim(), benarPengguna.trim());
  const cocokSandi = samaAman(sandi, benarSandi.trim());

  return cocokPengguna && cocokSandi;
}
