import type { Sql } from "../lib/db";
import { COOKIE_ADMIN, bacaCookie, hashToken } from "../lib/sesi";

export async function buatSesiAdmin(sql: Sql, tokenHash: string, jam: number): Promise<void> {
  await sql`
    insert into admin_sessions (token_hash, expires_at)
    values (${tokenHash}, now() + make_interval(hours => ${jam}))
  `;
}

export async function sesiAdminSah(sql: Sql, token: string | null): Promise<boolean> {
  if (!token) return false;

  const [ada] = await sql`
    select 1 from admin_sessions
    where token_hash = ${await hashToken(token)}
      and expires_at > now()
    limit 1
  `;

  return Boolean(ada);
}

export async function adminDariCookie(
  sql: Sql,
  header: string | null | undefined,
): Promise<boolean> {
  return sesiAdminSah(sql, bacaCookie(header, COOKIE_ADMIN));
}

export async function hapusSesiAdmin(sql: Sql, token: string | null): Promise<void> {
  if (!token) return;
  await sql`delete from admin_sessions where token_hash = ${await hashToken(token)}`;
}

export async function sapuSesiAdmin(sql: Sql): Promise<number> {
  const hasil = await sql`delete from admin_sessions where expires_at <= now()`;
  return hasil.count;
}
