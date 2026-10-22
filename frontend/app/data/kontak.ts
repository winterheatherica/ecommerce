export const ALAMAT = {
  jalan: "Jl. Bhayangkara I No. 76, RT 3/RW 3",
  kelurahan: "Munjul",
  kecamatan: "Cipayung",
  kota: "Jakarta Timur",
  provinsi: "DKI Jakarta",
  kodePos: "13850",
} as const;

export const KONTAK = {
  waNomor: "6281317244671",
  waTampil: "0813-1724-4671",
  waInternasional: "+62 813-1724-4671",
  alamat: ALAMAT,
  alamatBaris: [
    ALAMAT.jalan,
    `${ALAMAT.kelurahan}, Kec. ${ALAMAT.kecamatan}`,
    `${ALAMAT.kota}, ${ALAMAT.provinsi} ${ALAMAT.kodePos}`,
  ],
  alamatSatuBaris: `${ALAMAT.jalan}, ${ALAMAT.kelurahan}, Kec. ${ALAMAT.kecamatan}, ${ALAMAT.kota}, ${ALAMAT.provinsi} ${ALAMAT.kodePos}`,
  kotaAsalKirim: ALAMAT.kota,
  hari: "Senin sampai Sabtu",
  jam: "09.00 sampai 17.00 WIB",
  libur: "Minggu dan libur nasional",
  maps: "https://maps.app.goo.gl/bJCzn1oBK7J1mZrS7",
} as const;

export const PENGIRIM_LABEL = {
  nama: "Menik Store",
  hp: KONTAK.waTampil,
} as const;

export const INSTAGRAM_URL = "https://www.instagram.com/menikstore12";

export const WA_URL = "https://wa.me/message/3CITYZQM7RROA1";

export function waPesan(teks: string): string {
  return `https://wa.me/${KONTAK.waNomor}?text=${encodeURIComponent(teks)}`;
}

export const SOSIAL: { label: string; href: string }[] = [
  { label: "WhatsApp", href: WA_URL },
  { label: "Instagram", href: INSTAGRAM_URL },
];
