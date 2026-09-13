export default function Memuat() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 pt-32 pb-24">
      <div className="h-3 w-24 animate-pulse bg-stone-200" />
      <div className="mt-5 h-9 w-72 animate-pulse bg-stone-200" />
      <div className="mt-12 grid grid-cols-2 gap-6 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i}>
            <div className="aspect-square animate-pulse bg-stone-200" />
            <div className="mt-4 h-3 w-full animate-pulse bg-stone-200" />
            <div className="mt-2 h-3 w-2/3 animate-pulse bg-stone-200" />
            <div className="mt-4 h-5 w-24 animate-pulse bg-stone-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
