const PENANDA = "/image/upload/";

export default function pemuatGambar({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  const i = src.indexOf(PENANDA);
  if (i === -1) return src;

  const ubah = `f_auto,q_${quality ?? "auto"},c_limit,w_${width}`;
  const potong = i + PENANDA.length;

  return `${src.slice(0, potong)}${ubah}/${src.slice(potong)}`;
}
