import type { Sql } from "../lib/db";
import { namaMetode, type KabarDoku, type KonfigDoku } from "../lib/doku";
import { cekStatusBayar } from "../lib/payment";
import {
  ambilPesanan,
  gagalkanPembayaran,
  pesananMenungguDoku,
  tandaiTerbayar,
} from "./pesanan";

export type HasilKabar =
  | { jenis: "lunas"; nomor: string; baru: boolean }
  | { jenis: "kedaluwarsa"; nomor: string }
  | { jenis: "diabaikan"; nomor: string | null; status: string | null }
  | { jenis: "nominal_beda"; nomor: string }
  | { jenis: "gagal_tandai"; nomor: string; alasan: string };

export async function terapkanKabarDoku(sql: Sql, isi: KabarDoku): Promise<HasilKabar> {
  const nomor = isi.order?.invoice_number ?? null;
  const status = isi.transaction?.status ?? null;

  if (!nomor) return { jenis: "diabaikan", nomor, status };

  if (status === "EXPIRED") {
    await gagalkanPembayaran(sql, nomor, "EXPIRED");
    return { jenis: "kedaluwarsa", nomor };
  }

  if (status !== "SUCCESS") return { jenis: "diabaikan", nomor, status };

  const pesanan = await ambilPesanan(sql, nomor);

  if (!pesanan) return { jenis: "diabaikan", nomor, status };

  if (Number(isi.order?.amount) !== pesanan.total) {
    console.error("[doku] nominal tidak cocok", nomor, {
      doku: isi.order?.amount,
      pesanan: pesanan.total,
    });
    return { jenis: "nominal_beda", nomor };
  }

  const hasil = await tandaiTerbayar(
    sql,
    nomor,
    namaMetode(isi.channel?.id) ?? namaMetode(isi.service?.id) ?? "DOKU",
    { lewatiKedaluwarsa: true },
  );

  if (!hasil.ok) {
    console.error(
      "[doku] uang masuk tapi pesanan tidak bisa ditandai lunas, cek manual",
      nomor,
      hasil.alasan,
    );
    return { jenis: "gagal_tandai", nomor, alasan: hasil.alasan };
  }

  return { jenis: "lunas", nomor, baru: !hasil.sudahPernah };
}

export type CekStatus = typeof cekStatusBayar;

export async function periksaKeDoku(
  sql: Sql,
  konfig: KonfigDoku,
  nomor: string,
  cek: CekStatus = cekStatusBayar,
): Promise<HasilKabar | null> {
  const jawaban = await cek(konfig, nomor);

  if (!jawaban.ok) {
    if (jawaban.status !== 404) {
      console.error("[doku] cek status gagal", nomor, jawaban.status, jawaban.pesan);
    }
    return null;
  }

  const diminta = nomor.trim().toUpperCase();
  const dijawab = jawaban.data.order?.invoice_number?.trim().toUpperCase();

  if (dijawab !== diminta) {
    console.error("[doku] cek status menjawab invoice lain", { diminta, dijawab });
    return null;
  }

  return terapkanKabarDoku(sql, jawaban.data);
}

export async function periksaTertundaKeDoku(
  sql: Sql,
  konfig: KonfigDoku,
  cek: CekStatus = cekStatusBayar,
): Promise<HasilKabar[]> {
  const hasil: HasilKabar[] = [];

  for (const nomor of await pesananMenungguDoku(sql)) {
    const h = await periksaKeDoku(sql, konfig, nomor, cek);
    if (h) hasil.push(h);
  }

  return hasil;
}
