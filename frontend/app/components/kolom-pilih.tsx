"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";

export type OpsiPilih = { nilai: string; label: string };

const LANGKAH: Record<string, (aktif: number, akhir: number) => number> = {
  ArrowDown: (a) => a + 1,
  ArrowUp: (a) => a - 1,
  PageDown: (a) => a + 10,
  PageUp: (a) => a - 10,
  Home: () => 0,
  End: (_, akhir) => akhir,
};

export default function KolomPilih({
  nilai,
  opsi,
  ubah,
  id,
  labelId,
  ariaLabel,
  disabled = false,
  bulat = true,
  className = "",
}: {
  nilai: string;
  opsi: readonly OpsiPilih[];
  ubah: (nilai: string) => void;
  id?: string;
  labelId?: string;
  ariaLabel?: string;
  disabled?: boolean;
  bulat?: boolean;
  className?: string;
}) {
  const dasar = useId();
  const idDaftar = `${dasar}daftar`;
  const tombol = useRef<HTMLButtonElement>(null);
  const daftar = useRef<HTMLUListElement>(null);
  const ketikan = useRef({ teks: "", waktu: 0 });
  const [buka, setBuka] = useState(false);
  const [aktif, setAktif] = useState(0);

  const terbuka = buka && !disabled && opsi.length > 0;
  const cocok = opsi.findIndex((o) => o.nilai === nilai);
  const terpilih = cocok < 0 ? 0 : cocok;

  useLayoutEffect(() => {
    if (!terbuka) return;

    const atur = () => {
      const t = tombol.current;
      const d = daftar.current;
      if (!t || !d) return;
      const r = t.getBoundingClientRect();
      const tepi = 8;
      const jarak = 6;
      const ruangBawah = window.innerHeight - r.bottom - jarak - tepi;
      const ruangAtas = r.top - jarak - tepi;
      const keAtas = Math.min(d.scrollHeight, 320) > ruangBawah && ruangAtas > ruangBawah;
      d.style.maxHeight = `${Math.max(120, Math.min(320, keAtas ? ruangAtas : ruangBawah))}px`;
      d.style.minWidth = `${r.width}px`;
      d.style.maxWidth = `${window.innerWidth - tepi * 2}px`;
      d.style.left = `${Math.max(tepi, Math.min(r.left, window.innerWidth - d.offsetWidth - tepi))}px`;
      d.style.top = `${keAtas ? r.top - jarak - d.offsetHeight : r.bottom + jarak}px`;
    };

    const tutupLuar = (e: PointerEvent) => {
      const sasaran = e.target as Node;
      if (tombol.current?.contains(sasaran) || daftar.current?.contains(sasaran)) return;
      setBuka(false);
    };

    atur();
    window.addEventListener("resize", atur);
    window.addEventListener("scroll", atur, true);
    document.addEventListener("pointerdown", tutupLuar, true);
    return () => {
      window.removeEventListener("resize", atur);
      window.removeEventListener("scroll", atur, true);
      document.removeEventListener("pointerdown", tutupLuar, true);
    };
  }, [terbuka]);

  useEffect(() => {
    if (terbuka) document.getElementById(`${dasar}opsi${aktif}`)?.scrollIntoView({ block: "nearest" });
  }, [terbuka, aktif, dasar]);

  function bukaDi(i: number) {
    setAktif(i);
    setBuka(true);
  }

  function pilih(i: number) {
    setBuka(false);
    const o = opsi[i];
    if (o && o.nilai !== nilai) ubah(o.nilai);
  }

  function cari(huruf: string, dari: number) {
    const k = ketikan.current;
    const sekarang = Date.now();
    k.teks = (sekarang - k.waktu < 600 ? k.teks : "") + huruf.toLowerCase();
    k.waktu = sekarang;
    const ulang = [...k.teks].every((c) => c === k.teks[0]);
    const kunci = ulang ? k.teks[0] : k.teks;
    for (let n = 0; n < opsi.length; n++) {
      const i = (dari + (ulang ? 1 : 0) + n) % opsi.length;
      if (opsi[i].label.toLowerCase().startsWith(kunci)) return i;
    }
    return -1;
  }

  function tekan(e: KeyboardEvent<HTMLButtonElement>) {
    const k = e.key;
    const huruf = k.length === 1 && k !== " " && !e.ctrlKey && !e.metaKey && !e.altKey;

    if (!terbuka) {
      if (disabled || opsi.length === 0) return;
      if (k === "ArrowDown" || k === "ArrowUp" || k === "Enter" || k === " " || k === "Home" || k === "End") {
        e.preventDefault();
        bukaDi(k === "Home" ? 0 : k === "End" ? opsi.length - 1 : terpilih);
      } else if (huruf) {
        const i = cari(k, terpilih);
        if (i >= 0) bukaDi(i);
      }
      return;
    }

    if (k === "ArrowUp" && e.altKey) {
      e.preventDefault();
      pilih(aktif);
    } else if (LANGKAH[k]) {
      e.preventDefault();
      setAktif(Math.min(opsi.length - 1, Math.max(0, LANGKAH[k](aktif, opsi.length - 1))));
    } else if (k === "Enter" || k === " ") {
      e.preventDefault();
      pilih(aktif);
    } else if (k === "Escape") {
      e.preventDefault();
      setBuka(false);
    } else if (k === "Tab") {
      setBuka(false);
    } else if (huruf) {
      const i = cari(k, aktif);
      if (i >= 0) setAktif(i);
    }
  }

  return (
    <>
      <button
        ref={tombol}
        type="button"
        id={id}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={terbuka}
        aria-controls={terbuka ? idDaftar : undefined}
        aria-activedescendant={terbuka ? `${dasar}opsi${aktif}` : undefined}
        aria-labelledby={labelId}
        aria-label={labelId ? undefined : ariaLabel}
        disabled={disabled}
        onClick={() => (terbuka ? setBuka(false) : bukaDi(terpilih))}
        onKeyDown={tekan}
        onKeyUp={(e) => {
          if (e.key === " ") e.preventDefault();
        }}
        onBlur={() => setBuka(false)}
        className={`flex items-center justify-between gap-1.5 text-left disabled:cursor-not-allowed ${className}`}
      >
        <span className="grid min-w-0">
          {opsi.map((o, i) => (
            <span key={i} className={`col-start-1 row-start-1 truncate ${i === terpilih ? "" : "invisible"}`}>
              {o.label}
            </span>
          ))}
        </span>
        <svg
          className={`h-3.5 w-3.5 shrink-0 text-stone-400 transition-transform ${terbuka ? "rotate-180" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {terbuka &&
        createPortal(
          <ul
            ref={daftar}
            id={idDaftar}
            role="listbox"
            aria-labelledby={labelId}
            aria-label={labelId ? undefined : ariaLabel}
            onMouseDown={(e) => e.preventDefault()}
            className={`fixed z-[60] overflow-y-auto overscroll-contain border bg-white ${
              bulat
                ? "rounded-2xl border-ink/10 p-1.5 shadow-[0_16px_40px_rgba(1,34,65,0.18)]"
                : "border-ink/15 py-1 shadow-[0_12px_28px_rgba(1,34,65,0.14)]"
            }`}
          >
            {opsi.map((o, i) => (
              <li
                key={i}
                id={`${dasar}opsi${i}`}
                role="option"
                aria-selected={i === terpilih}
                onMouseMove={() => setAktif(i)}
                onClick={() => pilih(i)}
                className={`flex min-h-11 cursor-pointer items-center justify-between gap-4 px-4 py-2 text-[15px] ${
                  bulat ? "rounded-xl" : ""
                } ${i === aktif ? "bg-brand-50" : ""} ${i === terpilih ? "font-bold text-brand-700" : "font-medium text-ink"}`}
              >
                {o.label}
                {i === terpilih && (
                  <svg
                    className="h-4 w-4 shrink-0 text-brand-500"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m5 12.5 4.5 4.5L19 7.5" />
                  </svg>
                )}
              </li>
            ))}
          </ul>,
          document.body,
        )}
    </>
  );
}
