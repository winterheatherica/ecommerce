import type { Kategori } from "../data/produk";

const bentuk: Partial<Record<Kategori, React.ReactNode>> = {
  kucing: (
    <>
      <path d="M14 18 L12 8 L20 13" />
      <path d="M30 18 L32 8 L24 13" />
      <path d="M14 18c0-4 4-7 10-7s10 3 10 7c0 5-4 8-10 8s-10-3-10-8z" />
      <circle cx="20" cy="18" r="1" />
      <circle cx="28" cy="18" r="1" />
      <path d="M24 21v2M21 24c1 1 5 1 6 0" />
      <path d="M17 26c-1 5-1 10 1 13h12c2-3 2-8 1-13" />
      <path d="M30 39c5 0 8-4 7-9" />
    </>
  ),
  tikus: (
    <>
      <circle cx="16" cy="16" r="4" />
      <circle cx="30" cy="16" r="4" />
      <path d="M10 30c0-7 6-11 13-11s13 4 13 11c0 4-3 6-7 6H17c-4 0-7-2-7-6z" />
      <circle cx="17" cy="27" r="1" />
      <path d="M11 30c-2 0-3 1-3 2" />
      <path d="M36 32c4 1 6 4 5 8" />
      <path d="M19 36v3M28 36v3" />
    </>
  ),
  kecoa: (
    <>
      <path d="M21 8c-2 2-3 5-3 7M27 8c2 2 3 5 3 7" />
      <ellipse cx="24" cy="19" rx="5" ry="4" />
      <ellipse cx="24" cy="30" rx="8" ry="11" />
      <path d="M24 21v18" />
      <path d="M16 24 L9 20M16 30 L8 30M17 36 L11 40" />
      <path d="M32 24 L39 20M32 30 L40 30M31 36 L37 40" />
    </>
  ),
  nyamuk: (
    <>
      <circle cx="17" cy="16" r="4" />
      <path d="M14 13 L9 8M20 13 L22 7" />
      <path d="M14 19 L8 24" />
      <path d="M21 18c4 2 9 6 13 12" />
      <path d="M22 17c5-3 12-3 16 1-4 3-11 3-15 1z" />
      <path d="M23 21c3 2 9 5 14 5-3 4-10 3-14 0z" />
      <path d="M27 24l-3 5M31 28l-2 5" />
    </>
  ),
  cicak: (
    <>
      <ellipse cx="24" cy="11" rx="4" ry="3.5" />
      <circle cx="22" cy="10" r="0.8" />
      <ellipse cx="24" cy="23" rx="5" ry="9" />
      <path d="M19 17 L12 13 L9 16M29 17 L36 13 L39 16" />
      <path d="M19 29 L12 33 L10 30M29 29 L36 33 L38 30" />
      <path d="M24 32c0 5 5 6 7 3s-1-6-3-4" />
    </>
  ),
  semut: (
    <>
      <circle cx="24" cy="11" r="3.5" />
      <path d="M22 8 L19 4M26 8 L29 4" />
      <ellipse cx="24" cy="20" rx="3.5" ry="4" />
      <ellipse cx="24" cy="32" rx="5.5" ry="6.5" />
      <path d="M21 17 L13 13M21 21 L12 21M21 25 L14 29" />
      <path d="M27 17 L35 13M27 21 L36 21M27 25 L34 29" />
    </>
  ),
  lalat: (
    <>
      <circle cx="24" cy="14" r="4.5" />
      <circle cx="21.5" cy="13" r="1" />
      <circle cx="26.5" cy="13" r="1" />
      <ellipse cx="24" cy="27" rx="5" ry="8" />
      <path d="M20 19c-7-4-13-2-14 2 4 4 11 3 14 0z" />
      <path d="M28 19c7-4 13-2 14 2-4 4-11 3-14 0z" />
      <path d="M20 31 L14 36M28 31 L34 36M22 34v4M26 34v4" />
    </>
  ),
  ular: (
    <>
      <path d="M13 41c0-7 10-6 10-12s-10-5-10-11c0-5 5-8 10-8" />
      <ellipse cx="27" cy="10" rx="5" ry="4" />
      <circle cx="28" cy="9" r="0.9" />
      <path d="M32 10 L38 10M38 10l-3-2M38 10l-3 2" />
      <path d="M17 20c2 1 4 1 6 0M16 32c2 1 4 1 6 0" />
    </>
  ),
  musang: (
    <>
      <path d="M6 7h36" />
      <path d="M14 21 L12 15 L18 18M26 21 L28 15 L22 18" />
      <path d="M13 22c0-3 3-5 7-5s7 2 7 5c0 4-3 6-7 6s-7-2-7-6z" />
      <circle cx="17" cy="22" r="0.9" />
      <circle cx="23" cy="22" r="0.9" />
      <path d="M20 25v1.5" />
      <path d="M15 28c-1 5 0 9 2 11h8c2-2 3-6 2-11" />
      <path d="M27 33c5-1 9-5 9-11" />
      <path d="M31 31c1 1 2 1 3 0M34 27c1 1 2 1 3 0" />
    </>
  ),
  "laba-laba": (
    <>
      <circle cx="24" cy="18" r="4" />
      <ellipse cx="24" cy="29" rx="6" ry="7" />
      <path d="M20 16 L11 10 L7 13M19 21 L9 19 L6 23" />
      <path d="M20 27 L10 29 L7 34M21 33 L13 38 L12 42" />
      <path d="M28 16 L37 10 L41 13M29 21 L39 19 L42 23" />
      <path d="M28 27 L38 29 L41 34M27 33 L35 38 L36 42" />
    </>
  ),
  rayap: (
    <>
      <path d="M6 40h36M10 44h28" />
      <path d="M12 40c2-3 6-4 12-4s10 1 12 4" />
      <circle cx="24" cy="10" r="3.5" />
      <path d="M22 7 L19 3M26 7 L29 3" />
      <ellipse cx="24" cy="18" rx="3" ry="4" />
      <ellipse cx="24" cy="28" rx="4.5" ry="6" />
      <path d="M21 16 L14 13M21 20 L13 21M21 25 L15 28" />
      <path d="M27 16 L34 13M27 20 L35 21M27 25 L33 28" />
    </>
  ),
  siput: (
    <>
      <path d="M6 38h34" />
      <path d="M8 38c0-3 2-5 6-5h4" />
      <path d="M14 33c-1-4 1-7 4-8" />
      <path d="M12 30 L8 24M16 29 L14 22" />
      <circle cx="7.5" cy="23" r="1" />
      <circle cx="13.5" cy="21" r="1" />
      <path d="M30 38c6 0 10-4 10-9s-4-8-8-8-7 3-7 6 2 5 4 5 4-1 4-3-1-3-3-3" />
    </>
  ),
  "kutu-kasur": (
    <>
      <path d="M5 38h38M5 42h38" />
      <path d="M9 38c0-2 1-3 3-3M39 38c0-2-1-3-3-3" />
      <ellipse cx="24" cy="20" rx="8" ry="10" />
      <path d="M17 16h14M16 21h16M17 26h14" />
      <circle cx="24" cy="10" r="3" />
      <path d="M22 8 L19 5M26 8 L29 5" />
      <path d="M16 15 L10 12M15 21 L8 21M16 27 L10 30" />
      <path d="M32 15 L38 12M33 21 L40 21M32 27 L38 30" />
    </>
  ),
};

export default function IkonHama({ kategori }: { kategori: Kategori }) {
  const isi = bentuk[kategori];
  if (!isi) return null;

  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="h-16 w-16"
    >
      {isi}
    </svg>
  );
}
