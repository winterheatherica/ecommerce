import { readFileSync } from "node:fs";
import { join } from "node:path";
import postgres from "postgres";

import type { Sql } from "../lib/db";

export const NAMA_DB_TES = "ecommerce_test";

const SEED = [
  "0002_seed_products.sql",
  "0004_seed_descriptions.sql",
  "0006_fix_description_claims.sql",
];

function bacaEnv(): Record<string, string> {
  try {
    const isi = readFileSync(join(process.cwd(), "..", ".env"), "utf8");
    const hasil: Record<string, string> = {};

    for (const baris of isi.split(/\r?\n/)) {
      const cocok = baris.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (cocok) hasil[cocok[1]] = cocok[2].replace(/^["']|["']$/g, "");
    }

    return hasil;
  } catch {
    return {};
  }
}

function bagian() {
  const e = bacaEnv();

  return {
    user: e.POSTGRES_USER ?? "ecommerce",
    pass: e.POSTGRES_PASSWORD ?? "",
    port: e.POSTGRES_PORT ?? "5432",
    db: e.POSTGRES_DB ?? "ecommerce",
  };
}

export function urlTes(): string {
  if (process.env.TEST_DATABASE_URL) return process.env.TEST_DATABASE_URL;

  const b = bagian();
  return `postgres://${b.user}:${encodeURIComponent(b.pass)}@localhost:${b.port}/${NAMA_DB_TES}`;
}

export function urlInduk(): string {
  const b = bagian();
  return `postgres://${b.user}:${encodeURIComponent(b.pass)}@localhost:${b.port}/${b.db}`;
}

export function koneksiTes(): Sql {
  return postgres(urlTes(), { max: 1, onnotice: () => {} });
}

export function bacaMigrasi(berkas: string): string {
  return readFileSync(join(process.cwd(), "migrations", berkas), "utf8");
}

const isiSeed = SEED.map(bacaMigrasi);

export async function bersihkan(sql: Sql): Promise<void> {
  await sql
    .unsafe("truncate order_items, orders, products restart identity cascade")
    .simple();

  for (const isi of isiSeed) {
    await sql.unsafe(isi).simple();
  }
}
