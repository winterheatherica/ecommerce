"use client";

import { useState } from "react";

import { kirimEmailUji } from "@/app/lib/api-client";
import type { StatusNotifikasi } from "@/app/lib/api";

export default function AdminEmailNotif({ status }: { status: StatusNotifikasi | null }) {
  const [memproses, setMemproses] = useState(false);
  const [pesan, setPesan] = useState<{ teks: string; gagal: boolean } | null>(null);

  const aktif = status?.active === true;

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
    }
  };

  return (
    <div className="mt-10 border border-ink/10 bg-white p-6">
      <h2 className="text-sm font-medium text-ink">Notifikasi email</h2>
      <p className="mt-2 max-w-lg text-sm leading-relaxed text-stone-500">
        {status === null
          ? "Status notifikasi tidak bisa dimuat."
          : aktif
            ? `Setiap pesanan yang dibayar dikabarkan ke ${status.recipients.join(", ")}. Email juga dikirim kalau DOKU melaporkan uang masuk tapi pesanannya tidak bisa ditandai lunas otomatis.`
            : "Belum aktif. Setelah Email Routing Cloudflare dan alamat penerimanya disetel, setiap pesanan yang dibayar akan dikabarkan lewat email."}
      </p>

      <button
        type="button"
        onClick={uji}
        disabled={!aktif || memproses}
        className="mt-5 border border-ink/15 px-6 py-2.5 font-mono text-[13px] tracking-[0.18em] indent-[0.18em] text-stone-600 uppercase transition-colors hover:border-brand-500 hover:text-brand-600 disabled:cursor-not-allowed disabled:text-stone-300"
      >
        {memproses ? "Mengirim..." : "Kirim email uji"}
      </button>

      {pesan && (
        <p
          role="status"
          className={`mt-4 text-sm ${pesan.gagal ? "text-red-600" : "text-stone-600"}`}
        >
          {pesan.teks}
        </p>
      )}
    </div>
  );
}
