import type { Sql } from "../lib/db";
import { cocokKunci, kunciProduk } from "../lib/cocok-produk";
import type { SumberImpor } from "../lib/ulasan";

export const MAKS_NAMA_MARKETPLACE = 200;

export type NamaMarketplace = {
  id: number;
  variant_slug: string;
  source: SumberImpor;
  name: string;
};

export type NamaUntukCocok = { name_key: string; slug: string; variant_id: number };

export function rapikanNamaMarketplace(nama: string): { nama: string; kunci: string } | null {
  const bersih = nama.replace(/\s+/g, " ").trim().slice(0, MAKS_NAMA_MARKETPLACE);
  const kunci = kunciProduk(bersih);
  return bersih && kunci ? { nama: bersih, kunci } : null;
}

export async function daftarNamaMarketplace(sql: Sql, produkSlug: string): Promise<NamaMarketplace[]> {
  const baris = await sql<NamaMarketplace[]>`
    select n.id::int as id, v.slug as variant_slug, n.source, n.name
    from variant_marketplace_names n
    join product_variants v on v.id = n.variant_id
    join products p on p.id = v.product_id
    where p.slug = ${produkSlug}
    order by v.sort_order, v.id, n.source, n.name
  `;

  return [...baris];
}

export type HasilTambahNama =
  | { ok: true; nama: NamaMarketplace }
  | { ok: false; alasan: "not_found" | "invalid_name" | "duplicate" };

export async function tambahNamaMarketplace(
  sql: Sql,
  variantSlug: string,
  source: SumberImpor,
  nama: string,
): Promise<HasilTambahNama> {
  const rapi = rapikanNamaMarketplace(nama);
  if (!rapi) return { ok: false, alasan: "invalid_name" };

  const [varian] = await sql<{ id: number }[]>`select id::int as id from product_variants where slug = ${variantSlug}`;
  if (!varian) return { ok: false, alasan: "not_found" };

  const [baru] = await sql<{ id: number }[]>`
    insert into variant_marketplace_names (variant_id, source, name, name_key)
    values (${varian.id}, ${source}, ${rapi.nama}, ${rapi.kunci})
    on conflict (variant_id, source, name_key) do nothing
    returning id::int as id
  `;

  if (!baru) return { ok: false, alasan: "duplicate" };
  return { ok: true, nama: { id: baru.id, variant_slug: variantSlug, source, name: rapi.nama } };
}

export async function hapusNamaMarketplace(sql: Sql, id: number): Promise<boolean> {
  const hasil = await sql`delete from variant_marketplace_names where id = ${id}`;
  return hasil.count > 0;
}

export async function namaUntukCocok(sql: Sql, source: SumberImpor): Promise<NamaUntukCocok[]> {
  const baris = await sql<NamaUntukCocok[]>`
    select n.name_key, v.slug, v.id::int as variant_id
    from variant_marketplace_names n
    join product_variants v on v.id = n.variant_id
    where n.source = ${source}
  `;

  return [...baris];
}

export async function pelajariNamaMarketplace(
  sql: Sql,
  source: SumberImpor,
  pasangan: { variant_id: number; nama: string }[],
): Promise<number> {
  const ada = await namaUntukCocok(sql, source);
  const baru = new Map<string, { variant_id: number; name: string; name_key: string }>();

  for (const p of pasangan) {
    const rapi = rapikanNamaMarketplace(p.nama);
    if (!rapi) continue;

    const sudah = ada.some((a) => a.variant_id === p.variant_id && cocokKunci(rapi.kunci, a.name_key));
    if (sudah) continue;

    baru.set(`${p.variant_id}|${rapi.kunci}`, { variant_id: p.variant_id, name: rapi.nama, name_key: rapi.kunci });
  }

  if (baru.size === 0) return 0;

  const masuk = await sql`
    insert into variant_marketplace_names (variant_id, source, name, name_key)
    select x.variant_id, ${source}, x.name, x.name_key
    from jsonb_to_recordset(${sql.json([...baru.values()])}) as x(variant_id bigint, name text, name_key text)
    on conflict (variant_id, source, name_key) do nothing
  `;

  return masuk.count;
}
