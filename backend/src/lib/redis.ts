export type KonfigRedis = {
  url: string;
  token: string;
};

export function bacaKonfigRedis(
  env: Record<string, unknown>,
): KonfigRedis | undefined {
  const url = env.UPSTASH_REDIS_REST_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN;

  if (
    typeof url !== "string" ||
    typeof token !== "string" ||
    !url.trim() ||
    !token.trim()
  ) {
    return undefined;
  }

  return { url: url.trim().replace(/\/+$/, ""), token: token.trim() };
}

export function kunciWilayah(kata: string, batas: number): string {
  return `wilayah:${kata.trim().toLowerCase()}:${batas}`;
}

const BATAS_MS = 2000;

async function perintah(
  konfig: KonfigRedis,
  cmd: (string | number)[],
): Promise<unknown> {
  const res = await fetch(konfig.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${konfig.token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(cmd),
    signal: AbortSignal.timeout(BATAS_MS),
  });

  if (!res.ok) {
    throw new Error(`Upstash membalas ${res.status}`);
  }

  const isi = (await res.json()) as { result?: unknown; error?: string };

  if (isi.error) throw new Error(isi.error);

  return isi.result;
}

async function pipa(
  konfig: KonfigRedis,
  daftar: (string | number)[][],
): Promise<unknown[]> {
  const res = await fetch(`${konfig.url}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${konfig.token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(daftar),
    signal: AbortSignal.timeout(BATAS_MS),
  });

  if (!res.ok) {
    throw new Error(`Upstash membalas ${res.status}`);
  }

  const isi = (await res.json()) as { result?: unknown; error?: string }[];
  const galat = isi.find((b) => b.error);

  if (galat?.error) throw new Error(galat.error);

  return isi.map((b) => b.result);
}

export async function tambahHitungan(
  konfig: KonfigRedis | undefined,
  kunci: string,
  detik: number,
): Promise<number | null> {
  if (!konfig) return null;

  try {
    const [hasil] = await pipa(konfig, [
      ["INCR", kunci],
      ["EXPIRE", kunci, detik],
    ]);
    const n = Number(hasil);
    return Number.isFinite(n) ? n : null;
  } catch (e) {
    console.error("[redis] gagal menambah hitungan", kunci, e);
    return null;
  }
}

export async function bacaHitungan(
  konfig: KonfigRedis | undefined,
  kunci: string,
): Promise<number | null> {
  if (!konfig) return null;

  try {
    const hasil = await perintah(konfig, ["GET", kunci]);
    if (hasil === null || hasil === undefined) return 0;
    const n = Number(hasil);
    return Number.isFinite(n) ? n : null;
  } catch (e) {
    console.error("[redis] gagal membaca hitungan", kunci, e);
    return null;
  }
}

export async function ambilCache<T>(
  konfig: KonfigRedis | undefined,
  kunci: string,
): Promise<T | undefined> {
  if (!konfig) return undefined;

  try {
    const hasil = await perintah(konfig, ["GET", kunci]);

    if (typeof hasil !== "string") return undefined;

    return JSON.parse(hasil) as T;
  } catch (e) {
    console.error("[redis] gagal membaca", kunci, e);
    return undefined;
  }
}

export async function simpanCache(
  konfig: KonfigRedis | undefined,
  kunci: string,
  nilai: unknown,
  detik: number,
): Promise<void> {
  if (!konfig) return;

  try {
    await perintah(konfig, [
      "SET",
      kunci,
      JSON.stringify(nilai),
      "EX",
      detik,
    ]);
  } catch (e) {
    console.error("[redis] gagal menyimpan", kunci, e);
  }
}

export const UMUR_WILAYAH_DETIK = 30 * 24 * 60 * 60;

export const UMUR_KOSONG_DETIK = 10 * 60;

export function umurHasil(jumlah: number): number {
  return jumlah > 0 ? UMUR_WILAYAH_DETIK : UMUR_KOSONG_DETIK;
}
