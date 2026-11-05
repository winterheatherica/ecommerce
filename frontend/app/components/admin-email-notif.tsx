"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { kirimEmailUji } from "@/app/lib/api-client";
import type { StatusNotifikasi } from "@/app/lib/api";
import { labelJenis, waktuCatatan } from "@/app/lib/catatan-email";

export default function AdminEmailNotif({ status }: { status: StatusNotifikasi | null }) {
  const router = useRouter();
  const [memproses, setMemproses] = useState(false);
  const [pesan, setPesan] = useState<{ teks: string; gagal: boolean } | null>(null);

  const aktif = status?.active === true;
  const riwayat = status?.history ?? [];

  const uji = async () => {
    setMemproses(true);
    setPesan(null);

    try {
      const penerima = await kirimEmailUji();
      setPesan({
        teks: `Email uji terkirim ke ${penerima.join(", ")}. Cek kotak masuk, termasuk folder Spam.`,
        gagal: false,
      });
    } catch (err) {
      setPesan({ teks: err instanceof Error ? err.message : "Email uji gagal dikirim", gagal: true });
    } finally {
      setMemproses(false);
      router.refresh();
    }
  };

  return (
    <section id="notifikasi-email" className="mt-10 scroll-mt-6 border border-ink/10 bg-white">
      <div className="border-b border-ink/10 px-6 py-4">
        <h2 className="text-sm font-medium text-ink">Notifikasi email</h2>
        <p className="mt-1 max-w-xl text-sm leading-relaxed text-stone-500">
          {status === null
            ? "Status notifikasi tidak bisa dimuat."
            : aktif
              ? `Setiap pesanan yang dibayar dikabarkan ke ${status.recipients.join(", ")}, begitu juga pembayaran yang masuk tapi perlu dicek manual.`
              : "Belum aktif. Setelah Email Routing Cloudflare dan alamat penerimanya disetel, setiap pesanan yang dibayar akan dikabarkan lewat email."}
        </p>
      </div>

      {status !== null &&
        (riwayat.length > 0 ? (
          <ul className="divide-y divide-ink/5">
            {riwayat.map((c, i) => (
              <li
                key={`${c.created_at}-${c.kind}-${i}`}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 px-6 py-3"
              >
                <span className="text-sm text-ink">{labelJenis(c.kind)}</span>
                {c.order_no && (
                  <span className="font-mono text-xs text-stone-500">{c.order_no}</span>
                )}
                <span className="ml-auto font-mono text-xs text-stone-500">
                  {waktuCatatan(c.created_at)}
                </span>
                <span
                  className={`border px-2 py-0.5 font-mono text-[12px] tracking-[0.14em] uppercase ${
                    c.sent
                      ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                      : "border-red-300 bg-red-50 text-red-700"
                  }`}
                >
                  {c.sent ? "Terkirim" : "Gagal"}
                </span>
                {c.error && <p className="w-full text-xs break-words text-red-600">{c.error}</p>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-6 py-4 text-sm text-stone-500">
            {aktif
              ? "Belum ada email yang dikirim. Setiap ada pesanan dibayar, emailnya otomatis dikirim dan tercatat di sini."
              : "Belum ada email yang dikirim."}
          </p>
        ))}

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-ink/10 px-6 py-4">
        <button
          type="button"
          onClick={uji}
          disabled={!aktif || memproses}
          className="font-mono text-[13px] tracking-[0.18em] text-stone-500 uppercase transition-colors hover:text-brand-600 disabled:cursor-not-allowed disabled:text-stone-300"
        >
          {memproses ? "Mengirim..." : "Kirim email uji"}
        </button>

        {pesan && (
          <p role="status" className={`text-sm ${pesan.gagal ? "text-red-600" : "text-stone-600"}`}>
            {pesan.teks}
          </p>
        )}
      </div>
    </section>
  );
}
