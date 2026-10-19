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

function heksIPv4(teks: string): string[] | null {
  const bagian = teks.split(".").map(Number);
  if (bagian.length !== 4 || bagian.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
    return null;
  }
  return [((bagian[0] << 8) | bagian[1]).toString(16), ((bagian[2] << 8) | bagian[3]).toString(16)];
}

function delapanGrup(ip: string): string[] | null {
  const dua = ip.split("::");
  if (dua.length > 2) return null;

  const pecah = (t: string) => (t ? t.split(":") : []);
  const kiri = pecah(dua[0]);
  const kanan = dua.length === 2 ? pecah(dua[1]) : [];
  const semua = [...kiri, ...kanan];

  const akhir = semua.at(-1);
  if (akhir?.includes(".")) {
    const ekor = heksIPv4(akhir);
    if (!ekor) return null;
    (kanan.length > 0 ? kanan : kiri).splice(-1, 1, ...ekor);
  }

  const kosong = 8 - kiri.length - kanan.length;
  if (dua.length === 2 ? kosong < 1 : kosong !== 0) return null;

  const grup = [...kiri, ...Array(Math.max(kosong, 0)).fill("0"), ...kanan];
  return grup.every((g) => /^[0-9a-f]{1,4}$/.test(g)) ? grup : null;
}

export function blokIp(ip: string): string {
  const s = ip.trim().toLowerCase().split("%")[0];
  if (!s.includes(":")) return s;

  const grup = delapanGrup(s);
  if (!grup) return s;

  const angka = grup.map((g) => parseInt(g, 16));
  if (angka.slice(0, 5).every((n) => n === 0) && angka[5] === 0xffff) {
    return [angka[6] >> 8, angka[6] & 255, angka[7] >> 8, angka[7] & 255].join(".");
  }

  return `${angka.slice(0, 4).map((n) => n.toString(16)).join(":")}::/64`;
}

export function blokPembeli(request: Request, env: Record<string, unknown> = {}): string {
  return blokIp(ipPembeli(request, zonaToko(env)));
}

export function kunciIp(
  request: Request,
  awalan: string,
  env: Record<string, unknown> = {},
): string {
  return `${awalan}:${blokPembeli(request, env)}`;
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
