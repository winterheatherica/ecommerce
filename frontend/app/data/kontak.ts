export const KONTAK = {
  waNomor: "62816638543",
  waTampil: "0816‑638‑543",
  alamatBaris: [
    "Jl. Bhayangkara I No. 76, RT 3/RW 3",
    "Munjul, Kec. Cipayung",
    "Jakarta Timur, DKI Jakarta 13850",
  ],
  jam: "09.00–17.00 WIB",
  maps: "https://maps.app.goo.gl/bJCzn1oBK7J1mZrS7",
} as const;

export const WA_URL = `https://wa.me/${KONTAK.waNomor}`;

export const SOSIAL: { label: string; href: string }[] = [
  { label: "WhatsApp", href: WA_URL },
];
