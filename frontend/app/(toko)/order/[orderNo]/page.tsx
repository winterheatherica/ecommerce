import type { Metadata } from "next";
import { WA_URL } from "@/app/data/kontak";
import Link from "next/link";
import { notFound } from "next/navigation";

import CopyButton from "@/app/components/copy-button";
import GoogleButton from "@/app/components/google-button";
import PaymentCheck from "@/app/components/payment-check";
import ReorderButton from "@/app/components/reorder-button";
import RiwayatKurir from "@/app/components/riwayat-kurir";
import UlasanPesanan from "@/app/components/ulasan-pesanan";
import { ambilAkun, urlMasukGoogle } from "@/app/lib/akun";
import { ambilKunciCaptcha } from "@/app/lib/captcha";
import { ambilPesanan, ambilSemuaProduk, type Pesanan } from "@/app/lib/api";
import { namaKurir, namaLayanan } from "@/app/lib/kurir";
import {
  barisRiwayat,
  batasKomplain,
  posisiTerakhir,
  sejak,
  waktuKurir,
} from "@/app/lib/lacak";
import { rupiah } from "@/app/data/produk";
import { statusLabel, type StatusPesanan } from "@/app/data/status-pesanan";

type Props = {
  params: Promise<{ orderNo: string }>;
};

const ALUR: StatusPesanan[] = ["PENDING", "PAID", "SHIPPED", "DELIVERED"];

const LANGKAH: {
  status: StatusPesanan;
  judul: string;
  catatan: string;
  catatanAktif?: string;
}[] = [
  {
    status: "PENDING",
    judul: "Pesanan dibuat",
    catatan: "Nomor pesanan diterbitkan",
    catatanAktif: "Menunggu pembayaran",
  },
  {
    status: "PAID",
    judul: "Pembayaran diterima",
    catatan: "Dana sudah masuk",
    catatanAktif: "Pesanan sedang disiapkan",
  },
  {
    status: "SHIPPED",
    judul: "Dikirim",
    catatan: "Paket diserahkan ke kurir",
    catatanAktif: "Paket dalam perjalanan",
  },
  { status: "DELIVERED", judul: "Selesai", catatan: "Paket diterima" },
];

export const metadata: Metadata = {
  title: "Status Pesanan",
  robots: { index: false, follow: false },
};

const tanggal = (iso: string) =>
  new Date(iso).toLocaleString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });

async function slugYangMasihDijual(): Promise<string[] | null> {
  try {
    return (await ambilSemuaProduk()).map((p) => p.slug);
  } catch (e) {
    console.error("[order] gagal memeriksa stok untuk pesan lagi", e);
    return null;
  }
}

function BagianKurir({ pesanan, aktif }: { pesanan: Pesanan; aktif: boolean }) {
  const resi = pesanan.tracking_number;
  if (!resi) return null;

  const lacak = pesanan.tracking;
  const sampai = pesanan.delivered_at;
  const posisi = lacak ? posisiTerakhir(lacak) : null;

  return (
    <div className="mt-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className="inline-block border border-brand-200 bg-brand-50 px-4 py-2 font-mono text-sm text-brand-700">
          {namaKurir(pesanan.courier)} &middot; {resi}
        </p>
        <CopyButton nilai={resi} label="nomor resi" />
      </div>

      {aktif && sampai && (
        <div className="mt-5 max-w-md border border-emerald-200 bg-emerald-50 px-5 py-4">
          <p className="text-sm font-medium text-emerald-800">
            Paket sudah sampai &middot; {waktuKurir(sampai)}
          </p>
          {lacak?.receiver && (
            <p className="mt-1 text-sm text-emerald-800">Diterima oleh {lacak.receiver}</p>
          )}
          <p className="mt-3 text-sm leading-relaxed text-emerald-900/80">
            Ada masalah? Kirim video unboxing ke{" "}
            <a
              href={WA_URL}
              className="border-b border-emerald-700/40 font-medium text-emerald-900 transition-colors hover:border-emerald-900"
            >
              WhatsApp
            </a>{" "}
            sebelum {waktuKurir(batasKomplain(sampai))}.
          </p>
        </div>
      )}

      {aktif && !sampai && posisi && (
        <div className="mt-5">
          <p className="text-sm text-ink">
            Posisi terakhir: <span className="font-medium">{posisi.teks}</span>
            {posisi.at && <> &middot; {waktuKurir(posisi.at)}</>}
          </p>
          {lacak && (
            <p className="mt-1 text-xs text-stone-500">Diperbarui {sejak(lacak.fetched_at)}</p>
          )}
        </div>
      )}

      {aktif && !sampai && !posisi && (
        <p className="mt-5 max-w-md text-sm leading-relaxed text-stone-500">
          Riwayat perjalanan belum tersedia. Biasanya muncul beberapa jam setelah
          paket diserahkan ke kurir.
        </p>
      )}

      {lacak && <RiwayatKurir baris={barisRiwayat(lacak)} awal={aktif && !sampai ? 3 : 0} />}
    </div>
  );
}

function catatanLangkah(
  langkah: (typeof LANGKAH)[number],
  pesanan: Pesanan,
  sekarang: boolean,
): string {
  if (langkah.status === "SHIPPED" && sekarang && pesanan.delivered_at) {
    return "Paket sudah sampai";
  }

  if (langkah.status === "DELIVERED" && sekarang && pesanan.delivered_at && pesanan.tracking?.delivered) {
    const oleh = pesanan.tracking.receiver ? ` oleh ${pesanan.tracking.receiver}` : "";
    return `Diterima${oleh} · ${waktuKurir(pesanan.delivered_at)}`;
  }

  return sekarang ? (langkah.catatanAktif ?? langkah.catatan) : langkah.catatan;
}

function PerluMasuk({ orderNo }: { orderNo: string }) {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 pt-32 pb-24">
      <p className="font-mono text-[13px] tracking-[0.28em] text-accent-600 uppercase">
        Status pesanan
      </p>
      <h1 className="mt-3 font-mono text-2xl tracking-[0.1em] text-ink uppercase sm:text-3xl">
        {orderNo}
      </h1>

      <div className="mt-10 border border-ink/10 bg-white px-6 py-8">
        <p className="font-medium text-ink">Pesanan ini terhubung ke akun</p>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-stone-600">
          Supaya data pembeli tetap aman, pesanan yang dibuat saat masuk dengan
          akun hanya bisa dibuka oleh pemiliknya. Masuk dengan akun Google yang
          dipakai waktu memesan.
        </p>
        <div className="mt-6">
          <GoogleButton href={urlMasukGoogle(`/order/${orderNo}`)} label="Masuk dengan Google" />
        </div>
      </div>

      <BantuanAkun />
    </div>
  );
}

function BantuanAkun() {
  return (
    <p className="mt-8 max-w-lg text-sm leading-relaxed text-stone-500">
      Lupa akun mana yang dipakai waktu memesan?{" "}
      <a
        href={WA_URL}
        className="border-b border-stone-400 pb-0.5 text-ink transition-colors hover:border-brand-600 hover:text-brand-600"
      >
        Chat WhatsApp
      </a>
      , sebutkan nomor pesanannya, nanti kami bantu cek.
    </p>
  );
}

function AkunLain({ orderNo, email }: { orderNo: string; email: string | null }) {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 pt-32 pb-24">
      <p className="font-mono text-[13px] tracking-[0.28em] text-accent-600 uppercase">
        Status pesanan
      </p>
      <h1 className="mt-3 font-mono text-2xl tracking-[0.1em] text-ink uppercase sm:text-3xl">
        {orderNo}
      </h1>

      <div className="mt-10 border border-amber-200 bg-amber-50/60 px-6 py-8">
        <p className="font-medium text-ink">Pesanan ini milik akun lain</p>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-stone-600">
          {email ? (
            <>
              Kamu sedang masuk sebagai <span className="font-medium text-ink">{email}</span>,
              sedangkan pesanan ini dibuat dengan akun Google yang berbeda.
            </>
          ) : (
            "Akun yang sedang kamu pakai berbeda dengan akun yang dipakai waktu memesan."
          )}{" "}
          Supaya data pembeli tetap aman, isinya hanya bisa dibuka oleh akun pemesan.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-4">
          <GoogleButton href={urlMasukGoogle(`/order/${orderNo}`)} label="Ganti akun Google" />
          <Link
            href="/akun"
            className="border-b border-stone-400 pb-0.5 text-sm text-ink transition-colors hover:border-brand-600 hover:text-brand-600"
          >
            Lihat pesanan di akun ini
          </Link>
        </div>
      </div>

      <BantuanAkun />
    </div>
  );
}

export default async function StatusPesananPage({ params }: Props) {
  const { orderNo } = await params;
  const hasil = await ambilPesanan(orderNo);

  if (hasil.status === "tidak_ada") notFound();
  if (hasil.status === "perlu_masuk") return <PerluMasuk orderNo={orderNo} />;
  if (hasil.status === "akun_lain") {
    const akun = await ambilAkun().catch(() => null);
    return <AkunLain orderNo={orderNo} email={akun?.user.email ?? null} />;
  }

  const { pesanan } = hasil;

  const batal = pesanan.status === "EXPIRED" || pesanan.status === "CANCELLED";
  const posisi = ALUR.indexOf(pesanan.status);
  const bolehPesanLagi = batal || pesanan.status === "DELIVERED";
  const tersedia = bolehPesanLagi ? await slugYangMasihDijual() : null;

  const pemilik = pesanan.bisa_ulas !== undefined;
  const barangUlas = [
    ...new Map(
      pesanan.items
        .filter((it) => it.variant_slug)
        .map((it) => [it.variant_slug as string, { variantSlug: it.variant_slug as string, nama: it.name_snapshot }]),
    ).values(),
  ];
  const kunciUlas = pesanan.bisa_ulas ? await ambilKunciCaptcha() : null;

  return (
    <div className="mx-auto w-full max-w-3xl px-6 pt-32 pb-24">
      <p className="font-mono text-[13px] tracking-[0.28em] text-accent-600 uppercase">
        Status pesanan
      </p>
      <h1 className="mt-3 font-mono text-2xl tracking-[0.1em] text-ink sm:text-3xl">
        {pesanan.order_no}
      </h1>
      <p className="mt-3 text-sm text-stone-500">
        Dibuat {tanggal(pesanan.created_at)} WIB
      </p>
      {pesanan.dilihat_admin && (
        <div className="mt-3">
          <p className="inline-block border border-amber-300 bg-amber-50 px-3 py-1 font-mono text-[11px] tracking-[0.16em] indent-[0.16em] text-amber-800 uppercase">
            Dilihat sebagai admin
          </p>
          <p className="mt-2 text-sm text-stone-600">
            {pesanan.account_email ? (
              <>
                Akun Google pemesan:{" "}
                <span className="font-medium break-all text-ink">{pesanan.account_email}</span>
              </>
            ) : (
              "Pesanan tamu, belum terhubung ke akun Google."
            )}
          </p>
          {pesanan.email &&
            pesanan.email.toLowerCase() !== pesanan.account_email?.toLowerCase() && (
              <p className="mt-1 text-sm text-stone-600">
                Email di formulir:{" "}
                <span className="font-medium break-all text-ink">{pesanan.email}</span>
              </p>
            )}
        </div>
      )}

      {batal ? (
        <div className="mt-10 border border-stone-300 bg-stone-100 px-6 py-8">
          <p className="font-mono text-[13px] tracking-[0.2em] text-stone-600 uppercase">
            {statusLabel[pesanan.status]}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-stone-600">
            {pesanan.status === "EXPIRED"
              ? "Batas waktu pembayaran sudah lewat, jadi pesanan ini otomatis dibatalkan. Kamu bisa memesan ulang kapan saja."
              : "Pesanan ini dibatalkan. Kalau ini bukan kamu yang membatalkan, hubungi kami lewat WhatsApp."}
          </p>
          <ReorderButton items={pesanan.items} tersedia={tersedia} />
        </div>
      ) : (
        <ol className="mt-12 border-l border-ink/15 pl-8">
          {LANGKAH.map((l, i) => {
            const lewat = i <= posisi;
            const sekarang = i === posisi;

            return (
              <li key={l.status} className="relative pb-10 last:pb-0">
                <span
                  aria-hidden="true"
                  className={`absolute top-1 -left-[41px] flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                    lewat ? "border-brand-500 bg-brand-500" : "border-ink/20 bg-white"
                  }`}
                >
                  {lewat && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                </span>

                <p
                  className={`font-mono text-[13px] tracking-[0.2em] uppercase ${
                    sekarang ? "text-brand-600" : lewat ? "text-ink" : "text-stone-400"
                  }`}
                >
                  {l.judul}
                </p>
                <p
                  className={`mt-1.5 text-sm ${lewat ? "text-stone-600" : "text-stone-400"}`}
                >
                  {catatanLangkah(l, pesanan, sekarang)}
                </p>

                {lewat && l.status === "SHIPPED" && (
                  <BagianKurir pesanan={pesanan} aktif={sekarang} />
                )}

                {sekarang && l.status === "PENDING" && (
                  <Link
                    href={`/bayar/${pesanan.order_no}`}
                    className="mt-4 inline-block border border-brand-500 bg-brand-500 px-8 py-3 font-mono text-[13px] tracking-[0.22em] indent-[0.22em] text-white uppercase transition-colors hover:border-brand-600 hover:bg-brand-600"
                  >
                    Bayar sekarang
                  </Link>
                )}

                {sekarang && l.status === "PENDING" && pesanan.payment_channel === "DOKU" && (
                  <PaymentCheck orderNo={pesanan.order_no} />
                )}
              </li>
            );
          })}
        </ol>
      )}

      <div className="mt-16 grid gap-10 border-t border-ink/10 pt-10 sm:grid-cols-2">
        <div>
          <h2 className="font-mono text-[13px] tracking-[0.28em] text-stone-500 uppercase">
            Dikirim ke
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-ink">
            {pesanan.customer_name}
            <br />
            {pesanan.phone}
            <br />
            {pesanan.address && (
              <>
                {pesanan.address}
                <br />
              </>
            )}
            {pesanan.dest_label}
          </p>
          {pesanan.samar && (
            <p className="mt-3 max-w-xs text-xs leading-relaxed text-stone-500">
              Alamat lengkap dan kontak disamarkan supaya data pembeli tetap
              aman.{" "}
              <a
                href={urlMasukGoogle(`/order/${pesanan.order_no}`)}
                className="border-b border-stone-400 text-ink transition-colors hover:border-brand-600 hover:text-brand-600"
              >
                Masuk dengan Google
              </a>{" "}
              pakai email yang dipakai waktu memesan untuk melihat detail
              lengkapnya.
            </p>
          )}
          {pesanan.payment_method && (
            <p className="mt-3 font-mono text-xs text-stone-500">
              Dibayar lewat {pesanan.payment_method}
            </p>
          )}
          <p className="mt-3 font-mono text-xs text-stone-500">
            {namaLayanan(pesanan.courier, pesanan.service)} &middot; {pesanan.weight_g} g
            {pesanan.etd && pesanan.etd !== "-" ? ` · estimasi ${pesanan.etd}` : ""}
          </p>
          {pesanan.notes && (
            <p className="mt-3 text-sm text-stone-500">Catatan: {pesanan.notes}</p>
          )}
        </div>

        <div>
          <h2 className="font-mono text-[13px] tracking-[0.28em] text-stone-500 uppercase">
            Rincian
          </h2>
          <ul className="mt-4 space-y-2">
            {pesanan.items.map((it, i) => (
              <li key={`${it.slug}-${i}`} className="flex justify-between gap-4 text-sm">
                <span className="text-stone-700">
                  {it.qty}&times;{" "}
                  {it.product_active ? (
                    <Link
                      href={`/produk/${encodeURIComponent(it.slug)}`}
                      className="border-b border-stone-300 transition-colors hover:border-brand-600 hover:text-brand-600"
                    >
                      {it.name_snapshot}
                    </Link>
                  ) : (
                    it.name_snapshot
                  )}
                </span>
                <span className="text-right font-mono whitespace-nowrap text-stone-500">
                  {it.list_price_snapshot && (
                    <s className="mr-2 text-xs text-stone-400">
                      {rupiah(it.list_price_snapshot * it.qty)}
                    </s>
                  )}
                  {rupiah(it.price_snapshot * it.qty)}
                </span>
              </li>
            ))}
          </ul>

          <dl className="mt-4 space-y-1.5 border-t border-ink/10 pt-4 font-mono text-sm">
            <div className="flex justify-between text-stone-500">
              <dt>Subtotal</dt>
              <dd>{rupiah(pesanan.subtotal)}</dd>
            </div>
            <div className="flex justify-between text-stone-500">
              <dt>Ongkir</dt>
              <dd>{rupiah(pesanan.shipping_cost)}</dd>
            </div>
            <div className="flex justify-between pt-1.5 text-base font-semibold text-brand-600">
              <dt>Total</dt>
              <dd>{rupiah(pesanan.total)}</dd>
            </div>
          </dl>
        </div>
      </div>

      {pemilik && pesanan.bisa_ulas && barangUlas.length > 0 && (
        <UlasanPesanan
          orderNo={pesanan.order_no}
          barang={barangUlas}
          ulasanAwal={pesanan.ulasan_saya ?? []}
          siteKey={kunciUlas}
        />
      )}

      {pemilik && !pesanan.bisa_ulas && (pesanan.status === "PAID" || pesanan.status === "SHIPPED") && (
        <p className="mt-12 border-t border-ink/10 pt-8 text-sm leading-relaxed text-stone-500">
          Kamu bisa menulis ulasan untuk pesanan ini begitu paketnya diterima.
        </p>
      )}

      {pesanan.status === "DELIVERED" && (
        <div className="mt-12 border-t border-ink/10 pt-10">
          <h2 className="font-mono text-[13px] tracking-[0.28em] text-stone-500 uppercase">
            Butuh lagi?
          </h2>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-stone-600">
            Isi yang sama bisa langsung dimasukkan ke keranjang, jadi tidak
            perlu mencari produknya satu per satu.
          </p>
          <ReorderButton items={pesanan.items} tersedia={tersedia} />
        </div>
      )}

      <p className="mt-12 border-t border-ink/10 pt-8 text-sm leading-relaxed text-stone-500">
        Ada yang perlu ditanyakan soal pesanan ini?{" "}
        <a
          href={WA_URL}
          className="border-b border-stone-400 pb-0.5 text-ink transition-colors hover:border-brand-600 hover:text-brand-600"
        >
          Chat WhatsApp
        </a>
        , sebutkan nomor pesanannya.
      </p>
    </div>
  );
}
