import type { Metadata } from "next";
import Image from "next/image";
import Script from "next/script";

import KolomPassword from "@/app/components/kolom-password";

import { alamatApi } from "@/app/lib/akun";
import { ambilKunciCaptcha } from "@/app/lib/captcha";

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

const label = "block text-[15px] font-bold text-ink";
const kotak =
  "mt-2 min-h-11 w-full rounded-xl border-2 border-ink/15 bg-white px-4 py-2.5 text-[16px] text-ink outline-none transition-colors focus:border-brand-500";

export default async function MasukAdminPage({ searchParams }: Props) {
  const { galat, next } = await searchParams;
  const kunci = await ambilKunciCaptcha();
  const pesan = galat ? (PESAN[galat] ?? "Gagal masuk. Coba lagi.") : null;

  return (
    <main className="flex min-h-svh items-center justify-center bg-stone-50 px-6 py-16">
      <form
        method="post"
        action={`${alamatApi()}/api/auth/admin/login`}
        className="w-full max-w-sm rounded-3xl border border-ink/10 bg-white p-8 shadow-sm"
      >
        <p className="flex items-center gap-3 text-[17px] font-extrabold tracking-tight text-ink">
          <Image src="/logo-96.webp" alt="" width={40} height={40} className="h-10 w-10" priority />
          Menik Store
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-ink">Masuk admin</h1>

        {pesan && (
          <p role="alert" className="mt-6 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
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
          <KolomPassword id="password" name="password" maxLength={200} />
        </div>

        {kunci && (
          <>
            <div className="cf-turnstile mt-6" data-sitekey={kunci} data-language="id" data-theme="light" />
            <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" />
          </>
        )}

        <button
          type="submit"
          className="mt-8 w-full tombol"
        >
          Masuk
        </button>
      </form>
    </main>
  );
}
