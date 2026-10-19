import type { Metadata } from "next";
import Script from "next/script";

import { alamatApi } from "@/app/lib/akun";

export const metadata: Metadata = {
  title: "Masuk admin",
  robots: { index: false, follow: false },
};

const PESAN: Record<string, string> = {
  salah: "Username atau password salah.",
  captcha: "Verifikasi captcha gagal. Centang ulang lalu coba lagi.",
  batas: "Terlalu banyak percobaan. Tunggu satu menit lalu coba lagi.",
  kedaluwarsa: "Sesi admin sudah habis. Silakan masuk lagi.",
  asal: "Permintaan tidak dikenali. Muat ulang halaman ini lalu coba lagi.",
};

type Props = {
  searchParams: Promise<{ galat?: string; next?: string }>;
};

async function kunciCaptcha(): Promise<string | null> {
  try {
    const res = await fetch(`${alamatApi()}/api/auth/admin/config`, { cache: "no-store" });
    if (!res.ok) return null;
    return ((await res.json()) as { turnstile_site_key: string | null }).turnstile_site_key;
  } catch {
    return null;
  }
}

const label = "block font-mono text-[12px] tracking-[0.2em] text-stone-500 uppercase";
const kotak =
  "mt-2 w-full border border-ink/15 bg-white px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-brand-500";

export default async function MasukAdminPage({ searchParams }: Props) {
  const { galat, next } = await searchParams;
  const kunci = await kunciCaptcha();
  const pesan = galat ? (PESAN[galat] ?? "Gagal masuk. Coba lagi.") : null;

  return (
    <main className="flex min-h-svh items-center justify-center bg-stone-50 px-6 py-16">
      <form
        method="post"
        action={`${alamatApi()}/api/auth/admin/login`}
        className="w-full max-w-sm border border-ink/10 bg-white p-8 shadow-sm"
      >
        <p className="font-mono text-[12px] tracking-[0.28em] text-accent-600 uppercase">
          Menik Store
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-ink">Masuk admin</h1>

        {pesan && (
          <p role="alert" className="mt-6 border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {pesan}
          </p>
        )}

        <input type="hidden" name="next" value={next ?? "/admin"} />

        <div className="mt-6">
          <label className={label} htmlFor="username">
            Username
          </label>
          <input
            id="username"
            name="username"
            autoComplete="username"
            required
            maxLength={100}
            className={kotak}
          />
        </div>

        <div className="mt-5">
          <label className={label} htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            maxLength={200}
            className={kotak}
          />
        </div>

        {kunci && (
          <>
            <div className="cf-turnstile mt-6" data-sitekey={kunci} data-language="id" data-theme="light" />
            <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" />
          </>
        )}

        <button
          type="submit"
          className="mt-8 w-full border border-brand-500 bg-brand-500 px-8 py-3.5 font-mono text-[13px] tracking-[0.22em] indent-[0.22em] text-white uppercase transition-colors hover:border-brand-600 hover:bg-brand-600"
        >
          Masuk
        </button>
      </form>
    </main>
  );
}
