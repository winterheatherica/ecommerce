import type { Metadata } from "next";

import JsonLd from "@/app/components/json-ld";
import { KELOMPOK_FAQ } from "@/app/data/faq";
import { metaHalaman, skemaFaq } from "@/app/lib/seo";

export const metadata: Metadata = metaHalaman({
  judul: "Pertanyaan Umum",
  ringkasan:
    "Jawaban seputar produk pengusir hama alami, cara pakai, pemesanan, ongkos kirim, dan pengembalian barang di Menik Store.",
  path: "/faq",
});

export default function FaqPage() {
  return (
    <section className="mx-auto w-full max-w-3xl px-6 pt-32 pb-24">
      <JsonLd data={skemaFaq(KELOMPOK_FAQ.flatMap((k) => k.isi))} />

      <p className="font-mono text-[13px] tracking-[0.28em] text-accent-600 uppercase">
        Bantuan
      </p>
      <h1 className="mt-3 text-3xl leading-tight font-semibold tracking-tight text-ink sm:text-4xl">
        Pertanyaan umum
      </h1>
      <p className="mt-4 max-w-xl leading-relaxed text-stone-600">
        Kalau jawabannya belum ada di sini, chat kami di WhatsApp. Dibalas
        rata-rata dalam satu jam pada hari kerja.
      </p>

      {KELOMPOK_FAQ.map((k) => (
        <div key={k.judul} id={k.id} className="mt-16 scroll-mt-28">
          <h2 className="font-mono text-[13px] tracking-[0.28em] text-brand-600 uppercase">
            {k.judul}
          </h2>

          <div className="mt-6 border-t border-ink/10">
            {k.isi.map((item) => (
              <details key={item.tanya} className="group border-b border-ink/10">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-ink transition-colors hover:text-brand-600 [&::-webkit-details-marker]:hidden">
                  <span className="text-base leading-snug">{item.tanya}</span>
                  <svg
                    className="h-4 w-4 shrink-0 text-stone-400 transition-transform duration-300 group-open:rotate-45"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.6}
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" d="M12 5v14M5 12h14" />
                  </svg>
                </summary>
                <p className="pb-6 text-sm leading-relaxed text-stone-600">
                  {item.jawab}
                </p>
              </details>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
