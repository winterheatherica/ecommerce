import { describe, expect, it } from "vitest";

import { periksaToko, rapikanNomorWa, type TokoBaru } from "./toko";

function toko(ubah: Partial<TokoBaru> = {}): TokoBaru {
  return {
    wa_number: "0813-1724-4671",
    wa_link: "https://wa.me/message/3CITYZQM7RROA1",
    address_street: "Jl. Bhayangkara I No. 76",
    address_village: "Munjul",
    address_district: "Cipayung",
    address_city: "Jakarta Timur",
    address_province: "DKI Jakarta",
    postal_code: "13850",
    maps_url: null,
    open_days: [1, 2, 3, 4, 5, 6],
    opens_at: "09:00",
    closes_at: "17:00",
    closed_on_holidays: true,
    social_links: [{ label: "Instagram", url: "https://www.instagram.com/menikstore12" }],
    ...ubah,
  };
}

describe("rapikanNomorWa", () => {
  it("menerima format lokal, internasional, dan yang berspasi", () => {
    for (const nomor of ["0813-1724-4671", "+62 813 1724 4671", "6281317244671", "(0813) 1724.4671"]) {
      expect(rapikanNomorWa(nomor), nomor).toBe("6281317244671");
    }
  });

  it("menolak nomor yang bukan nomor Indonesia atau terlalu pendek", () => {
    for (const nomor of ["0813", "+1 415 555 0100", "62081317244671", "nomor wa"]) {
      expect(rapikanNomorWa(nomor), nomor).toBeNull();
    }
  });
});

describe("periksaToko", () => {
  it("merapikan isian: nomor WA, spasi ganda, urutan hari, dan link kosong jadi null", () => {
    const hasil = periksaToko(
      toko({ address_city: "  Jakarta   Timur ", open_days: [6, 1, 3, 1], maps_url: "  ", wa_link: "" }),
    );

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(hasil.bersih.wa_number).toBe("6281317244671");
    expect(hasil.bersih.address_city).toBe("Jakarta Timur");
    expect(hasil.bersih.open_days).toEqual([1, 3, 6]);
    expect(hasil.bersih.maps_url).toBeNull();
    expect(hasil.bersih.wa_link).toBeNull();
  });

  it("menolak isian yang salah dengan pesan dan field yang jelas", () => {
    const kasus: [Partial<TokoBaru>, string][] = [
      [{ wa_number: "12345" }, "wa_number"],
      [{ wa_link: "wa.me/123" }, "wa_link"],
      [{ address_street: "J" }, "address_street"],
      [{ postal_code: "1385" }, "postal_code"],
      [{ maps_url: "http://maps.google.com" }, "maps_url"],
      [{ open_days: [] }, "open_days"],
      [{ open_days: [0, 8] }, "open_days"],
      [{ opens_at: "9:00" }, "hours"],
      [{ opens_at: "17:00", closes_at: "09:00" }, "hours"],
      [{ social_links: [{ label: "IG", url: "instagram.com/menik" }] }, "social_links"],
      [{ social_links: [{ label: "", url: "https://instagram.com/menik" }] }, "social_links"],
    ];

    for (const [ubah, field] of kasus) {
      const hasil = periksaToko(toko(ubah));
      expect(hasil.ok, JSON.stringify(ubah)).toBe(false);
      if (hasil.ok) continue;
      expect(hasil.status).toBe(422);
      expect(hasil.badan.field, JSON.stringify(ubah)).toBe(field);
    }
  });

  it("membatasi jumlah link media sosial", () => {
    const banyak = Array.from({ length: 9 }, (_, i) => ({ label: `Akun ${i}`, url: `https://contoh.test/${i}` }));
    const hasil = periksaToko(toko({ social_links: banyak }));

    expect(hasil.ok).toBe(false);
    if (hasil.ok) return;
    expect(hasil.badan.error).toBe("too_many_social_links");
  });
});
