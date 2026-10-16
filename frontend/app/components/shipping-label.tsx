import { PENGIRIM_LABEL } from "@/app/data/kontak";
import type { Pesanan } from "@/app/lib/api";

const NAMA_KURIR: Record<string, string> = {
  JNE: "JNE",
  JNT: "J&T Express",
  SICEPAT: "SiCepat",
};

const MAKS_BARIS = 8;

function hpRapi(hp: string): string {
  const angka = hp.replace(/\D/g, "");
  if (angka.length < 10) return hp;

  const sisa = angka.slice(4);
  const tengah = Math.ceil(sisa.length / 2);
  return `${angka.slice(0, 4)}-${sisa.slice(0, tengah)}-${sisa.slice(tengah)}`;
}

function utuhkanUkuran(nama: string): string {
  return nama.replace(/\(([^()]*)\)$/, (_, isi: string) => `(${isi.replace(/ /g, " ")})`);
}

function beratRapi(gram: number): string {
  if (gram < 1000) return `${gram} g`;
  return `${(gram / 1000).toLocaleString("id-ID", { maximumFractionDigits: 2 })} kg`;
}

function tanggalRapi(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });
}

export default function ShippingLabel({ pesanan }: { pesanan: Pesanan }) {
  const kurir = NAMA_KURIR[pesanan.courier.toUpperCase()] ?? pesanan.courier;
  const totalQty = pesanan.items.reduce((s, i) => s + i.qty, 0);

  const terlalu = pesanan.items.length > MAKS_BARIS;
  const tampil = terlalu ? pesanan.items.slice(0, MAKS_BARIS - 1) : pesanan.items;
  const sisa = pesanan.items.slice(tampil.length);

  const kecil = "text-[7pt] font-bold tracking-[0.16em] uppercase";
  const garis = "border-black border-b-[0.4mm]";

  return (
    <article className="flex h-[150mm] w-[100mm] flex-col bg-white p-[5mm] font-sans text-black">
      <header className={`flex items-stretch justify-between gap-[3mm] pb-[3mm] ${garis}`}>
        <div className="flex flex-col justify-center bg-black px-[3mm] py-[2mm] text-white">
          <p className="text-[17pt] leading-none font-black tracking-tight">{kurir}</p>
          <p className="mt-[1.2mm] text-[8pt] leading-none font-bold tracking-[0.2em] uppercase">
            {pesanan.service}
          </p>
        </div>

        <div className="flex flex-col items-end justify-center text-right">
          <p className={kecil}>No. pesanan</p>
          <p className="mt-[0.6mm] font-mono text-[11pt] leading-none font-bold">
            {pesanan.order_no}
          </p>
          <p className="mt-[1.5mm] text-[8pt] leading-none">
            {tanggalRapi(pesanan.paid_at ?? pesanan.created_at)}
            {" · "}
            <span className="font-bold">{beratRapi(pesanan.weight_g)}</span>
          </p>
        </div>
      </header>

      <section className={`grid grid-cols-[3fr_2fr] gap-[4mm] py-[3mm] ${garis}`}>
        <div className="min-w-0">
          <p className={kecil}>Penerima</p>
          <p className="mt-[1mm] text-[13pt] leading-tight font-bold break-words">
            {pesanan.customer_name}
          </p>
          <p className="mt-[0.8mm] font-mono text-[10.5pt] font-bold">
            {hpRapi(pesanan.phone)}
          </p>
        </div>
        <div className="min-w-0 border-l-[0.3mm] border-black pl-[3mm]">
          <p className={kecil}>Pengirim</p>
          <p className="mt-[1mm] text-[10pt] leading-tight font-bold break-words">
            {PENGIRIM_LABEL.nama}
          </p>
          <p className="mt-[0.8mm] font-mono text-[9pt]">{PENGIRIM_LABEL.hp}</p>
        </div>
      </section>

      <section className={`py-[3mm] ${garis}`}>
        <p className={kecil}>Alamat penerima</p>
        <p className="mt-[1mm] text-[10pt] leading-snug break-words">{pesanan.address}</p>
        <p className="mt-[0.8mm] text-[10pt] leading-snug">
          {pesanan.dest_label}
          {pesanan.dest_postal_code && (
            <>
              {" "}
              <span className="text-[11.5pt] font-black">{pesanan.dest_postal_code}</span>
            </>
          )}
        </p>
      </section>

      {pesanan.notes && (
        <p className="mt-[2.5mm] border-[0.3mm] border-black px-[2mm] py-[1.5mm] text-[8.5pt] leading-snug break-words">
          <span className="font-bold">Catatan: </span>
          {pesanan.notes}
        </p>
      )}

      <section className="mt-[3mm] min-h-0 flex-1">
        <div className={`grid grid-cols-[1fr_17mm_9mm] gap-[2mm] pb-[1mm] ${kecil} border-b-[0.3mm] border-black`}>
          <span>Nama produk</span>
          <span>SKU</span>
          <span className="text-right">Qty</span>
        </div>

        <ul>
          {tampil.map((it, i) => (
            <li
              key={`${it.slug}-${i}`}
              className="grid grid-cols-[1fr_17mm_9mm] gap-[2mm] py-[1.1mm] text-[8.5pt] leading-tight"
            >
              <span className="line-clamp-2 break-words">
                {utuhkanUkuran(it.name_snapshot)}
              </span>
              <span className="font-mono break-all">{it.sku ?? "-"}</span>
              <span className="text-right font-bold">{it.qty}</span>
            </li>
          ))}
          {sisa.length > 0 && (
            <li className="grid grid-cols-[1fr_17mm_9mm] gap-[2mm] py-[1.1mm] text-[8.5pt] leading-tight italic">
              <span>+{sisa.length} produk lainnya</span>
              <span />
              <span className="text-right font-bold not-italic">
                {sisa.reduce((s, i) => s + i.qty, 0)}
              </span>
            </li>
          )}
        </ul>
      </section>

      <footer className="flex items-center justify-between border-t-[0.4mm] border-black pt-[2mm] text-[8pt]">
        <span className="font-bold">Total {totalQty} barang</span>
        <span>Terima kasih sudah belanja di Menik Store</span>
      </footer>
    </article>
  );
}
