import type { Kueri } from "./db";
import { ambilTarifTersimpan, simpanTarif } from "../db/ongkir";
import { bacaKonfigOngkir, hitungOngkir } from "./rajaongkir";
import {
  UMUR_TARIF_JAM,
  kurirDipakai,
  layakDitawarkan,
  petakanOpsi,
  type OpsiOngkir,
} from "./shipping";

export type HasilOpsi =
  | { ok: true; opsi: OpsiOngkir[]; sumber: "tersimpan" | "rajaongkir" }
  | { ok: false; pesan: string; dibatasi?: boolean };

export const PESAN_ONGKIR_DIBATASI =
  "Ongkir untuk tujuan ini sedang tidak bisa dihitung. Coba lagi nanti, atau tanyakan lewat WhatsApp.";

export async function opsiUntuk(
  sql: Kueri,
  env: Record<string, unknown>,
  destId: string,
  weightG: number,
  jaga?: () => Promise<boolean>,
): Promise<HasilOpsi> {
  const kurir = kurirDipakai(env);

  const tersimpan = await ambilTarifTersimpan(
    sql,
    destId,
    weightG,
    kurir,
    UMUR_TARIF_JAM,
  );

  if (tersimpan) {
    return { ok: true, opsi: tersimpan.filter(layakDitawarkan), sumber: "tersimpan" };
  }

  const konfig = bacaKonfigOngkir(env);

  if (!konfig || !konfig.originId) {
    return { ok: false, pesan: "Ongkos kirim belum dikonfigurasi" };
  }

  if (jaga && !(await jaga())) {
    return { ok: false, pesan: PESAN_ONGKIR_DIBATASI, dibatasi: true };
  }

  const hasil = await hitungOngkir(konfig, destId, weightG, kurir);

  if (!hasil.ok) {
    console.error("[rajaongkir] hitung ongkir gagal", hasil.status, hasil.pesan);
    return { ok: false, pesan: hasil.pesan };
  }

  const opsi = petakanOpsi(hasil.data);
  await simpanTarif(sql, destId, weightG, kurir, opsi);

  return { ok: true, opsi: opsi.filter(layakDitawarkan), sumber: "rajaongkir" };
}
