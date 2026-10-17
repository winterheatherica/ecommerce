import { createHash } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  bacaIdToken,
  bacaKonfigGoogle,
  bukaJejak,
  jejakBaru,
  kemasJejak,
  periksaKlaim,
  tantanganPkce,
  tukarKode,
  urlMasuk,
  type Klaim,
  type KonfigGoogle,
} from "./google";
import {
  bacaCookie,
  cookie,
  hapusCookie,
  hashToken,
  tokenAcak,
  tujuanAman,
} from "./sesi";

const KONFIG: KonfigGoogle = {
  clientId: "1234-abc.apps.googleusercontent.com",
  clientSecret: "rahasia-uji",
  redirectUri: "https://menikstore.my.id/api/auth/google/callback",
};

afterEach(() => {
  vi.unstubAllGlobals();
});

function jwt(klaim: Klaim): string {
  const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");
  return `${b64({ alg: "RS256" })}.${b64(klaim)}.tanda-tangan`;
}

describe("PKCE", () => {
  it("cocok dengan vektor uji resmi RFC 7636 lampiran B", async () => {
    expect(await tantanganPkce("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk")).toBe(
      "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM",
    );
  });

  it("verifier acak memenuhi syarat RFC: 43 sampai 128 karakter tanpa padding", () => {
    const j = jejakBaru("/akun");

    expect(j.verifier).toMatch(/^[A-Za-z0-9_-]{43,128}$/);
    expect(j.state).not.toBe(jejakBaru("/akun").state);
  });
});

describe("urlMasuk", () => {
  it("memuat semua parameter yang dibutuhkan Google, dengan tantangan dari verifier", async () => {
    const jejak = jejakBaru("/checkout");
    const url = new URL(await urlMasuk(KONFIG, jejak));
    const q = url.searchParams;

    expect(url.origin + url.pathname).toBe("https://accounts.google.com/o/oauth2/v2/auth");
    expect(q.get("client_id")).toBe(KONFIG.clientId);
    expect(q.get("redirect_uri")).toBe(KONFIG.redirectUri);
    expect(q.get("response_type")).toBe("code");
    expect(q.get("scope")).toBe("openid email profile");
    expect(q.get("state")).toBe(jejak.state);
    expect(q.get("nonce")).toBe(jejak.nonce);
    expect(q.get("code_challenge_method")).toBe("S256");
    expect(q.get("code_challenge")).toBe(
      createHash("sha256").update(jejak.verifier).digest("base64url"),
    );
  });
});

describe("jejak OAuth di cookie", () => {
  it("bisa dikemas dan dibuka kembali utuh", () => {
    const j = jejakBaru("/checkout");
    expect(bukaJejak(kemasJejak(j))).toEqual(j);
  });

  it("isi rusak atau kosong dianggap tidak ada", () => {
    expect(bukaJejak(null)).toBeNull();
    expect(bukaJejak("bukan-json")).toBeNull();
    expect(bukaJejak(Buffer.from('{"state":1}').toString("base64url"))).toBeNull();
  });
});

describe("periksaKlaim", () => {
  const sekarang = new Date("2026-10-17T00:00:00Z");
  const sah: Klaim = {
    iss: "https://accounts.google.com",
    aud: KONFIG.clientId,
    sub: "110169484474386276334",
    email: "Rina.Kartika@gmail.com",
    email_verified: true,
    name: "Rina Kartika",
    exp: sekarang.getTime() / 1000 + 300,
    nonce: "nonce-1",
  };
  const harapan = { clientId: KONFIG.clientId, nonce: "nonce-1", sekarang };

  it("menerima klaim yang sah dan menyeragamkan email ke huruf kecil", () => {
    expect(periksaKlaim(sah, harapan)).toEqual({
      ok: true,
      profil: { sub: "110169484474386276334", email: "rina.kartika@gmail.com", name: "Rina Kartika" },
    });
  });

  it("menolak setiap klaim yang menyimpang", () => {
    const kasus: [string, Klaim][] = [
      ["penerbit lain", { ...sah, iss: "https://evil.example" }],
      ["audiens aplikasi lain", { ...sah, aud: "aplikasi-lain" }],
      ["sudah kedaluwarsa", { ...sah, exp: sekarang.getTime() / 1000 - 1 }],
      ["nonce beda, tanda serangan replay", { ...sah, nonce: "nonce-lain" }],
      ["email belum diverifikasi", { ...sah, email_verified: false }],
      ["tanpa sub", { ...sah, sub: undefined }],
    ];

    for (const [nama, klaim] of kasus) {
      expect(periksaKlaim(klaim, harapan).ok, nama).toBe(false);
    }
  });

  it("memakai bagian depan email kalau Google tidak mengirim nama", () => {
    const hasil = periksaKlaim({ ...sah, name: undefined, given_name: undefined }, harapan);
    expect(hasil.ok && hasil.profil.name).toBe("Rina.Kartika");
  });

  it("membaca nama dengan huruf di luar ASCII dari id_token", () => {
    const klaim = bacaIdToken(jwt({ ...sah, name: "Ñoño Sánchez" }));
    expect(klaim?.name).toBe("Ñoño Sánchez");
  });

  it("id_token yang bentuknya salah tidak dibaca", () => {
    expect(bacaIdToken("dua.bagian")).toBeNull();
    expect(periksaKlaim(bacaIdToken("a.b.c"), harapan).ok).toBe(false);
  });
});

describe("tukarKode", () => {
  it("mengirim kode, verifier, dan secret ke endpoint token Google", async () => {
    const tangkap = vi.fn(async (_url: string, _init?: RequestInit) =>
      new Response(JSON.stringify({ id_token: "x.y.z" }), { status: 200 }),
    );
    vi.stubGlobal("fetch", tangkap);

    const hasil = await tukarKode(KONFIG, "kode-1", "verifier-1");

    expect(hasil).toEqual({ ok: true, idToken: "x.y.z" });
    const [url, init] = tangkap.mock.calls[0];
    const badan = new URLSearchParams(String(init?.body));

    expect(url).toBe("https://oauth2.googleapis.com/token");
    expect(Object.fromEntries(badan)).toEqual({
      code: "kode-1",
      client_id: KONFIG.clientId,
      client_secret: KONFIG.clientSecret,
      redirect_uri: KONFIG.redirectUri,
      grant_type: "authorization_code",
      code_verifier: "verifier-1",
    });
  });

  it("meneruskan alasan penolakan dari Google", async () => {
    vi.stubGlobal("fetch", vi.fn(async () =>
      new Response(JSON.stringify({ error: "invalid_grant", error_description: "Bad Request" }), { status: 400 }),
    ));

    expect(await tukarKode(KONFIG, "kode-basi", "v")).toEqual({ ok: false, pesan: "Bad Request" });
  });
});

describe("bacaKonfigGoogle", () => {
  it("alamat callback berada di domain API, bukan domain toko", () => {
    expect(
      bacaKonfigGoogle(
        { GOOGLE_CLIENT_ID: KONFIG.clientId, GOOGLE_CLIENT_SECRET: "s" },
        "https://api.menikstore.my.id/",
      )?.redirectUri,
    ).toBe("https://api.menikstore.my.id/api/auth/google/callback");
  });

  it("kosong kalau kredensial belum dipasang", () => {
    expect(bacaKonfigGoogle({}, "https://api.menikstore.my.id")).toBeUndefined();
  });
});

describe("sesi dan cookie", () => {
  it("token acak tidak pernah sama dan aman dipakai di cookie", () => {
    const a = tokenAcak();
    expect(a).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(a).not.toBe(tokenAcak());
  });

  it("hash token sama dengan SHA-256 heksadesimal dari node:crypto", async () => {
    expect(await hashToken("abc")).toBe(createHash("sha256").update("abc").digest("hex"));
  });

  it("membaca satu cookie dari header yang berisi banyak cookie", () => {
    const header = "a=1; sid=token-ku; g_oauth=xyz";
    expect(bacaCookie(header, "sid")).toBe("token-ku");
    expect(bacaCookie(header, "id")).toBeNull();
    expect(bacaCookie("sid=", "sid")).toBeNull();
    expect(bacaCookie(undefined, "sid")).toBeNull();
  });

  it("cookie sesi selalu HttpOnly, Secure, dan SameSite=Lax", () => {
    expect(cookie("sid", "t", { maxAge: 60 })).toBe(
      "sid=t; Path=/; Max-Age=60; HttpOnly; Secure; SameSite=Lax",
    );
  });

  it("domain cookie dipasang kalau diminta, supaya toko dan API sama-sama membacanya", () => {
    expect(cookie("sid", "t", { maxAge: 60, domain: "menikstore.my.id" })).toBe(
      "sid=t; Path=/; Domain=menikstore.my.id; Max-Age=60; HttpOnly; Secure; SameSite=Lax",
    );
    expect(hapusCookie("sid", { domain: "menikstore.my.id" })).toBe(
      "sid=; Path=/; Domain=menikstore.my.id; Max-Age=0; HttpOnly; Secure; SameSite=Lax",
    );
  });

  it("tujuan setelah masuk hanya boleh jalur di situs sendiri", () => {
    for (const buruk of ["https://evil.example", "//evil.example", "/\\evil.example", "javascript:alert(1)", "", "/a\nb"]) {
      expect(tujuanAman(buruk), buruk).toBe("/akun");
    }
    expect(tujuanAman("/checkout")).toBe("/checkout");
    expect(tujuanAman("/order/MNK-1?dari=akun")).toBe("/order/MNK-1?dari=akun");
    expect(tujuanAman(null)).toBe("/akun");
  });
});
