import AdminImporUlasan, { type PilihanVarian } from "@/app/components/admin-impor-ulasan";
import { ambilProdukAdmin } from "@/app/lib/api";

export default async function AdminUlasanPage() {
  const produk = await ambilProdukAdmin();

  const varian: PilihanVarian[] = produk
    .flatMap((p) =>
      p.varian.map((v) => ({
        nilai: v.slug,
        label: `${p.varian.length > 1 ? `${p.nama} · ${v.label}` : p.nama}${
          p.aktif === false || v.aktif === false ? " (nonaktif)" : ""
        }`,
        aktif: p.aktif !== false && v.aktif !== false,
      })),
    )
    .sort((a, b) => Number(b.aktif) - Number(a.aktif) || a.label.localeCompare(b.label, "id"))
    .map(({ nilai, label }) => ({ nilai, label }));

  return <AdminImporUlasan varian={varian} />;
}
