import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import GoogleButton from "@/app/components/google-button";
import { ambilAkun, urlMasukGoogle } from "@/app/lib/akun";

export const metadata: Metadata = {
  title: "Masuk",
  robots: { index: false, follow: false },
};

const PESAN_GALAT: Record<string, string> = {
  "belum-aktif":
    "Masuk dengan Google belum aktif. Untuk sementara, kamu tetap bisa belanja tanpa akun.",
  dibatalkan: "Masuk dibatalkan. Coba lagi kapan saja.",
  kedaluwarsa:
    "Sesi masuk sudah kedaluwarsa atau dibuka di tab lain. Coba sekali lagi dari halaman ini.",
  gagal: "Masuk dengan Google gagal. Coba lagi sebentar lagi.",
};

function tujuanAman(next: string | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) {
    return "/akun";
  }
  return next;
}

type Props = {
  searchParams: Promise<{ next?: string; galat?: string }>;
};

export default async function MasukPage({ searchParams }: Props) {
  const { next, galat } = await searchParams;
  const tujuan = tujuanAman(next);

  if (await ambilAkun()) redirect(tujuan);

  const pesanGalat = galat ? PESAN_GALAT[galat] : undefined;

  return (
    <div className="mx-auto w-full max-w-xl px-6 pt-32 pb-24">
      <p className="text-[15px] text-oranye-600 font-semibold">
        Akun
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
        Masuk ke Menik Store
      </h1>
      <p className="mt-4 leading-relaxed text-stone-600">
        Dengan akun, semua pesananmu tersimpan di satu tempat, termasuk pesanan
        lama yang dulu dibuat dengan email yang sama. Data pengiriman juga
        terisi otomatis di pesanan berikutnya.
      </p>

      {pesanGalat && (
        <p
          role="alert"
          className="mt-8 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-800"
        >
          {pesanGalat}
        </p>
      )}

      <div className="mt-10">
        <GoogleButton href={urlMasukGoogle(tujuan)} label="Masuk dengan Google" />
      </div>

      <p className="mt-6 text-xs leading-relaxed text-stone-500">
        Dari Google kami hanya menerima nama dan alamat email. Tidak ada kata
        sandi yang kami simpan.
      </p>

      <div className="mt-12 border-t border-ink/10 pt-8">
        <p className="text-sm text-stone-600">
          Tidak mau membuat akun? Belanja tetap bisa tanpa masuk.
        </p>
        <Link
          href={tujuan === "/checkout" ? "/checkout" : "/produk"}
          className="tautan mt-4 inline-block"
        >
          {tujuan === "/checkout" ? "Lanjut sebagai tamu" : "Lihat produk"} &rarr;
        </Link>
      </div>
    </div>
  );
}
