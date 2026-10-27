import { describe, expect, it } from "vitest";

import {
  periksaPerubahanVarian,
  periksaVarianBaru,
  type VarianBaru,
} from "./variants";

function baru(ubah: Partial<VarianBaru> = {}): VarianBaru {
  return {
    slug: "bye-bye-cat-120g",
    label: "120 g",
    price: 79000,
    weight_g: 120,
    ...ubah,
  };
}

describe("periksaVarianBaru", () => {
  it("menolak slug dengan huruf besar, spasi, atau tanda hubung ganda", () => {
    for (const slug of ["Bye Bye", "bye_bye", "bye--bye", "-bye", ""]) {
      const hasil = periksaVarianBaru(baru({ slug }));
      expect(hasil.ok, slug).toBe(false);
    }
  });

  it("menolak label kosong karena pembeli tidak akan tahu mana yang dipilih", () => {
    const hasil = periksaVarianBaru(baru({ label: "   " }));

    expect(hasil.ok).toBe(false);
    if (hasil.ok) return;
    expect(hasil.status).toBe(422);
    expect(hasil.badan.error).toBe("invalid_label");
  });

  it("stok default nol, jadi varian baru tidak langsung bisa dibeli", () => {
    const hasil = periksaVarianBaru(baru());

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(hasil.bersih.stock).toBe(0);
  });

  it("sort_order null kalau tidak diisi, biar database yang menentukan", () => {
    const hasil = periksaVarianBaru(baru());

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(hasil.bersih.sort_order).toBeNull();
  });

  it("membersihkan spasi dan huruf besar", () => {
    const hasil = periksaVarianBaru(baru({ slug: "  Bye-BYE-200g ", label: "  200 g  " }));

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(hasil.bersih.slug).toBe("bye-bye-200g");
    expect(hasil.bersih.label).toBe("200 g");
  });
});

describe("periksaPerubahanVarian", () => {
  it("hanya memuat field yang dikirim", () => {
    const hasil = periksaPerubahanVarian({ stock: 12 });

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(Object.keys(hasil.bersih)).toEqual(["stock"]);
  });

  it("tidak memuat apa pun kalau tidak ada yang dikirim", () => {
    const hasil = periksaPerubahanVarian({});

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(Object.keys(hasil.bersih)).toHaveLength(0);
  });

  it("membedakan nol dari tidak dikirim", () => {
    const hasil = periksaPerubahanVarian({ stock: 0 });

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(hasil.bersih.stock).toBe(0);
    expect("price" in hasil.bersih).toBe(false);
  });

  it("membedakan false dari tidak dikirim", () => {
    const hasil = periksaPerubahanVarian({ is_active: false });

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(hasil.bersih.is_active).toBe(false);
  });

  it("menolak label yang jadi kosong setelah spasi dibuang", () => {
    const hasil = periksaPerubahanVarian({ label: "  " });

    expect(hasil.ok).toBe(false);
    if (hasil.ok) return;
    expect(hasil.badan.error).toBe("invalid_label");
  });
});

describe("SKU varian", () => {
  it("menerima format SKU yang umum dipakai penjual", () => {
    for (const sku of ["001", "GOCAT-350", "BBC.80g", "PAKET/01", "a_b"]) {
      const hasil = periksaVarianBaru(baru({ sku }));
      expect(hasil.ok, sku).toBe(true);
    }
  });

  it("menolak spasi, awalan simbol, dan yang terlalu panjang", () => {
    for (const sku of ["GO CAT", "-001", "#12", "x".repeat(41)]) {
      const hasil = periksaVarianBaru(baru({ sku }));

      expect(hasil.ok, sku).toBe(false);
      if (hasil.ok) return;
      expect(hasil.badan.error).toBe("invalid_sku");
    }
  });

  it("SKU kosong saat menambah berarti minta nomor otomatis", () => {
    for (const sku of [undefined, "", "   "]) {
      const hasil = periksaVarianBaru(baru({ sku }));

      expect(hasil.ok).toBe(true);
      if (!hasil.ok) return;
      expect(hasil.bersih.sku).toBeNull();
    }
  });

  it("SKU kosong saat mengubah ditolak, karena setiap varian wajib punya SKU", () => {
    const hasil = periksaPerubahanVarian({ sku: "  " });

    expect(hasil.ok).toBe(false);
    if (hasil.ok) return;
    expect(hasil.badan.error).toBe("invalid_sku");
  });

  it("membuang spasi di tepi SKU", () => {
    const hasil = periksaPerubahanVarian({ sku: "  GOCAT-350 " });

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(hasil.bersih.sku).toBe("GOCAT-350");
  });
});

describe("isian promo", () => {
  it("tanggal dari form admin diseragamkan jadi waktu UTC", () => {
    const hasil = periksaPerubahanVarian({
      promo_price: 39000,
      promo_starts_at: "2026-10-20T09:00+07:00",
      promo_ends_at: "2026-10-27T21:00+07:00",
    });

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(hasil.bersih.promo_starts_at).toBe("2026-10-20T02:00:00.000Z");
    expect(hasil.bersih.promo_ends_at).toBe("2026-10-27T14:00:00.000Z");
  });

  it("tanggal yang tidak terbaca ditolak", () => {
    const hasil = periksaPerubahanVarian({ promo_ends_at: "besok sore" });

    expect(hasil.ok).toBe(false);
    if (hasil.ok) return;
    expect(hasil.badan.error).toBe("invalid_promo_date");
  });

  it("akhir sebelum mulai di isian yang sama langsung ditolak", () => {
    const hasil = periksaPerubahanVarian({
      promo_starts_at: "2026-10-27T00:00:00Z",
      promo_ends_at: "2026-10-20T00:00:00Z",
    });

    expect(hasil.ok).toBe(false);
    if (hasil.ok) return;
    expect(hasil.badan.error).toBe("promo_period_reversed");
  });

  it("null berarti dikosongkan, bukan diabaikan", () => {
    const hasil = periksaPerubahanVarian({
      promo_price: null,
      promo_starts_at: null,
      promo_ends_at: null,
      promo_show_period: false,
    });

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(hasil.bersih).toEqual({
      promo_price: null,
      promo_starts_at: null,
      promo_ends_at: null,
      promo_show_period: false,
    });
  });
});

describe("rating Shopee", () => {
  it("menerima link shopee.co.id, membuang spasi tepi, dan isian kosong berarti dikosongkan", () => {
    const hasil = periksaPerubahanVarian({
      shopee_url: "  https://shopee.co.id/product/72015932/2214610486  ",
    });
    expect(hasil.ok && hasil.bersih.shopee_url).toBe(
      "https://shopee.co.id/product/72015932/2214610486",
    );

    const kosong = periksaPerubahanVarian({ shopee_url: "   " });
    expect(kosong.ok && kosong.bersih.shopee_url).toBeNull();
  });

  it("menolak link selain shopee.co.id, termasuk tautan pendek, http, dan domain tiruan", () => {
    for (const url of [
      "http://shopee.co.id/product/1/2",
      "https://shopee.com/product/1/2",
      "https://id.shp.ee/abc123",
      "https://shopee.co.id.palsu.com/product/1/2",
      "https://shopee.co.id/",
      "https://shopee.co.id/ada spasi",
    ]) {
      expect(periksaPerubahanVarian({ shopee_url: url }).ok, url).toBe(false);
    }
  });

  it("rating dibulatkan dua angka di belakang koma", () => {
    const hasil = periksaPerubahanVarian({ shopee_rating: 4.7576, shopee_rating_count: 656 });
    expect(hasil.ok && hasil.bersih.shopee_rating).toBe(4.76);
  });

  it("penilaian di atas 0 wajib punya rating, dan rating tanpa penilaian ditolak", () => {
    expect(periksaPerubahanVarian({ shopee_rating: null, shopee_rating_count: 10 }).ok).toBe(false);
    expect(periksaPerubahanVarian({ shopee_rating: 4.5, shopee_rating_count: 0 }).ok).toBe(false);
    expect(periksaPerubahanVarian({ shopee_rating: 0.5 }).ok).toBe(false);
    expect(periksaPerubahanVarian({ shopee_rating: 5.5 }).ok).toBe(false);
    expect(periksaPerubahanVarian({ shopee_rating: null, shopee_rating_count: 0 }).ok).toBe(true);
  });
});

describe("rating Tokopedia", () => {
  it("menerima link tokopedia.com dengan atau tanpa www, dan isian kosong berarti dikosongkan", () => {
    const hasil = periksaPerubahanVarian({
      tokopedia_url: "  https://www.tokopedia.com/menikstore/gocat-gel-jumbo  ",
    });
    expect(hasil.ok && hasil.bersih.tokopedia_url).toBe(
      "https://www.tokopedia.com/menikstore/gocat-gel-jumbo",
    );
    expect(periksaPerubahanVarian({ tokopedia_url: "https://tokopedia.com/menikstore/x" }).ok).toBe(true);

    const kosong = periksaPerubahanVarian({ tokopedia_url: "   " });
    expect(kosong.ok && kosong.bersih.tokopedia_url).toBeNull();
  });

  it("menolak link selain tokopedia.com, termasuk http, link Shopee, dan domain tiruan", () => {
    for (const url of [
      "http://www.tokopedia.com/menikstore/x",
      "https://shopee.co.id/product/1/2",
      "https://www.tokopedia.com.palsu.com/menikstore/x",
      "https://www.tokopedia.com/",
      "https://www.tokopedia.com/ada spasi",
    ]) {
      const hasil = periksaPerubahanVarian({ tokopedia_url: url });
      expect(hasil.ok, url).toBe(false);
      expect(!hasil.ok && hasil.badan.error, url).toBe("invalid_tokopedia_url");
    }
  });

  it("jumlah rating di atas 0 wajib punya rating, dan aturannya terpisah dari Shopee", () => {
    const tanpaRating = periksaPerubahanVarian({ tokopedia_rating: null, tokopedia_rating_count: 10 });
    expect(!tanpaRating.ok && tanpaRating.badan.error).toBe("tokopedia_rating_inconsistent");
    expect(periksaPerubahanVarian({ tokopedia_rating: 4.5, tokopedia_rating_count: 0 }).ok).toBe(false);

    const keduanya = periksaPerubahanVarian({
      shopee_rating: 4.79,
      shopee_rating_count: 1814,
      tokopedia_rating: 4.7408,
      tokopedia_rating_count: 4884,
    });
    expect(keduanya.ok && keduanya.bersih).toEqual({
      shopee_rating: 4.79,
      shopee_rating_count: 1814,
      tokopedia_rating: 4.74,
      tokopedia_rating_count: 4884,
    });
  });
});
