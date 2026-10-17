import { env } from "cloudflare:workers";
import { Elysia, t } from "elysia";

import { alamatToko as tokoDari, asalApi } from "../lib/alamat";
import { samaAman } from "../lib/auth";
import { buatKoneksi, tutup } from "../lib/db";
import {
  COOKIE_OAUTH,
  JALUR_COOKIE_OAUTH,
  bacaIdToken,
  bacaKonfigGoogle,
  bukaJejak,
  jejakBaru,
  kemasJejak,
  periksaKlaim,
  tukarKode,
  urlMasuk,
} from "../lib/google";
import {
  COOKIE_SESI,
  UMUR_SESI_HARI,
  bacaCookie,
  cookie,
  domainCookie,
  hapusCookie,
  hashToken,
  tokenAcak,
  tujuanAman,
} from "../lib/sesi";
import {
  alamatTerakhir,
  buatSesi,
  hapusSesi,
  penggunaDariCookie,
  pesananPengguna,
  selesaikanMasuk,
} from "../db/akun";

function wadah(): Record<string, unknown> {
  return env as unknown as Record<string, unknown>;
}

function alamatToko(): string {
  return tokoDari(wadah());
}

function alihkan(ke: string, cookies: string[] = []): Response {
  const kepala = new Headers({ Location: ke, "Cache-Control": "no-store" });
  for (const c of cookies) kepala.append("Set-Cookie", c);
  return new Response(null, { status: 302, headers: kepala });
}

function gagalMasuk(alasan: "belum-aktif" | "dibatalkan" | "kedaluwarsa" | "gagal"): Response {
  return alihkan(`${alamatToko()}/masuk?galat=${alasan}`, [
    hapusCookie(COOKIE_OAUTH, { path: JALUR_COOKIE_OAUTH }),
  ]);
}

export const akunRoutes = new Elysia()
  .get(
    "/api/auth/google/start",
    async ({ query, request }) => {
      const konfig = bacaKonfigGoogle(wadah(), asalApi(wadah(), request));
      if (!konfig) return gagalMasuk("belum-aktif");

      const jejak = jejakBaru(tujuanAman(query.next));

      return alihkan(await urlMasuk(konfig, jejak), [
        cookie(COOKIE_OAUTH, kemasJejak(jejak), { maxAge: 600, path: JALUR_COOKIE_OAUTH }),
      ]);
    },
    {
      query: t.Object(
        { next: t.Optional(t.String({ maxLength: 200 })) },
        { additionalProperties: true },
      ),
    },
  )
  .get(
    "/api/auth/google/callback",
    async ({ query, request, headers }) => {
      const konfig = bacaKonfigGoogle(wadah(), asalApi(wadah(), request));
      if (!konfig) return gagalMasuk("belum-aktif");
      if (query.error) return gagalMasuk("dibatalkan");

      const jejak = bukaJejak(bacaCookie(headers.cookie, COOKIE_OAUTH));

      if (!jejak || !query.code || !query.state || !samaAman(query.state, jejak.state)) {
        return gagalMasuk("kedaluwarsa");
      }

      const tukar = await tukarKode(konfig, query.code, jejak.verifier);

      if (!tukar.ok) {
        console.error("[google] penukaran kode ditolak", tukar.pesan);
        return gagalMasuk("gagal");
      }

      const cek = periksaKlaim(bacaIdToken(tukar.idToken), {
        clientId: konfig.clientId,
        nonce: jejak.nonce,
        sekarang: new Date(),
      });

      if (!cek.ok) {
        console.error("[google] klaim id_token ditolak", cek.alasan);
        return gagalMasuk("gagal");
      }

      const sql = buatKoneksi(wadah());

      try {
        const { pengguna } = await selesaikanMasuk(sql, cek.profil);
        const token = tokenAcak();
        await buatSesi(sql, pengguna.id, await hashToken(token), UMUR_SESI_HARI);

        return alihkan(`${alamatToko()}${jejak.next}`, [
          cookie(COOKIE_SESI, token, {
            maxAge: UMUR_SESI_HARI * 86400,
            domain: domainCookie(wadah()),
          }),
          hapusCookie(COOKIE_OAUTH, { path: JALUR_COOKIE_OAUTH }),
        ]);
      } finally {
        await tutup(sql);
      }
    },
    {
      query: t.Object(
        {
          code: t.Optional(t.String({ maxLength: 2048 })),
          state: t.Optional(t.String({ maxLength: 200 })),
          error: t.Optional(t.String({ maxLength: 200 })),
        },
        { additionalProperties: true },
      ),
    },
  )
  .get("/api/auth/me", async ({ headers, set }) => {
    set.headers["cache-control"] = "no-store";
    const sql = buatKoneksi(wadah());

    try {
      const pengguna = await penggunaDariCookie(sql, headers.cookie);

      if (!pengguna) {
        set.status = 401;
        return { error: "unauthorized", message: "Belum masuk" };
      }

      return {
        user: { name: pengguna.name, email: pengguna.email },
        last_address: (await alamatTerakhir(sql, pengguna.id)) ?? null,
      };
    } finally {
      await tutup(sql);
    }
  })
  .post("/api/auth/logout", async ({ headers, set }) => {
    const asal = headers.origin;

    if (asal && asal.replace(/\/+$/, "") !== alamatToko()) {
      set.status = 403;
      return { error: "forbidden", message: "Asal permintaan tidak dikenali" };
    }

    const sql = buatKoneksi(wadah());

    try {
      await hapusSesi(sql, bacaCookie(headers.cookie, COOKIE_SESI));
    } finally {
      await tutup(sql);
    }

    const kepala = new Headers({ Location: `${alamatToko()}/`, "Cache-Control": "no-store" });
    kepala.append("Set-Cookie", hapusCookie(COOKIE_SESI, { domain: domainCookie(wadah()) }));
    return new Response(null, { status: 303, headers: kepala });
  })
  .get("/api/account/orders", async ({ headers, set }) => {
    set.headers["cache-control"] = "no-store";
    const sql = buatKoneksi(wadah());

    try {
      const pengguna = await penggunaDariCookie(sql, headers.cookie);

      if (!pengguna) {
        set.status = 401;
        return { error: "unauthorized", message: "Belum masuk" };
      }

      return { data: await pesananPengguna(sql, pengguna.id) };
    } finally {
      await tutup(sql);
    }
  });
