import { describe, expect, it } from "vitest";

import { blokIp, kunciIp } from "./ratelimit";

describe("blokIp", () => {
  it("IPv4 dibiarkan apa adanya", () => {
    expect(blokIp("36.71.20.5")).toBe("36.71.20.5");
  });

  it("IPv6 dipotong jadi blok /64, apa pun cara penulisannya", () => {
    const blok = "2001:db8:abcd:12::/64";
    expect(blokIp("2001:db8:abcd:12::1")).toBe(blok);
    expect(blokIp("2001:0db8:abcd:0012:ffff:ffff:ffff:ffff")).toBe(blok);
    expect(blokIp("2001:DB8:ABCD:12:0:0:0:9")).toBe(blok);
    expect(blokIp("2001:db8:abcd:12:a:b:c:d%eth0")).toBe(blok);
  });

  it("alamat dengan :: di depan atau di tengah tetap terbaca", () => {
    expect(blokIp("::1")).toBe("0:0:0:0::/64");
    expect(blokIp("2001:db8::")).toBe("2001:db8:0:0::/64");
    expect(blokIp("fe80::1:2:3:4")).toBe("fe80:0:0:0::/64");
  });

  it("IPv4 yang dibungkus IPv6 dikembalikan ke bentuk IPv4", () => {
    expect(blokIp("::ffff:36.71.20.5")).toBe("36.71.20.5");
    expect(blokIp("::ffff:2447:1405")).toBe("36.71.20.5");
  });

  it("teks yang bukan IP tidak bikin error dan tetap dipakai apa adanya", () => {
    expect(blokIp("tanpa-ip")).toBe("tanpa-ip");
    expect(blokIp("1:2:3")).toBe("1:2:3");
    expect(blokIp("1::2::3")).toBe("1::2::3");
    expect(blokIp("::ffff:999.1.1.1")).toBe("::ffff:999.1.1.1");
  });
});

describe("kunciIp memakai blok /64", () => {
  const minta = (ip: string) =>
    new Request("https://api.contoh/x", { headers: { "cf-connecting-ip": ip } });

  it("dua alamat dari blok /64 yang sama berbagi kuota", () => {
    expect(kunciIp(minta("2001:db8:1:2::aaaa"), "umum")).toBe(
      kunciIp(minta("2001:db8:1:2::bbbb"), "umum"),
    );
  });

  it("blok /64 yang berbeda punya kuota sendiri", () => {
    expect(kunciIp(minta("2001:db8:1:2::1"), "umum")).not.toBe(
      kunciIp(minta("2001:db8:1:3::1"), "umum"),
    );
  });
});
