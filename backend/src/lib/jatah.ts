import { bacaHitungan, bacaKonfigRedis, tambahHitungan } from "./redis";

export const JATAH_RAJAONGKIR_HARIAN = 80;
export const JATAH_RAJAONGKIR_PER_IP = 30;
export const MAKS_PESANAN_PER_IP = 10;

const DETIK_HARI = 24 * 3600;
const DETIK_EMBER_PESANAN = 6 * 3600;

function angkaEnv(env: Record<string, unknown>, nama: string, bawaan: number): number {
  const n = Number(env[nama]);
  return Number.isInteger(n) && n > 0 ? n : bawaan;
}

export function tanggalWib(sekarang: Date): string {
  return new Date(sekarang.getTime() + 7 * 3600 * 1000).toISOString().slice(0, 10);
}

function emberPesanan(sekarang: Date): number {
  return Math.floor(sekarang.getTime() / (DETIK_EMBER_PESANAN * 1000));
}

export async function pakaiJatahRajaOngkir(
  env: Record<string, unknown>,
  blok: string,
  sekarang: Date = new Date(),
): Promise<boolean> {
  const redis = bacaKonfigRedis(env);
  if (!redis) return true;

  const hari = tanggalWib(sekarang);

  const perIp = await tambahHitungan(redis, `jatah:rajaongkir:${hari}:${blok}`, 2 * DETIK_HARI);
  if (perIp !== null && perIp > angkaEnv(env, "RAJAONGKIR_JATAH_PER_IP", JATAH_RAJAONGKIR_PER_IP)) {
    console.warn("[rajaongkir] jatah per IP habis", blok);
    return false;
  }

  const semua = await tambahHitungan(redis, `jatah:rajaongkir:${hari}`, 2 * DETIK_HARI);
  if (semua !== null && semua > angkaEnv(env, "RAJAONGKIR_JATAH_HARIAN", JATAH_RAJAONGKIR_HARIAN)) {
    console.warn("[rajaongkir] jatah harian habis", semua);
    return false;
  }

  return true;
}

export async function masihBolehPesan(
  env: Record<string, unknown>,
  blok: string,
  sekarang: Date = new Date(),
): Promise<boolean> {
  const redis = bacaKonfigRedis(env);
  if (!redis) return true;

  const n = await bacaHitungan(redis, `jatah:pesanan:${emberPesanan(sekarang)}:${blok}`);
  return n === null || n < angkaEnv(env, "MAKS_PESANAN_PER_IP", MAKS_PESANAN_PER_IP);
}

export async function catatPesananBaru(
  env: Record<string, unknown>,
  blok: string,
  sekarang: Date = new Date(),
): Promise<void> {
  const redis = bacaKonfigRedis(env);
  if (!redis) return;

  await tambahHitungan(redis, `jatah:pesanan:${emberPesanan(sekarang)}:${blok}`, DETIK_EMBER_PESANAN);
}
