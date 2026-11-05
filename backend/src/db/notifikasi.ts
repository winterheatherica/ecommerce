import { buatKoneksi, tutup, type Sql } from "../lib/db";
import {
  kirimEmail,
  type HasilKirimEmail,
  type IsiEmail,
  type JenisEmail,
  type KonfigEmail,
} from "../lib/notifikasi";

export const UMUR_CATATAN_EMAIL_HARI = 90;
export const BATAS_RIWAYAT_EMAIL = 8;
export const PANJANG_GALAT_EMAIL = 500;

export type CatatanEmail = {
  kind: JenisEmail;
  order_no: string | null;
  sent: boolean;
  error: string | null;
  created_at: string;
};

export type StatusKirimEmail = {
  riwayat: CatatanEmail[];
  gagalBeruntun: number;
};

export async function catatKirimEmail(sql: Sql, isi: IsiEmail, hasil: HasilKirimEmail): Promise<void> {
  const galat = hasil.ok
    ? null
    : (hasil.pesan.trim() || "Tanpa keterangan").slice(0, PANJANG_GALAT_EMAIL);

  await sql`
    insert into email_notifications (kind, order_no, sent, error)
    values (${isi.jenis}, ${isi.nomor}, ${hasil.ok}, ${galat})
  `;
}

export async function kirimDanCatat(sql: Sql, k: KonfigEmail, isi: IsiEmail): Promise<HasilKirimEmail> {
  const hasil = await kirimEmail(k, isi);

  try {
    await catatKirimEmail(sql, isi, hasil);
  } catch (e) {
    console.error("[email] gagal mencatat hasil kirim", isi.subjek, e);
  }

  return hasil;
}

export async function kabarkan(
  env: Record<string, unknown>,
  k: KonfigEmail,
  isi: IsiEmail,
): Promise<HasilKirimEmail> {
  const sql = buatKoneksi(env);

  try {
    return await kirimDanCatat(sql, k, isi);
  } finally {
    await tutup(sql);
  }
}

export async function statusKirimEmail(
  sql: Sql,
  batas: number = BATAS_RIWAYAT_EMAIL,
): Promise<StatusKirimEmail> {
  const baris = await sql<(Omit<CatatanEmail, "created_at"> & { created_at: Date })[]>`
    select kind, order_no, sent, error, created_at
    from email_notifications
    order by created_at desc, id desc
    limit ${batas}
  `;

  const [{ gagal }] = await sql<{ gagal: number }[]>`
    select count(*)::int as gagal
    from email_notifications
    where not sent
      and created_at > coalesce(
        (select max(created_at) from email_notifications where sent),
        '-infinity'::timestamptz
      )
  `;

  return {
    riwayat: baris.map((b) => ({ ...b, created_at: b.created_at.toISOString() })),
    gagalBeruntun: gagal,
  };
}

export async function sapuCatatanEmail(
  sql: Sql,
  hari: number = UMUR_CATATAN_EMAIL_HARI,
): Promise<number> {
  const hasil = await sql`
    delete from email_notifications
    where created_at < now() - make_interval(days => ${hari})
  `;

  return hasil.count;
}
