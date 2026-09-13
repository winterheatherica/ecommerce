import postgres from "postgres";

export type Sql = ReturnType<typeof postgres>;

export type Kueri = postgres.ISql;

export function buatKoneksi(env: Record<string, unknown>): Sql {
  const url = env.DATABASE_URL;

  if (typeof url !== "string" || url.length === 0) {
    throw new Error("DATABASE_URL belum diisi");
  }

  return postgres(url, {
    max: 1,
    prepare: false,
    fetch_types: false,
  });
}

export async function tutup(sql: Sql): Promise<void> {
  try {
    await sql.end();
  } catch (e) {
    console.error("[db] gagal menutup koneksi", e);
  }
}
