import Link from "next/link";
import type { ReactNode } from "react";

import LaporanPanas from "@/app/components/laporan-panas";
import LaporanTren from "@/app/components/laporan-tren";
import { rupiah } from "@/app/data/produk";
import { statusLabel, statusWarna, type StatusPesanan } from "@/app/data/status-pesanan";
import { namaKurir } from "@/app/lib/kurir";
import {
  NAMA_SUMBER_ULASAN,
  angka,
  labelMetode,
  persen,
  teksMenit,
  type LaporanAPI,
} from "@/app/lib/laporan";

const URUTAN_STATUS: StatusPesanan[] = ["PENDING", "PAID", "SHIPPED", "DELIVERED", "EXPIRED", "CANCELLED"];
const SATU_DESIMAL = new Intl.NumberFormat("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const BELUM_DIBAYAR = "Belum ada pesanan dibayar di periode ini.";

function Kartu({
  judul,
  keterangan,
  children,
  className = "",
}: {
  judul: string;
  keterangan?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`border border-ink/10 bg-white p-5 lg:p-6 ${className}`}>
      <h2 className="text-[15px] font-semibold text-ink">{judul}</h2>
      {keterangan && <p className="mt-1 text-sm text-stone-500">{keterangan}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Kosong({ children = BELUM_DIBAYAR }: { children?: ReactNode }) {
  return <p className="text-sm text-stone-500">{children}</p>;
}

function Delta({
  sekarang,
  sebelumnya,
  poin = false,
}: {
  sekarang: number;
  sebelumnya: number | null | undefined;
  poin?: boolean;
}) {
  if (sebelumnya === null || sebelumnya === undefined) return null;

  const selisih = sekarang - sebelumnya;
  if (selisih === 0) return <span className="text-xs text-stone-500">Sama dengan periode sebelumnya</span>;
  if (!poin && sebelumnya === 0) return <span className="text-xs text-stone-500">Periode sebelumnya masih kosong</span>;

  const naik = selisih > 0;
  const besar = poin ? `${SATU_DESIMAL.format(Math.abs(selisih))} poin` : persen(Math.abs(selisih), sebelumnya);

  return (
    <span className={`text-xs font-medium ${naik ? "text-emerald-700" : "text-red-700"}`}>
      <span aria-hidden="true">{naik ? "▲" : "▼"} </span>
      <span className="sr-only">{naik ? "Naik" : "Turun"} </span>
      {besar}
      <span className="font-normal text-stone-500"> dari periode sebelumnya</span>
    </span>
  );
}

function Angka({
  label,
  nilai,
  delta,
  catatan,
  besar = false,
  children,
}: {
  label: string;
  nilai: string;
  delta?: ReactNode;
  catatan?: string;
  besar?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className={`flex flex-col border border-ink/10 bg-white p-5 ${besar ? "sm:col-span-2" : ""}`}>
      <p className="text-sm text-stone-500">{label}</p>
      <p className={`mt-2 font-semibold tracking-tight text-ink ${besar ? "text-4xl sm:text-5xl" : "text-2xl"}`}>{nilai}</p>
      {children}
      {delta && <p className="mt-2">{delta}</p>}
      {catatan && <p className="mt-1 text-xs text-stone-500">{catatan}</p>}
    </div>
  );
}

type BarisBatang = { kunci: string; label: ReactNode; nilai: number; teks: string; sub?: string };

function DaftarBatang({ baris }: { baris: BarisBatang[] }) {
  const maks = Math.max(0, ...baris.map((b) => b.nilai));

  return (
    <ul className="space-y-4">
      {baris.map((b) => (
        <li key={b.kunci}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 text-stone-700">{b.label}</span>
            <span className="shrink-0 font-medium text-ink tabular-nums">{b.teks}</span>
          </div>
          <div className="mt-1.5 h-2 bg-stone-100" aria-hidden="true">
            <div
              className="h-full rounded-r-[4px] bg-brand-500"
              style={{ width: maks > 0 ? `${Math.max((b.nilai / maks) * 100, b.nilai > 0 ? 2 : 0)}%` : 0 }}
            />
          </div>
          {b.sub && <p className="mt-1 text-xs text-stone-500">{b.sub}</p>}
        </li>
      ))}
    </ul>
  );
}

function Bintang({ nilai }: { nilai: number }) {
  return (
    <span className="whitespace-nowrap">
      <span aria-hidden="true" className="text-amber-500">
        &#9733;
      </span>{" "}
      {SATU_DESIMAL.format(nilai)}
    </span>
  );
}

export default function IsiLaporan({ laporan }: { laporan: LaporanAPI }) {
  const s = laporan.summary;
  const p = laporan.previous_summary;
  const adaPenjualan = s.paid_orders > 0;
  const tingkat = s.created_orders > 0 ? (s.created_paid_orders / s.created_orders) * 100 : 0;
  const tingkatLalu = p ? (p.created_orders > 0 ? (p.created_paid_orders / p.created_orders) * 100 : 0) : null;
  const statusAda = URUTAN_STATUS.map((st) => laporan.statuses.find((x) => x.status === st)).filter(
    (x): x is LaporanAPI["statuses"][number] => !!x && x.orders > 0,
  );
  const kedaluwarsa = laporan.statuses.find((x) => x.status === "EXPIRED");
  const d = laporan.durations;
  const bintang = [5, 4, 3, 2, 1].map((r) => ({
    rating: r,
    count: laporan.reviews.by_rating.find((x) => x.rating === r)?.count ?? 0,
  }));
  const jumlahUlasan = bintang.reduce((a, b) => a + b.count, 0);

  const tindakan = [
    {
      label: "Perlu dikirim",
      nilai: laporan.actions.to_ship,
      href: "/admin/pesanan?status=PAID",
      catatan: "Sudah dibayar, belum ada resi",
    },
    {
      label: "Sedang dikirim",
      nilai: laporan.actions.in_transit,
      href: "/admin/pesanan?status=SHIPPED",
      catatan: "Belum diterima pembeli",
    },
    {
      label: "Menunggu bayar",
      nilai: laporan.actions.awaiting_payment,
      href: "/admin/pesanan?status=PENDING",
      catatan: "Belum lewat batas bayar",
    },
    { label: "Stok habis", nilai: laporan.actions.out_of_stock, href: "/admin/ringkasan", catatan: "Ukuran aktif, stok 0" },
    { label: "Stok menipis", nilai: laporan.actions.low_stock, href: "/admin/ringkasan", catatan: "Sisa 1 sampai 10 unit" },
  ];

  return (
    <div className="space-y-6">
      <section aria-labelledby="perlu-diurus">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="perlu-diurus" className="text-[15px] font-semibold text-ink">
            Perlu diurus sekarang
          </h2>
          <p className="text-xs text-stone-500">Angka saat ini, tidak terpengaruh periode.</p>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {tindakan.map((t) => (
            <Link
              key={t.label}
              href={t.href}
              className="border border-ink/10 bg-white p-4 transition-colors hover:border-brand-400"
            >
              <p className="text-sm text-stone-600">{t.label}</p>
              <p className={`mt-1 text-2xl font-semibold tracking-tight ${t.nilai > 0 ? "text-brand-600" : "text-ink"}`}>
                {angka(t.nilai)}
              </p>
              <p className="mt-1 text-xs text-stone-500">{t.catatan}</p>
            </Link>
          ))}
        </div>
      </section>

      <section aria-label="Angka utama" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Angka
          label="Pendapatan"
          nilai={rupiah(s.revenue)}
          besar
          delta={<Delta sekarang={s.revenue} sebelumnya={p?.revenue} />}
          catatan={`Total yang dibayar pembeli: ${rupiah(s.product_sales)} dari produk dan ${rupiah(s.shipping)} ongkir`}
        />
        <Angka
          label="Pesanan dibayar"
          nilai={angka(s.paid_orders)}
          delta={<Delta sekarang={s.paid_orders} sebelumnya={p?.paid_orders} />}
        />
        <Angka
          label="Rata-rata per pesanan"
          nilai={rupiah(s.aov)}
          delta={<Delta sekarang={s.aov} sebelumnya={p?.aov} />}
        />
        <Angka
          label="Barang terjual"
          nilai={angka(s.items)}
          delta={<Delta sekarang={s.items} sebelumnya={p?.items} />}
        />
        <Angka
          label="Pembeli"
          nilai={angka(s.buyers)}
          delta={<Delta sekarang={s.buyers} sebelumnya={p?.buyers} />}
          catatan={`${angka(s.new_buyers)} pembeli baru, ${angka(s.returning_buyers)} pernah belanja sebelumnya`}
        />
        <Angka
          label="Tingkat pembayaran"
          nilai={`${SATU_DESIMAL.format(tingkat)}%`}
          delta={<Delta sekarang={tingkat} sebelumnya={tingkatLalu} poin />}
          catatan={`${angka(s.created_paid_orders)} dari ${angka(s.created_orders)} pesanan baru sudah dibayar`}
        >
          <div className="mt-3 h-2 bg-brand-100" aria-hidden="true">
            <div className="h-full rounded-r-[4px] bg-brand-500" style={{ width: `${Math.min(100, tingkat)}%` }} />
          </div>
        </Angka>
        <Angka
          label="Potongan promo"
          nilai={rupiah(s.discount)}
          delta={<Delta sekarang={s.discount} sebelumnya={p?.discount} />}
          catatan="Selisih harga normal dengan harga promo"
        />
      </section>

      <Kartu
        judul="Tren penjualan"
        keterangan="Dari pesanan yang sudah dibayar, menurut tanggal dibayar."
      >
        <LaporanTren tren={laporan.trend} ember={laporan.range.bucket} />
      </Kartu>

      <div className="grid gap-6 lg:grid-cols-2">
        <Kartu judul="Status pesanan" keterangan="Pesanan yang dibuat di periode ini, menurut statusnya sekarang.">
          {statusAda.length === 0 ? (
            <Kosong>Belum ada pesanan masuk di periode ini.</Kosong>
          ) : (
            <>
              <DaftarBatang
                baris={statusAda.map((x) => ({
                  kunci: x.status,
                  label: (
                    <span
                      className={`inline-flex border px-2 py-0.5 text-xs font-medium ${statusWarna[x.status]}`}
                    >
                      {statusLabel[x.status]}
                    </span>
                  ),
                  nilai: x.orders,
                  teks: `${angka(x.orders)} pesanan`,
                  sub: rupiah(x.value),
                }))}
              />
              {kedaluwarsa && kedaluwarsa.orders > 0 && (
                <p className="mt-5 border-t border-ink/10 pt-4 text-sm text-stone-600">
                  {angka(kedaluwarsa.orders)} pesanan senilai {rupiah(kedaluwarsa.value)} kedaluwarsa karena tidak
                  dibayar sampai batas waktunya.
                </p>
              )}
            </>
          )}
        </Kartu>

        <Kartu judul="Produk terlaris" keterangan="Diurutkan menurut pendapatan, tanpa ongkir.">
          {!adaPenjualan ? (
            <Kosong />
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-stone-500">
                <tr>
                  <th className="pb-2 font-medium">Produk</th>
                  <th className="pb-2 text-right font-medium">Terjual</th>
                  <th className="pb-2 pl-3 text-right font-medium">Pendapatan</th>
                </tr>
              </thead>
              <tbody>
                {laporan.top_products.map((x, i) => {
                  const nama = x.variant_count > 1 && x.variant_label ? `${x.name} (${x.variant_label})` : x.name;
                  return (
                    <tr key={`${x.slug}-${x.variant_label}-${i}`} className="border-t border-ink/5 align-top">
                      <td className="py-2.5 pr-3">
                        <div className="flex gap-2">
                          <span className="w-4 shrink-0 text-stone-400 tabular-nums">{i + 1}</span>
                          <div className="min-w-0 flex-1">
                            {x.slug ? (
                              <Link
                                href={`/admin/produk/${x.slug}/ubah`}
                                className="text-ink transition-colors hover:text-brand-600"
                              >
                                {nama}
                              </Link>
                            ) : (
                              <span className="text-ink">{nama}</span>
                            )}
                            <div className="mt-1.5 h-1.5 bg-stone-100" aria-hidden="true">
                              <div
                                className="h-full rounded-r-[4px] bg-brand-500"
                                style={{ width: `${s.product_sales > 0 ? (x.revenue / s.product_sales) * 100 : 0}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 text-right text-ink tabular-nums">{angka(x.qty)}</td>
                      <td className="py-2.5 pl-3 text-right whitespace-nowrap tabular-nums">
                        <span className="text-ink">{rupiah(x.revenue)}</span>
                        <span className="block text-xs text-stone-500">{persen(x.revenue, s.product_sales)}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Kartu>

        <Kartu judul="Penjualan per kategori" keterangan="Pendapatan produk menurut kategori, tanpa ongkir.">
          {!adaPenjualan ? (
            <Kosong />
          ) : (
            <DaftarBatang
              baris={laporan.categories.map((c) => ({
                kunci: c.slug,
                label: c.label,
                nilai: c.revenue,
                teks: rupiah(c.revenue),
                sub: `${angka(c.qty)} barang dari ${angka(c.orders)} pesanan · ${persen(c.revenue, s.product_sales)}`,
              }))}
            />
          )}
        </Kartu>

        <Kartu judul="Metode pembayaran" keterangan="Pesanan yang dibayar di periode ini.">
          {!adaPenjualan ? (
            <Kosong />
          ) : (
            <DaftarBatang
              baris={laporan.payments.map((x) => ({
                kunci: `${x.channel}-${x.method}`,
                label: labelMetode(x.channel, x.method),
                nilai: x.orders,
                teks: `${angka(x.orders)} pesanan`,
                sub: `${rupiah(x.revenue)} · ${persen(x.orders, s.paid_orders)} dari pesanan dibayar`,
              }))}
            />
          )}
        </Kartu>

        <Kartu judul="Kurir dan ongkir" keterangan={`Total ongkir yang dibayar pembeli: ${rupiah(s.shipping)}.`}>
          {!adaPenjualan ? (
            <Kosong />
          ) : (
            <DaftarBatang
              baris={laporan.couriers.map((c) => ({
                kunci: c.courier,
                label: namaKurir(c.courier),
                nilai: c.orders,
                teks: `${angka(c.orders)} pesanan`,
                sub: `Ongkir rata-rata ${rupiah(Math.round(c.avg_shipping))} · berat rata-rata ${angka(Math.round(c.avg_weight_g))} g`,
              }))}
            />
          )}
        </Kartu>

        <Kartu judul="Waktu proses" keterangan="Rata-rata dari pesanan yang dibayar di periode ini.">
          {!adaPenjualan ? (
            <Kosong />
          ) : (
            <dl className="divide-y divide-ink/5">
              {[
                {
                  label: "Dari pesan sampai dibayar",
                  nilai: d.pay_minutes,
                  jumlah: d.pay_count,
                },
                {
                  label: "Dari dibayar sampai dikirim",
                  nilai: d.ship_hours === null ? null : d.ship_hours * 60,
                  jumlah: d.ship_count,
                },
                {
                  label: "Dari dikirim sampai diterima",
                  nilai: d.deliver_days === null ? null : d.deliver_days * 1440,
                  jumlah: d.deliver_count,
                },
              ].map((x) => (
                <div key={x.label} className="flex items-baseline justify-between gap-4 py-3 first:pt-0 last:pb-0">
                  <dt className="text-sm text-stone-700">
                    {x.label}
                    <span className="block text-xs text-stone-500">
                      {x.jumlah > 0 ? `Dari ${angka(x.jumlah)} pesanan` : "Belum ada pesanan sampai tahap ini"}
                    </span>
                  </dt>
                  <dd className="text-lg font-semibold whitespace-nowrap text-ink">
                    {x.nilai === null ? "-" : teksMenit(x.nilai)}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </Kartu>

        <Kartu judul="Provinsi tujuan" keterangan="10 provinsi dengan pesanan dibayar terbanyak.">
          {!adaPenjualan ? (
            <Kosong />
          ) : (
            <DaftarBatang
              baris={laporan.provinces.map((x) => ({
                kunci: x.province,
                label: x.province,
                nilai: x.orders,
                teks: `${angka(x.orders)} pesanan`,
                sub: rupiah(x.revenue),
              }))}
            />
          )}
        </Kartu>

        <Kartu judul="Kota tujuan" keterangan="10 kota atau kabupaten dengan pesanan dibayar terbanyak.">
          {!adaPenjualan ? (
            <Kosong />
          ) : (
            <DaftarBatang
              baris={laporan.cities.map((x) => ({
                kunci: `${x.city}-${x.province}`,
                label: (
                  <>
                    {x.city}
                    <span className="text-stone-400"> · {x.province}</span>
                  </>
                ),
                nilai: x.orders,
                teks: `${angka(x.orders)} pesanan`,
                sub: rupiah(x.revenue),
              }))}
            />
          )}
        </Kartu>

        <Kartu judul="Pelanggan" keterangan="Pembeli dihitung dari akun, atau nomor HP kalau belanja tanpa akun.">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
            {[
              { label: "Pembeli baru", nilai: s.new_buyers, catatan: "Baru pertama kali bayar" },
              { label: "Pembeli kembali", nilai: s.returning_buyers, catatan: "Pernah belanja sebelumnya" },
              { label: "Akun baru", nilai: laporan.customers.new_accounts, catatan: "Daftar di periode ini" },
              {
                label: "Pesanan lewat akun",
                nilai: laporan.customers.account_orders,
                catatan: `${angka(laporan.customers.guest_orders)} pesanan tanpa akun`,
              },
            ].map((x) => (
              <div key={x.label}>
                <dt className="text-sm text-stone-500">{x.label}</dt>
                <dd className="mt-1 text-xl font-semibold text-ink">{angka(x.nilai)}</dd>
                <dd className="text-xs text-stone-500">{x.catatan}</dd>
              </div>
            ))}
          </dl>

          <h3 className="mt-6 text-sm font-medium text-ink">Pembeli dengan belanja terbanyak</h3>
          {laporan.customers.top.length === 0 ? (
            <div className="mt-2">
              <Kosong />
            </div>
          ) : (
            <table className="mt-2 w-full text-sm">
              <thead className="text-left text-xs text-stone-500">
                <tr>
                  <th className="pb-2 font-medium">Nama</th>
                  <th className="pb-2 text-right font-medium">Pesanan</th>
                  <th className="pb-2 pl-3 text-right font-medium">Belanja</th>
                </tr>
              </thead>
              <tbody>
                {laporan.customers.top.map((c, i) => (
                  <tr key={`${c.name}-${i}`} className="border-t border-ink/5">
                    <td className="py-2 pr-3 text-ink">
                      {c.name}
                      {c.has_account && <span className="ml-2 text-xs text-stone-500">punya akun</span>}
                    </td>
                    <td className="py-2 text-right text-ink tabular-nums">{angka(c.orders)}</td>
                    <td className="py-2 pl-3 text-right whitespace-nowrap text-ink tabular-nums">{rupiah(c.spent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Kartu>

        <Kartu judul="Ulasan" keterangan="Ulasan yang tampil, menurut tanggal ditulis, dari semua sumber.">
          {jumlahUlasan === 0 ? (
            <Kosong>Belum ada ulasan di periode ini.</Kosong>
          ) : (
            <>
              <ul className="divide-y divide-ink/5">
                {laporan.reviews.by_source.map((x) => (
                  <li key={x.source} className="flex items-baseline justify-between gap-3 py-2.5 text-sm first:pt-0">
                    <span className="text-stone-700">{NAMA_SUMBER_ULASAN[x.source] ?? x.source}</span>
                    <span className="text-ink tabular-nums">
                      {angka(x.count)} ulasan · <Bintang nilai={x.average} />
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-5">
                <DaftarBatang
                  baris={bintang.map((b) => ({
                    kunci: String(b.rating),
                    label: `${b.rating} bintang`,
                    nilai: b.count,
                    teks: `${angka(b.count)} · ${persen(b.count, jumlahUlasan)}`,
                  }))}
                />
              </div>
            </>
          )}
          <p className="mt-5 border-t border-ink/10 pt-4 text-xs text-stone-500">
            Sepanjang waktu: {angka(laporan.reviews.all_time.count)} ulasan tampil di website, rata-rata{" "}
            <Bintang nilai={laporan.reviews.all_time.average} />.
          </p>
        </Kartu>
      </div>

      <Kartu judul="Kapan pembeli memesan" keterangan="Semua pesanan yang dibuat di periode ini, menurut hari dan jam WIB.">
        <LaporanPanas data={laporan.heatmap} />
      </Kartu>

      <Kartu
        judul="Produk yang belum terjual"
        keterangan="Produk aktif yang belum ada di pesanan dibayar selama periode ini."
      >
        {laporan.unsold_products.length === 0 ? (
          <Kosong>Semua produk aktif terjual minimal sekali di periode ini.</Kosong>
        ) : (
          <details className="group">
            <summary className="cursor-pointer text-sm font-medium text-brand-600 [&::-webkit-details-marker]:hidden">
              {angka(laporan.unsold_products.length)} produk{" "}
              <span className="group-open:hidden">(lihat daftar)</span>
              <span className="hidden group-open:inline">(sembunyikan)</span>
            </summary>
            <ul className="mt-3 grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2 lg:grid-cols-3">
              {laporan.unsold_products.map((x) => (
                <li key={x.slug}>
                  <Link href={`/admin/produk/${x.slug}/ubah`} className="text-stone-700 hover:text-brand-600">
                    {x.name}
                  </Link>
                </li>
              ))}
            </ul>
          </details>
        )}
      </Kartu>
    </div>
  );
}
