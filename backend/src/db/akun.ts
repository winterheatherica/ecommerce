import type { Sql } from "../lib/db";
import type { ProfilGoogle } from "../lib/google";
import { COOKIE_SESI, bacaCookie, hashToken } from "../lib/sesi";
import type { StatusPesanan } from "../lib/orders";

export type Pengguna = {
  id: number;
  email: string;
  name: string;
};

export type HasilMasuk = {
  pengguna: Pengguna;
  pesananTertaut: number;
};

export async function selesaikanMasuk(sql: Sql, profil: ProfilGoogle): Promise<HasilMasuk> {
  const hasil = await sql.begin(async (tx) => {
    const [pengguna] = await tx<Pengguna[]>`
      insert into users (google_sub, email, name)
      values (${profil.sub}, ${profil.email}, ${profil.name})
      on conflict (google_sub) do update
        set email = excluded.email,
            name = excluded.name,
            last_login_at = now()
      returning id::int as id, email, name
    `;

    const tertaut = await tx`
      update orders
      set user_id = ${pengguna.id}
      where user_id is null
        and lower(email) = lower(${profil.email})
    `;

    return [{ pengguna, pesananTertaut: tertaut.count }];
  });

  return hasil[0];
}

export async function buatSesi(
  sql: Sql,
  userId: number,
  tokenHash: string,
  hari: number,
): Promise<void> {
  await sql`
    insert into sessions (token_hash, user_id, expires_at)
    values (${tokenHash}, ${userId}, now() + make_interval(days => ${hari}))
  `;
}

export async function penggunaDariToken(
  sql: Sql,
  token: string | null,
): Promise<Pengguna | undefined> {
  if (!token) return undefined;

  const [pengguna] = await sql<Pengguna[]>`
    select u.id::int as id, u.email, u.name
    from sessions s
    join users u on u.id = s.user_id
    where s.token_hash = ${await hashToken(token)}
      and s.expires_at > now()
    limit 1
  `;

  return pengguna;
}

export function penggunaDariCookie(
  sql: Sql,
  headerCookie: string | null | undefined,
): Promise<Pengguna | undefined> {
  return penggunaDariToken(sql, bacaCookie(headerCookie, COOKIE_SESI));
}

export async function hapusSesi(sql: Sql, token: string | null): Promise<void> {
  if (!token) return;
  await sql`delete from sessions where token_hash = ${await hashToken(token)}`;
}

export async function sapuSesi(sql: Sql): Promise<number> {
  const hasil = await sql`delete from sessions where expires_at <= now()`;
  return hasil.count;
}

export type RingkasanPesanan = {
  order_no: string;
  status: StatusPesanan;
  total: number;
  item_count: number;
  created_at: string;
  tracking_number: string | null;
  delivered_at: string | null;
};

export async function pesananPengguna(
  sql: Sql,
  userId: number,
  batas = 50,
): Promise<RingkasanPesanan[]> {
  const baris = await sql<
    (Omit<RingkasanPesanan, "created_at" | "delivered_at"> & {
      created_at: Date;
      delivered_at: Date | null;
    })[]
  >`
    select
      o.order_no,
      o.status,
      o.total,
      coalesce((select sum(i.qty) from order_items i where i.order_id = o.id), 0)::int as item_count,
      o.created_at,
      o.tracking_number,
      o.delivered_at
    from orders o
    where o.user_id = ${userId}
    order by o.created_at desc
    limit ${batas}
  `;

  return baris.map((b) => ({
    ...b,
    created_at: b.created_at.toISOString(),
    delivered_at: b.delivered_at ? b.delivered_at.toISOString() : null,
  }));
}

export type AlamatTerakhir = {
  customer_name: string;
  phone: string;
  address: string;
  dest_id: string;
  dest_label: string;
};

export async function alamatTerakhir(
  sql: Sql,
  userId: number,
): Promise<AlamatTerakhir | undefined> {
  const [baris] = await sql<AlamatTerakhir[]>`
    select o.customer_name, o.phone, o.address, o.dest_id, r.label as dest_label
    from orders o
    join regions r on r.id = o.dest_id
    where o.user_id = ${userId}
    order by o.created_at desc
    limit 1
  `;

  return baris;
}
