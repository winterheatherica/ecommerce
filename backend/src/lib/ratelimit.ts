export type Pembatas = {
  limit(opsi: { key: string }): Promise<{ success: boolean }>;
};

export const JALUR_BEBAS = ["/api/webhooks/", "/api/health"];

export function bebasDariBatas(pathname: string): boolean {
  return JALUR_BEBAS.some((j) => pathname.startsWith(j));
}

export function kunciIp(request: Request, awalan: string): string {
  const ip =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    "tanpa-ip";

  return `${awalan}:${ip}`;
}

export function ambilPembatas(
  env: Record<string, unknown>,
  nama: string,
): Pembatas | undefined {
  const calon = env[nama];

  if (
    typeof calon === "object" &&
    calon !== null &&
    typeof (calon as Pembatas).limit === "function"
  ) {
    return calon as Pembatas;
  }

  return undefined;
}

export async function lolos(
  pembatas: Pembatas | undefined,
  kunci: string,
): Promise<boolean> {
  if (!pembatas) return true;

  const { success } = await pembatas.limit({ key: kunci });
  return success;
}

export const BADAN_PADAT = {
  error: "too_many_requests",
  message: "Terlalu banyak permintaan. Tunggu sebentar lalu coba lagi.",
};
