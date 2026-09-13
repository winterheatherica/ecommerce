import type { Kueri } from "../lib/db";

export type Wilayah = {
  id: string;
  province: string;
  city: string;
  district: string;
  postal_code: string | null;
  label: string;
};

export async function cariWilayah(
  sql: Kueri,
  kata: string,
  batas: number,
): Promise<Wilayah[]> {
  const baris = await sql<Wilayah[]>`
    select id, province, city, district, postal_code, label
    from regions
    where label ilike '%' || ${kata} || '%'
    order by label
    limit ${batas}
  `;

  return [...baris];
}

export async function ambilWilayah(
  sql: Kueri,
  id: string,
): Promise<Wilayah | undefined> {
  const [wilayah] = await sql<Wilayah[]>`
    select id, province, city, district, postal_code, label
    from regions
    where id = ${id}
    limit 1
  `;

  return wilayah;
}
