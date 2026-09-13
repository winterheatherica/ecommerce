import { readdirSync } from "node:fs";
import { join } from "node:path";
import postgres from "postgres";

import { NAMA_DB_TES, bacaMigrasi, urlInduk, urlTes } from "./db";

const PESAN_MATI = [
  "",
  "Postgres lokal tidak bisa dihubungi.",
  "",
  "Tes integrasi butuh database asli. Jalankan dulu:",
  "",
  "    docker compose up -d postgres",
  "",
  "Lalu ulangi npm test.",
  "",
].join("\n");

function tidakHidup(e: unknown): boolean {
  const kode = (e as { code?: string } | null)?.code;
  return kode === "ECONNREFUSED" || kode === "CONNECT_TIMEOUT" || kode === "ENOTFOUND";
}

export default async function siapkan() {
  const induk = postgres(urlInduk(), { max: 1, onnotice: () => {} });

  try {
    const [ada] = await induk`
      select 1 from pg_database where datname = ${NAMA_DB_TES}
    `;

    if (!ada) await induk.unsafe(`create database "${NAMA_DB_TES}"`);
  } catch (e) {
    if (tidakHidup(e)) throw new Error(PESAN_MATI);
    throw e;
  } finally {
    await induk.end();
  }

  const sql = postgres(urlTes(), { max: 1, onnotice: () => {} });

  try {
    await sql
      .unsafe("drop schema if exists public cascade; create schema public;")
      .simple();

    const berkas = readdirSync(join(process.cwd(), "migrations"))
      .filter((f) => f.endsWith(".sql"))
      .sort();

    for (const f of berkas) {
      await sql.unsafe(bacaMigrasi(f)).simple();
    }
  } finally {
    await sql.end();
  }
}
