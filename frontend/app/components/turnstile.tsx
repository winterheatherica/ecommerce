"use client";

import { useEffect, useRef, useState } from "react";

import { WA_URL } from "@/app/data/kontak";

type OpsiWidget = {
  sitekey: string;
  language: string;
  theme: "light" | "dark" | "auto";
  size: "normal" | "compact";
  callback: (token: string) => void;
  "expired-callback": () => void;
  "timeout-callback": () => void;
  "error-callback": () => boolean;
};

type ApiTurnstile = {
  render: (wadah: HTMLElement, opsi: OpsiWidget) => string | undefined;
  reset: (id: string) => void;
  remove: (id: string) => void;
};

declare global {
  interface Window {
    turnstile?: ApiTurnstile;
  }
}

const SKRIP = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const LEBAR_NORMAL = 300;

let pemuat: Promise<ApiTurnstile> | null = null;

function muatTurnstile(): Promise<ApiTurnstile> {
  if (window.turnstile) return Promise.resolve(window.turnstile);

  pemuat ??= new Promise<ApiTurnstile>((berhasil, gagal) => {
    const skrip = document.createElement("script");
    skrip.src = SKRIP;
    skrip.async = true;
    skrip.onload = () => {
      if (window.turnstile) berhasil(window.turnstile);
      else gagal(new Error("turnstile tidak tersedia"));
    };
    skrip.onerror = () => {
      skrip.remove();
      gagal(new Error("turnstile gagal dimuat"));
    };
    document.head.appendChild(skrip);
  }).catch((e: unknown) => {
    pemuat = null;
    throw e;
  });

  return pemuat;
}

type Props = {
  siteKey: string;
  ulang: number;
  onToken: (token: string | null) => void;
  className?: string;
};

export default function Turnstile({ siteKey, ulang, onToken, className }: Props) {
  const wadah = useRef<HTMLDivElement>(null);
  const idWidget = useRef<string | null>(null);
  const kirimToken = useRef(onToken);
  const [gagal, setGagal] = useState(false);

  useEffect(() => {
    kirimToken.current = onToken;
  }, [onToken]);

  useEffect(() => {
    let batal = false;

    muatTurnstile()
      .then((api) => {
        const el = wadah.current;
        if (batal || !el) return;

        idWidget.current =
          api.render(el, {
            sitekey: siteKey,
            language: "id",
            theme: "light",
            size: el.offsetWidth >= LEBAR_NORMAL ? "normal" : "compact",
            callback: (token) => {
              setGagal(false);
              kirimToken.current(token);
            },
            "expired-callback": () => kirimToken.current(null),
            "timeout-callback": () => kirimToken.current(null),
            "error-callback": () => {
              setGagal(true);
              kirimToken.current(null);
              return true;
            },
          }) ?? null;
      })
      .catch(() => {
        if (!batal) setGagal(true);
      });

    return () => {
      batal = true;
      if (idWidget.current) window.turnstile?.remove(idWidget.current);
      idWidget.current = null;
    };
  }, [siteKey]);

  useEffect(() => {
    if (ulang > 0 && idWidget.current) window.turnstile?.reset(idWidget.current);
  }, [ulang]);

  return (
    <div className={className}>
      <div ref={wadah} className="min-h-[65px]" />
      {gagal && (
        <p role="alert" className="mt-3 max-w-md text-sm leading-relaxed text-red-700">
          Verifikasi keamanan gagal dimuat. Muat ulang halaman, atau{" "}
          <a
            href={WA_URL}
            className="border-b border-red-300 font-medium transition-colors hover:border-red-700"
          >
            pesan lewat WhatsApp
          </a>
          .
        </p>
      )}
    </div>
  );
}
