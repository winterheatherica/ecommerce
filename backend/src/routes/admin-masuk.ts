import { env } from "cloudflare:workers";
import { Elysia, t } from "elysia";

import { alamatToko } from "../lib/alamat";
import { kredensialAdminCocok } from "../lib/auth";
import { buatKoneksi, tutup } from "../lib/db";
import { ambilPembatas, ipPembeli, kunciIp, lolos, zonaToko } from "../lib/ratelimit";
import {
  COOKIE_ADMIN,
  UMUR_SESI_ADMIN_JAM,
  bacaCookie,
  cookie,
  domainCookie,
  hapusCookie,
  hashToken,
  tokenAcak,
  tujuanAman,
} from "../lib/sesi";
import { bacaKonfigTurnstile, periksaTurnstile } from "../lib/turnstile";
import { buatSesiAdmin, hapusSesiAdmin } from "../db/admin";

const HALAMAN_MASUK = "/masuk-admin";

function wadah(): Record<string, unknown> {
  return env as unknown as Record<string, unknown>;
}

function dariToko(origin: string | undefined): boolean {
  return !origin || origin.replace(/\/+$/, "") === alamatToko(wadah());
}

function alihkan(tujuan: string, cookieBaru?: string): Response {
  const kepala = new Headers({ Location: tujuan, "Cache-Control": "no-store" });
  if (cookieBaru) kepala.append("Set-Cookie", cookieBaru);
  return new Response(null, { status: 303, headers: kepala });
}

function gagal(kode: string, next: string): Response {
  const q = new URLSearchParams({ galat: kode, next });
  return alihkan(`${alamatToko(wadah())}${HALAMAN_MASUK}?${q}`);
}

export const adminMasukRoutes = new Elysia({ prefix: "/api/auth/admin" })
  .post(
    "/login",
    async ({ body, headers, request }) => {
      const next = tujuanAman(body.next, "/admin");

      if (!dariToko(headers.origin)) return gagal("asal", next);

      const pembatas = ambilPembatas(wadah(), "PESANAN_LIMIT");
      if (!(await lolos(pembatas, kunciIp(request, "masuk-admin", wadah())))) {
        return gagal("batas", next);
      }

      const turnstile = bacaKonfigTurnstile(wadah());
      if (turnstile) {
        const ip = ipPembeli(request, zonaToko(wadah()));
        const lulus = await periksaTurnstile(turnstile.secret, body["cf-turnstile-response"], ip);
        if (!lulus) return gagal("captcha", next);
      }

      if (!kredensialAdminCocok(wadah(), body.username ?? "", body.password ?? "")) {
        return gagal("salah", next);
      }

      const token = tokenAcak();
      const sql = buatKoneksi(wadah());

      try {
        await buatSesiAdmin(sql, await hashToken(token), UMUR_SESI_ADMIN_JAM);
      } finally {
        await tutup(sql);
      }

      return alihkan(
        `${alamatToko(wadah())}${next}`,
        cookie(COOKIE_ADMIN, token, {
          maxAge: UMUR_SESI_ADMIN_JAM * 3600,
          domain: domainCookie(wadah()),
        }),
      );
    },
    {
      body: t.Object({
        username: t.Optional(t.String({ maxLength: 100 })),
        password: t.Optional(t.String({ maxLength: 200 })),
        next: t.Optional(t.String({ maxLength: 200 })),
        "cf-turnstile-response": t.Optional(t.String({ maxLength: 4096 })),
      }),
    },
  )
  .post("/logout", async ({ headers }) => {
    if (dariToko(headers.origin)) {
      const sql = buatKoneksi(wadah());

      try {
        await hapusSesiAdmin(sql, bacaCookie(headers.cookie, COOKIE_ADMIN));
      } finally {
        await tutup(sql);
      }
    }

    return alihkan(
      `${alamatToko(wadah())}${HALAMAN_MASUK}`,
      hapusCookie(COOKIE_ADMIN, { domain: domainCookie(wadah()) }),
    );
  });
