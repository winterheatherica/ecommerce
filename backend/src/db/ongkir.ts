import type { Kueri } from "../lib/db";
import type { OpsiOngkir } from "../lib/shipping";

export function kunciBerat(weightG: number): number {
  return Math.max(1, Math.ceil(weightG));
}

export async function ambilTarifTersimpan(
  sql: Kueri,
  destId: string,
  weightG: number,
  courier: string,
  umurJam: number,
): Promise<OpsiOngkir[] | undefined> {
  const [baris] = await sql<{ options: OpsiOngkir[] }[]>`
    select options
    from shipping_rates
    where dest_id = ${destId}
      and weight_g = ${kunciBerat(weightG)}
      and courier = ${courier}
      and fetched_at > now() - make_interval(hours => ${umurJam})
    limit 1
  `;

  return baris?.options;
}

export async function simpanTarif(
  sql: Kueri,
  destId: string,
  weightG: number,
  courier: string,
  opsi: OpsiOngkir[],
): Promise<void> {
  await sql`
    insert into shipping_rates (dest_id, weight_g, courier, options, fetched_at)
    values (
      ${destId},
      ${kunciBerat(weightG)},
      ${courier},
      ${sql.json(opsi)},
      now()
    )
    on conflict (dest_id, weight_g, courier) do update
    set options = excluded.options,
        fetched_at = now()
  `;
}
