export type Pembatas = {
  limit(opsi: { key: string }): Promise<{ success: boolean }>;
};

export const JALUR_BEBAS = ["/api/webhooks/", "/api/health"];

export function bebasDariBatas(pathname: string): boolean {
  return JALUR_BEBAS.some((j) => pathname.startsWith(j));
}

const POLA_IP_WORKERS = /^2a06:98c[0-7]:/i;
const POLA_IP = /^[0-9a-f:.]{2,45}$/i;

export function zonaToko(env: Record<string, unknown>): string | null {
  const alamat = env.STOREFRONT_URL;
  if (typeof alamat !== "string") return null;

  try {
    return new URL(alamat).hostname;
  } catch {
    return null;
  }
}

export function ipPembeli(request: Request, zona: string | null): string {
  const ip =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    "tanpa-ip";

  const dariToko =
    zona !== null &&
    request.headers.get("cf-worker") === zona &&
    POLA_IP_WORKERS.test(ip);

  if (!dariToko) return ip;

  const diteruskan = request.headers.get("x-toko-ip")?.trim() ?? "";
  return POLA_IP.test(diteruskan) ? diteruskan : ip;
}

export function kunciIp(
  request: Request,
  awalan: string,
  env: Record<string, unknown> = {},
): string {
  return `${awalan}:${ipPembeli(request, zonaToko(env))}`;
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
