export const ALAMAT = {
  jalan: "Jl. Bhayangkara I No. 76, RT 3/RW 3",
  kelurahan: "Munjul",
  kecamatan: "Cipayung",
  kota: "Jakarta Timur",
  provinsi: "DKI Jakarta",
  kodePos: "13850",
} as const;

export const KONTAK = {
  waNomor: "62816638543",
  waTampil: "0816-638-543",
  waInternasional: "+62 816-638-543",
  alamat: ALAMAT,
  alamatBaris: [
    ALAMAT.jalan,
    `${ALAMAT.kelurahan}, Kec. ${ALAMAT.kecamatan}`,
    `${ALAMAT.kota}, ${ALAMAT.provinsi} ${ALAMAT.kodePos}`,
  ],
  alamatSatuBaris: `${ALAMAT.jalan}, ${ALAMAT.kelurahan}, Kec. ${ALAMAT.kecamatan}, ${ALAMAT.kota}, ${ALAMAT.provinsi} ${ALAMAT.kodePos}`,
  kotaAsalKirim: ALAMAT.kota,
  jam: "09.00 sampai 17.00 WIB",
  maps: "https://maps.app.goo.gl/bJCzn1oBK7J1mZrS7",
} as const;

export const WA_URL = `https://wa.me/${KONTAK.waNomor}`;

export const SOSIAL: { label: string; href: string }[] = [
  { label: "WhatsApp", href: WA_URL },
];
