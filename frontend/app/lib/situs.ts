export type TokoAPI = {
  wa_number: string;
  wa_link: string | null;
  address_street: string;
  address_village: string;
  address_district: string;
  address_city: string;
  address_province: string;
  postal_code: string;
  maps_url: string | null;
  open_days: number[];
  opens_at: string;
  closes_at: string;
  closed_on_holidays: boolean;
  social_links: { label: string; url: string }[];
  updated_at?: string;
};

export type GrupAPI = { slug: string; label: string; title: string; summary: string };

export type KategoriAPI = {
  slug: string;
  group_slug: string;
  label: string;
  title: string;
  seo_title: string;
  summary: string;
  complaint: string | null;
  product_count?: number;
};

export type KelompokFaqAPI = {
  slug: string;
  title: string;
  items: { id: number; question: string; answer: string }[];
};

export type SitusAPI = {
  store: TokoAPI | null;
  groups: GrupAPI[];
  categories: KategoriAPI[];
  faq: KelompokFaqAPI[];
};

export type TautanSosial = { label: string; href: string };

export type InfoToko = {
  waNomor: string;
  waTampil: string;
  waInternasional: string;
  waUrl: string;
  alamat: {
    jalan: string;
    kelurahan: string;
    kecamatan: string;
    kota: string;
    provinsi: string;
    kodePos: string;
  };
  alamatBaris: string[];
  alamatSatuBaris: string;
  maps: string | null;
  hariBuka: number[];
  buka: string;
  tutup: string;
  hari: string;
  jam: string;
  libur: string | null;
  sosial: TautanSosial[];
};

export type GrupKategori = { slug: string; label: string; judul: string; ringkasan: string };

export type InfoKategori = {
  slug: string;
  grup: string;
  label: string;
  judul: string;
  judulSeo: string;
  ringkasan: string;
  keluhan: string | null;
};

export type KelompokFaq = { id: string; judul: string; isi: { tanya: string; jawab: string }[] };

export type Situs = {
  toko: InfoToko;
  grup: GrupKategori[];
  kategori: InfoKategori[];
  faq: KelompokFaq[];
};

export type SitusKlien = Omit<Situs, "faq">;

export const NAMA_HARI = ["", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
export const HARI_SCHEMA = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export const PENANDA_FAQ: { kunci: string; arti: string }[] = [
  { kunci: "wa", arti: "nomor WhatsApp" },
  { kunci: "hari", arti: "hari buka" },
  { kunci: "jam", arti: "jam buka" },
  { kunci: "libur", arti: "hari libur" },
  { kunci: "kota", arti: "kota asal kirim" },
  { kunci: "alamat", arti: "alamat lengkap" },
];

export function daftarKata(kata: string[]): string {
  if (kata.length <= 1) return kata.join("");
  if (kata.length === 2) return `${kata[0]} dan ${kata[1]}`;
  return `${kata.slice(0, -1).join(", ")}, dan ${kata.at(-1)}`;
}

export function teksHari(hari: number[]): string {
  const urut = [...hari].sort((a, b) => a - b);
  if (urut.length === 7) return "Setiap hari";

  const beruntun = urut.every((h, i) => i === 0 || h === urut[i - 1] + 1);
  if (beruntun && urut.length >= 3) return `${NAMA_HARI[urut[0]]} sampai ${NAMA_HARI[urut.at(-1) ?? 0]}`;

  return daftarKata(urut.map((h) => NAMA_HARI[h]));
}

export function teksJam(buka: string, tutup: string): string {
  return `${buka.replace(":", ".")} sampai ${tutup.replace(":", ".")} WIB`;
}

export function teksLibur(hariBuka: number[], liburNasional: boolean): string | null {
  const tutup = [1, 2, 3, 4, 5, 6, 7].filter((h) => !hariBuka.includes(h)).map((h) => NAMA_HARI[h]);
  const semua = liburNasional ? [...tutup, "libur nasional"] : tutup;
  return semua.length > 0 ? daftarKata(semua) : null;
}

export function formatWa(nomor: string): { tampil: string; internasional: string } {
  const lokal = `0${nomor.slice(2)}`;

  return {
    tampil: lokal.replace(/^(\d{4})(\d{4})(\d+)$/, "$1-$2-$3"),
    internasional: `+62 ${nomor.slice(2).replace(/^(\d{3})(\d{4})(\d+)$/, "$1-$2-$3")}`,
  };
}

export function petakanToko(t: TokoAPI): InfoToko {
  const alamat = {
    jalan: t.address_street,
    kelurahan: t.address_village,
    kecamatan: t.address_district,
    kota: t.address_city,
    provinsi: t.address_province,
    kodePos: t.postal_code,
  };
  const baris = [
    alamat.jalan,
    `${alamat.kelurahan}, Kec. ${alamat.kecamatan}`,
    `${alamat.kota}, ${alamat.provinsi} ${alamat.kodePos}`,
  ];
  const wa = formatWa(t.wa_number);
  const waUrl = t.wa_link ?? `https://wa.me/${t.wa_number}`;

  return {
    waNomor: t.wa_number,
    waTampil: wa.tampil,
    waInternasional: wa.internasional,
    waUrl,
    alamat,
    alamatBaris: baris,
    alamatSatuBaris: baris.join(", "),
    maps: t.maps_url,
    hariBuka: t.open_days,
    buka: t.opens_at,
    tutup: t.closes_at,
    hari: teksHari(t.open_days),
    jam: teksJam(t.opens_at, t.closes_at),
    libur: teksLibur(t.open_days, t.closed_on_holidays),
    sosial: [{ label: "WhatsApp", href: waUrl }, ...t.social_links.map((s) => ({ label: s.label, href: s.url }))],
  };
}

export function petakanSitus(s: SitusAPI): Situs {
  if (!s.store) throw new Error("Info toko belum diisi di database");

  return {
    toko: petakanToko(s.store),
    grup: s.groups.map((g) => ({ slug: g.slug, label: g.label, judul: g.title, ringkasan: g.summary })),
    kategori: s.categories.map((k) => ({
      slug: k.slug,
      grup: k.group_slug,
      label: k.label,
      judul: k.title,
      judulSeo: k.seo_title,
      ringkasan: k.summary,
      keluhan: k.complaint,
    })),
    faq: s.faq.map((k) => ({
      id: k.slug,
      judul: k.title,
      isi: k.items.map((x) => ({ tanya: x.question, jawab: x.answer })),
    })),
  };
}

export function waPesan(toko: InfoToko, teks: string): string {
  return `https://wa.me/${toko.waNomor}?text=${encodeURIComponent(teks)}`;
}

export function isiPenanda(teks: string, toko: InfoToko): string {
  const nilai: Record<string, string> = {
    wa: toko.waTampil,
    hari: toko.hari,
    jam: toko.jam,
    libur: toko.libur ?? "hari libur",
    kota: toko.alamat.kota,
    alamat: toko.alamatSatuBaris,
  };

  return teks.replace(/\{([a-z]+)\}/g, (asli, kunci: string, posisi: number) => {
    const isi = nilai[kunci];
    if (isi === undefined) return asli;

    const awalKalimat = posisi === 0 || /[.!?]\s*$/.test(teks.slice(0, posisi));
    return awalKalimat ? isi.charAt(0).toUpperCase() + isi.slice(1) : isi;
  });
}

export function cariKategori(situs: SitusKlien, slug: string): InfoKategori | undefined {
  return situs.kategori.find((k) => k.slug === slug);
}

export function cariGrup(situs: SitusKlien, slug: string): GrupKategori | undefined {
  return situs.grup.find((g) => g.slug === slug);
}

export function kategoriDalamGrup(situs: SitusKlien, grup: string): InfoKategori[] {
  return situs.kategori.filter((k) => k.grup === grup);
}

export function grupDariKategori(situs: SitusKlien, kategori: string): string | undefined {
  return cariKategori(situs, kategori)?.grup;
}
