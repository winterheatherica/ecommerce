"use client";

import { useState } from "react";

export default function KolomPassword({
  id,
  name,
  autoComplete = "current-password",
  maxLength,
}: {
  id: string;
  name: string;
  autoComplete?: string;
  maxLength?: number;
}) {
  const [terlihat, setTerlihat] = useState(false);

  return (
    <div className="relative mt-2">
      <input
        id={id}
        name={name}
        type={terlihat ? "text" : "password"}
        autoComplete={autoComplete}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        required
        maxLength={maxLength}
        className="min-h-11 w-full rounded-xl border-2 border-ink/15 bg-white py-2.5 pr-14 pl-4 text-[16px] text-ink outline-none transition-colors focus:border-brand-500"
      />
      <button
        type="button"
        onClick={() => setTerlihat((v) => !v)}
        aria-label={terlihat ? "Sembunyikan password" : "Tampilkan password"}
        aria-pressed={terlihat}
        aria-controls={id}
        title={terlihat ? "Sembunyikan password" : "Tampilkan password"}
        className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-stone-500 transition-colors hover:text-brand-600"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
          {terlihat ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.98 8.22A10.48 10.48 0 0 0 1.93 12C3.23 16.34 7.24 19.5 12 19.5c.99 0 1.95-.14 2.86-.39M6.23 6.23A10.45 10.45 0 0 1 12 4.5c4.76 0 8.77 3.16 10.07 7.5a10.52 10.52 0 0 1-4.29 5.77M6.23 6.23 3 3m3.23 3.23 3.65 3.65m7.89 7.89L21 21m-3.23-3.23-3.65-3.65m0 0a3 3 0 1 0-4.24-4.24m4.24 4.24L9.88 9.88"
            />
          ) : (
            <>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.04 12.32a1 1 0 0 1 0-.64C3.42 7.51 7.36 4.5 12 4.5c4.64 0 8.57 3.01 9.96 7.18.07.21.07.43 0 .64C20.58 16.49 16.64 19.5 12 19.5c-4.64 0-8.57-3.01-9.96-7.18Z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </>
          )}
        </svg>
      </button>
    </div>
  );
}
