import type { Sql } from "../lib/db";

export const UMUR_PERISTIWA_HARI = 90;

export async function sapuPeristiwaWebhook(
  sql: Sql,
  hari: number = UMUR_PERISTIWA_HARI,
): Promise<number> {
  const hasil = await sql`
    delete from webhook_events
    where received_at < now() - make_interval(days => ${hari})
  `;

  return hasil.count;
}
