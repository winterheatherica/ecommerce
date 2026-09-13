export default function Memuat() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 pt-32 pb-24">
      <div className="h-3 w-40 animate-pulse bg-stone-200" />
      <div className="mt-8 grid gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="aspect-square animate-pulse bg-stone-200" />
        <div>
          <div className="h-3 w-32 animate-pulse bg-stone-200" />
          <div className="mt-4 h-9 w-full animate-pulse bg-stone-200" />
          <div className="mt-3 h-9 w-2/3 animate-pulse bg-stone-200" />
          <div className="mt-8 h-8 w-40 animate-pulse bg-stone-200" />
          <div className="mt-10 h-12 w-full animate-pulse bg-stone-200" />
        </div>
      </div>
    </div>
  );
}
