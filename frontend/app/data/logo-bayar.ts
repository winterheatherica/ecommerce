export type LogoBayar = { nama: string; src: string; lebar: number; tinggi: number };

const logo = (berkas: string, nama: string, lebar: number, tinggi: number): LogoBayar => ({
  nama,
  src: `/logo-bayar/${berkas}.svg`,
  lebar,
  tinggi,
});

export const LOGO = {
  bni: logo("bni", "BNI", 65, 19),
  bri: logo("bri", "BRI", 57, 22),
  mandiri: logo("mandiri", "Mandiri", 65, 19),
  bsi: logo("bsi", "BSI", 45, 28),
  cimb: logo("cimb", "CIMB Niaga", 88, 14),
  permata: logo("permata", "Permata", 77, 19),
  danamon: logo("danamon", "Danamon", 57, 22),
  btn: logo("btn", "BTN", 47, 27),
  doku: logo("doku", "DOKU", 27, 27),
  indomaret: logo("indomaret", "Indomaret", 63, 22),
  alfamart: logo("alfamart", "Alfamart", 62, 20),
};

export const LOGO_BAYAR: Record<string, LogoBayar | undefined> = {
  VIRTUAL_ACCOUNT_BNI: LOGO.bni,
  VIRTUAL_ACCOUNT_BRI: LOGO.bri,
  VIRTUAL_ACCOUNT_BANK_MANDIRI: LOGO.mandiri,
  VIRTUAL_ACCOUNT_BANK_SYARIAH_MANDIRI: LOGO.bsi,
  VIRTUAL_ACCOUNT_BANK_CIMB: LOGO.cimb,
  VIRTUAL_ACCOUNT_BANK_PERMATA: LOGO.permata,
  VIRTUAL_ACCOUNT_BANK_DANAMON: LOGO.danamon,
  VIRTUAL_ACCOUNT_BTN: LOGO.btn,
  VIRTUAL_ACCOUNT_DOKU: LOGO.doku,
  ONLINE_TO_OFFLINE_INDOMARET: LOGO.indomaret,
  ONLINE_TO_OFFLINE_ALFA: LOGO.alfamart,
};
