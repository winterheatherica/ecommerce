import type { Pesanan } from "../db/pesanan";
import { alamatToko } from "./alamat";

export type PengirimEmail = {
  send(pesan: {
    from: { name: string; email: string };
    to: string[];
    subject: string;
    text: string;
    html: string;
  }): Promise<unknown>;
};

export type KonfigEmail = {
  pengirim: PengirimEmail;
  dari: string;
  ke: string[];
  toko: string;
};

export type IsiEmail = { subjek: string; teks: string; html: string };

export type MasalahBayar =
  | { jenis: "nominal_beda"; nomor: string; dibayar: number | null; total: number }
  | { jenis: "gagal_tandai"; nomor: string; status: string | null };

const NAMA_PENGIRIM = "Menik Store";

export function bacaKonfigEmail(env: Record<string, unknown>): KonfigEmail | undefined {
  const pengirim = env.EMAIL as PengirimEmail | undefined;
  const dari = typeof env.EMAIL_PENGIRIM === "string" ? env.EMAIL_PENGIRIM.trim() : "";
  const ke =
    typeof env.EMAIL_NOTIFIKASI === "string"
      ? env.EMAIL_NOTIFIKASI.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

  if (!pengirim || typeof pengirim.send !== "function" || !dari || ke.length === 0) {
    return undefined;
  }

  return { pengirim, dari, ke, toko: alamatToko(env) };
}

export function samarkanEmail(email: string): string {
  const [nama, domain] = email.split("@");
  if (!nama || !domain) return "•••";

  return `${nama.slice(0, 2)}${"•".repeat(Math.max(3, nama.length - 2))}@${domain}`;
}

const rupiah = (n: number) => `Rp${new Intl.NumberFormat("id-ID").format(n)}`;

function waktuWib(iso: string | null): string {
  if (!iso) return "-";

  const teks = new Date(iso).toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${teks} WIB`;
}

function aman(teks: string): string {
  return teks.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string,
  );
}

type Bagian = { judul?: string; baris: string[] };

function susun(subjek: string, bagian: Bagian[], tautan: { label: string; url: string }): IsiEmail {
  const teks = [
    ...bagian.map((b) => [...(b.judul ? [`${b.judul}:`] : []), ...b.baris].join("\n")),
    `${tautan.label}: ${tautan.url}`,
  ].join("\n\n");

  const isi = bagian
    .map((b) => {
      const judul = b.judul ? `<strong>${aman(b.judul)}</strong><br>` : "";
      return `<p style="margin:0 0 16px">${judul}${b.baris.map(aman).join("<br>")}</p>`;
    })
    .join("");

  const html =
    `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#1c1917">` +
    `${isi}<p style="margin:0"><a href="${aman(tautan.url)}" style="color:#1d4ed8">${aman(tautan.label)}</a></p>` +
    `</div>`;

  return { subjek, teks, html };
}

export function emailPesananDibayar(p: Pesanan, toko: string): IsiEmail {
  const wilayah = [p.dest_label, p.dest_postal_code].filter(Boolean).join(" ");

  return susun(
    `Pesanan dibayar: ${p.order_no} (${rupiah(p.total)})`,
    [
      { baris: [`Pesanan ${p.order_no} sudah dibayar dan siap dikirim.`] },
      {
        baris: [
          `Total: ${rupiah(p.total)}${p.payment_method ? ` lewat ${p.payment_method}` : ""}`,
          `Dibayar: ${waktuWib(p.paid_at)}`,
        ],
      },
      {
        judul: "Barang",
        baris: p.items.map((i) => `${i.qty}× ${i.name_snapshot} (${rupiah(i.price_snapshot * i.qty)})`),
      },
      {
        judul: "Kirim ke",
        baris: [
          p.customer_name,
          p.phone,
          p.address,
          wilayah,
          `Kurir: ${p.courier} ${p.service}, ${p.weight_g} g`,
        ].filter(Boolean),
      },
      ...(p.notes ? [{ judul: "Catatan pembeli", baris: [p.notes] }] : []),
    ],
    { label: "Buka panel admin", url: `${toko}/admin/pesanan` },
  );
}

const KEADAAN: Record<string, string> = {
  EXPIRED: "sudah kedaluwarsa",
  CANCELLED: "sudah dibatalkan",
  SHIPPED: "sudah dikirim",
  DELIVERED: "sudah selesai",
};

export function emailPerluDicek(m: MasalahBayar, toko: string): IsiEmail {
  const penjelasan =
    m.jenis === "nominal_beda"
      ? `DOKU melaporkan pembayaran berhasil untuk pesanan ${m.nomor} sebesar ${
          m.dibayar === null ? "nominal yang tidak terbaca" : rupiah(m.dibayar)
        }, padahal total pesanannya ${rupiah(m.total)}. Status pesanan tidak diubah.`
      : `DOKU melaporkan pembayaran berhasil untuk pesanan ${m.nomor}, tapi pesanannya ${
          (m.status && KEADAAN[m.status]) ?? "tidak ditemukan"
        }, jadi tidak bisa ditandai lunas otomatis.`;

  return susun(
    `Perlu dicek: pembayaran ${m.nomor} tidak tercatat otomatis`,
    [
      { baris: [penjelasan] },
      {
        baris: [
          "Uangnya sudah masuk ke DOKU. Cek transaksinya di dashboard DOKU, lalu hubungi pembelinya untuk memutuskan pesanan diproses atau dananya dikembalikan.",
        ],
      },
    ],
    { label: "Buka panel admin", url: `${toko}/admin/pesanan` },
  );
}

export function emailUji(toko: string): IsiEmail {
  return susun(
    "Uji notifikasi Menik Store",
    [
      {
        baris: [
          "Kalau email ini sampai, notifikasi sudah aktif. Mulai sekarang setiap pesanan yang dibayar akan dikabarkan ke alamat ini.",
        ],
      },
    ],
    { label: "Buka panel admin", url: `${toko}/admin` },
  );
}

export async function kirimEmail(
  k: KonfigEmail,
  isi: IsiEmail,
): Promise<{ ok: true } | { ok: false; pesan: string }> {
  try {
    await k.pengirim.send({
      from: { name: NAMA_PENGIRIM, email: k.dari },
      to: k.ke,
      subject: isi.subjek,
      text: isi.teks,
      html: isi.html,
    });
    return { ok: true };
  } catch (e) {
    const pesan = e instanceof Error ? e.message : String(e);
    console.error("[email] gagal mengirim", isi.subjek, pesan);
    return { ok: false, pesan };
  }
}
