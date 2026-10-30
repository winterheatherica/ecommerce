import { describe, expect, it } from "vitest";

import { penandaAsing, periksaFaq, type KelompokFaqBaru } from "./faq";

const kelompok = (ubah: Partial<KelompokFaqBaru> = {}): KelompokFaqBaru => ({
  slug: "pengiriman",
  title: "Pengiriman",
  items: [{ question: "Dikirim dari mana?", answer: "Dikirim dari {kota}." }],
  ...ubah,
});

describe("penandaAsing", () => {
  it("cuma mengenal penanda info toko yang tersedia", () => {
    expect(penandaAsing("Hubungi {wa} pada {hari}, {jam}. {libur} tutup. Dari {kota}, {alamat}.")).toBeNull();
    expect(penandaAsing("Hubungi {whatsapp}")).toBe("{whatsapp}");
    expect(penandaAsing("Tanpa penanda")).toBeNull();
  });
});

describe("periksaFaq", () => {
  it("merapikan spasi tapi mempertahankan baris baru di jawaban", () => {
    const hasil = periksaFaq([
      kelompok({
        slug: " Pengiriman ",
        items: [{ question: "  Dikirim   dari mana? ", answer: "Baris satu  \r\n\r\n\r\n  Baris   dua " }],
      }),
    ]);

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(hasil.bersih[0].slug).toBe("pengiriman");
    expect(hasil.bersih[0].items[0]).toEqual({
      question: "Dikirim dari mana?",
      answer: "Baris satu\n\nBaris dua",
    });
  });

  it("menolak penanda yang salah ketik dan menyebut letaknya", () => {
    const hasil = periksaFaq([kelompok({ items: [{ question: "Jam buka?", answer: "Buka {jam_buka}" }] })]);

    expect(hasil.ok).toBe(false);
    if (hasil.ok) return;
    expect(hasil.badan.error).toBe("unknown_placeholder");
    expect(hasil.badan.message).toContain("pertanyaan 1");
    expect(hasil.badan.message).toContain("{jam_buka}");
  });

  it("menolak kelompok kosong, slug ganda, dan pertanyaan terlalu pendek", () => {
    const kasus = [
      [],
      [kelompok({ items: [] })],
      [kelompok(), kelompok()],
      [kelompok({ slug: "bukan slug" })],
      [kelompok({ items: [{ question: "Hm?", answer: "Ya" }] })],
    ];

    for (const isi of kasus) {
      expect(periksaFaq(isi).ok, JSON.stringify(isi).slice(0, 100)).toBe(false);
    }
  });
});
