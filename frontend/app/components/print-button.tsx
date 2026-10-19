"use client";

export default function PrintButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="border border-brand-500 bg-brand-500 px-6 py-2.5 font-mono text-[13px] tracking-[0.2em] indent-[0.2em] text-white uppercase transition-colors hover:border-brand-600 hover:bg-brand-600"
    >
      {label}
    </button>
  );
}
