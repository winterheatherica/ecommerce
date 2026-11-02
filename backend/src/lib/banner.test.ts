import { describe, expect, it } from "vitest";

import {
  BANNER_MAKS,
  bannerAdmin,
  bannerPublik,
  periksaBanner,
  urlBanner,
  type BannerBaru,
  type BarisBanner,
} from "./banner";

const unggahan = (ubah: Partial<BannerBaru> = {}): BannerBaru => ({
  cloudinary_id: "menik-store/banner/abc-123",
  version: 1730000000,
  width: 1200,
  height: 600,
  alt: "Promo akhir bulan",
  link: "/produk",
  ...ubah,
});

const bawaan = (ubah: Partial<BannerBaru> = {}): BannerBaru => ({
  static_path: "/banner-promo/contoh-1.webp",
  width: 1200,
  height: 600,
  alt: "Banner contoh",
  ...ubah,
});

function pesanGagal(daftar: BannerBaru[]): string {
  const hasil = periksaBanner(daftar);
  if (hasil.ok) throw new Error("seharusnya ditolak");
  return String(hasil.badan.message);
}

describe("periksaBanner", () => {
  it("menerima banner unggahan dan banner contoh bawaan, lalu merapikan isinya", () => {
    const hasil = periksaBanner([
      unggahan({ alt: "  Promo   akhir bulan ", link: "  " }),
      bawaan({ version: 99 }),
    ]);

    expect(hasil).toEqual({
      ok: true,
      bersih: [
        {
          cloudinary_id: "menik-store/banner/abc-123",
          static_path: null,
          version: 1730000000,
          width: 1200,
          height: 600,
          alt: "Promo akhir bulan",
          link: null,
        },
        {
          cloudinary_id: null,
          static_path: "/banner-promo/contoh-1.webp",
          version: null,
          width: 1200,
          height: 600,
          alt: "Banner contoh",
          link: null,
        },
      ],
    });
  });

  it("boleh kosong, supaya semua banner bisa dihapus", () => {
    expect(periksaBanner([])).toEqual({ ok: true, bersih: [] });
  });

  it("menolak banner tanpa gambar, dengan dua sumber, atau di luar folder banner", () => {
    expect(pesanGagal([unggahan({ cloudinary_id: null })])).toBe("Banner 1: gambar tidak valid");
    expect(pesanGagal([unggahan({ static_path: "/banner-promo/contoh-1.webp" })])).toBe(
      "Banner 1: gambar tidak valid",
    );
    expect(pesanGagal([unggahan({ cloudinary_id: "menik-store/produk/abc" })])).toBe(
      "Banner 1: gambar tidak valid",
    );
    expect(pesanGagal([bawaan({ static_path: "/banner.webp" })])).toBe("Banner 1: gambar tidak valid");
    expect(pesanGagal([bawaan({ static_path: "/banner-promo/../rahasia.webp" })])).toBe(
      "Banner 1: gambar tidak valid",
    );
  });

  it("menolak gambar yang sama dipasang dua kali", () => {
    expect(pesanGagal([unggahan(), unggahan({ alt: "Lain" })])).toBe("Banner 2: gambar yang sama dipasang dua kali");
  });

  it("mewajibkan keterangan gambar untuk pembaca layar", () => {
    expect(pesanGagal([unggahan({ alt: "  " })])).toBe("Banner 1: keterangan gambar 3 sampai 160 huruf");
    expect(pesanGagal([unggahan({ alt: "x".repeat(161) })])).toBe(
      "Banner 1: keterangan gambar 3 sampai 160 huruf",
    );
  });

  it("cuma menerima link ke halaman toko atau https", () => {
    for (const link of ["/", "/produk", "/produk?grup=hama", "https://shopee.co.id/menikstore"]) {
      expect(periksaBanner([unggahan({ link })]).ok).toBe(true);
    }

    for (const link of ["//situs-lain.com", "javascript:alert(1)", "http://situs.com", "produk", "/a b"]) {
      expect(pesanGagal([unggahan({ link })])).toBe(
        "Banner 1: link harus diawali / untuk halaman toko, atau https:// untuk situs lain",
      );
    }
  });

  it("menolak ukuran yang cuma terisi sebelah dan jumlah banner yang berlebihan", () => {
    expect(pesanGagal([unggahan({ height: null })])).toBe("Banner 1: ukuran gambar tidak valid");

    const banyak = Array.from({ length: BANNER_MAKS + 1 }, (_, i) =>
      unggahan({ cloudinary_id: `menik-store/banner/b${i}` }),
    );
    expect(pesanGagal(banyak)).toBe(`Maksimal ${BANNER_MAKS} banner promo`);
  });
});

describe("url banner", () => {
  const baris: BarisBanner[] = [
    {
      id: 7,
      cloudinary_id: "menik-store/banner/abc",
      static_path: null,
      version: 1730000000,
      width: 1200,
      height: 600,
      alt: "Promo",
      link: "/produk",
    },
    {
      id: 8,
      cloudinary_id: null,
      static_path: "/banner-promo/contoh-2.webp",
      version: null,
      width: 1200,
      height: 600,
      alt: "Contoh",
      link: null,
    },
  ];

  it("membangun URL Cloudinary atau memakai jalur file bawaan apa adanya", () => {
    expect(urlBanner("awan-uji", baris[0])).toBe(
      "https://res.cloudinary.com/awan-uji/image/upload/v1730000000/menik-store/banner/abc",
    );
    expect(urlBanner("awan-uji", baris[1])).toBe("/banner-promo/contoh-2.webp");
  });

  it("versi publik tidak membocorkan id Cloudinary, versi admin tetap lengkap", () => {
    expect(bannerPublik("awan-uji", baris)[0]).toEqual({
      id: 7,
      url: "https://res.cloudinary.com/awan-uji/image/upload/v1730000000/menik-store/banner/abc",
      width: 1200,
      height: 600,
      alt: "Promo",
      link: "/produk",
    });
    expect(bannerAdmin("awan-uji", baris)[1]).toEqual({ ...baris[1], url: "/banner-promo/contoh-2.webp" });
  });
});
