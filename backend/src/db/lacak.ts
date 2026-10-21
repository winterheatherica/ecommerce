import type { Kueri, Sql } from "../lib/db";
import { pakaiJatahLacak } from "../lib/jatah";
import {
  JEDA_LACAK_JAM,
  JEDA_LACAK_TERJADWAL_JAM,
  PESAN_JATAH_LACAK,
  TUNGGU_SELESAI_JAM,
  UMUR_LACAK_MAKS_HARI,
  hpAkhir,
  kodeKurirLacak,
  perluDilacak,
  rapikanLacak,
  type Lacak,
  type LacakResi,
} from "../lib/lacak";
import { bacaKonfigOngkir, lacakResi } from "../lib/rajaongkir";
import { ambilPesanan, type Pesanan } from "./pesanan";

export type TargetLacak = {
  id: number;
  order_no: string;
  tracking_number: string | null;
  courier: string;
  phone: string;
};

export type HasilLacak = "diperbarui" | "dilewati" | "dibatasi" | "gagal";

export type OpsiLacak = {
  jedaJam: number;
  jaga?: () => Promise<boolean>;
};

export function pelacak(env: Record<string, unknown>): LacakResi | null {
  const konfig = bacaKonfigOngkir(env);
  if (!konfig) return null;

  return (awb, courier, hp) => lacakResi(konfig, awb, courier, hp);
}

async function klaim(sql: Kueri, id: number, jedaJam: number): Promise<boolean> {
  const baris = await sql`
    update orders
    set tracking_checked_at = now()
    where id = ${id}
      and status = 'SHIPPED'
      and tracking_number is not null
      and delivered_at is null
      and (
        tracking_checked_at is null
        or tracking_checked_at <= now() - make_interval(hours => ${jedaJam})
      )
    returning id
  `;

  return baris.length > 0;
}

async function simpan(sql: Kueri, target: TargetLacak, lacak: Lacak): Promise<void> {
  await sql`
    update orders
    set tracking = ${sql.json(lacak)},
        tracking_error = null,
        delivered_at = case
          when ${lacak.delivered} then coalesce(delivered_at, ${lacak.delivered_at}::timestamptz, now())
          else delivered_at
        end
    where id = ${target.id}
      and tracking_number = ${target.tracking_number}
  `;
}

async function catatGagal(sql: Kueri, id: number, pesan: string): Promise<void> {
  await sql`update orders set tracking_error = ${pesan.slice(0, 300)} where id = ${id}`;
}

export async function perbaruiLacak(
  sql: Kueri,
  target: TargetLacak,
  lacak: LacakResi,
  opsi: OpsiLacak,
): Promise<HasilLacak> {
  if (!target.tracking_number) return "dilewati";
  if (!(await klaim(sql, target.id, opsi.jedaJam))) return "dilewati";

  if (opsi.jaga && !(await opsi.jaga())) {
    await catatGagal(sql, target.id, PESAN_JATAH_LACAK);
    return "dibatasi";
  }

  const hasil = await lacak(
    target.tracking_number,
    kodeKurirLacak(target.courier),
    hpAkhir(target.phone),
  );

  if (!hasil.ok) {
    console.warn("[lacak] gagal", target.order_no, hasil.status, hasil.pesan);
    await catatGagal(sql, target.id, hasil.pesan);
    return "gagal";
  }

  await simpan(sql, target, rapikanLacak(hasil.data));
  return "diperbarui";
}

export async function segarkanLacak(
  sql: Sql,
  env: Record<string, unknown>,
  pesanan: Pesanan,
): Promise<Pesanan> {
  if (!perluDilacak(pesanan)) return pesanan;

  const lacak = pelacak(env);
  if (!lacak) return pesanan;

  try {
    const hasil = await perbaruiLacak(sql, pesanan, lacak, {
      jedaJam: JEDA_LACAK_JAM,
      jaga: () => pakaiJatahLacak(env),
    });

    if (hasil === "dilewati") return pesanan;
    return (await ambilPesanan(sql, pesanan.order_no)) ?? pesanan;
  } catch (e) {
    console.error("[lacak] gagal memperbarui", pesanan.order_no, e);
    return pesanan;
  }
}

export async function targetTerjadwal(
  sql: Kueri,
  jedaJam: number = JEDA_LACAK_TERJADWAL_JAM,
  batas = 5,
): Promise<TargetLacak[]> {
  return sql<TargetLacak[]>`
    select id::int as id, order_no, tracking_number, courier, phone
    from orders
    where status = 'SHIPPED'
      and tracking_number is not null
      and delivered_at is null
      and shipped_at > now() - make_interval(days => ${UMUR_LACAK_MAKS_HARI})
      and (
        tracking_checked_at is null
        or tracking_checked_at <= now() - make_interval(hours => ${jedaJam})
      )
    order by tracking_checked_at asc nulls first, shipped_at asc
    limit ${batas}
  `;
}

export async function lacakTerjadwal(
  sql: Kueri,
  lacak: LacakResi,
  jaga?: () => Promise<boolean>,
): Promise<Record<HasilLacak, number>> {
  const hitung: Record<HasilLacak, number> = { diperbarui: 0, dilewati: 0, dibatasi: 0, gagal: 0 };

  for (const target of await targetTerjadwal(sql)) {
    const hasil = await perbaruiLacak(sql, target, lacak, {
      jedaJam: JEDA_LACAK_TERJADWAL_JAM,
      jaga,
    });

    hitung[hasil] += 1;
    if (hasil === "dibatasi") break;
  }

  return hitung;
}

export async function selesaikanOtomatis(
  sql: Kueri,
  tungguJam: number = TUNGGU_SELESAI_JAM,
): Promise<string[]> {
  const baris = await sql<{ order_no: string }[]>`
    update orders
    set status = 'DELIVERED'
    where status = 'SHIPPED'
      and delivered_at is not null
      and delivered_at <= now() - make_interval(hours => ${tungguJam})
    returning order_no
  `;

  return baris.map((b) => b.order_no).sort();
}
