import { bentrokUnik, type Kueri, type Sql } from "../lib/db";
import type { FotoBersih } from "../lib/cloudinary";

export type BarisFoto = {
  id: number;
  cloudinary_id: string;
  alt: string | null;
  version: number | null;
  width: number | null;
  height: number | null;
  variant_slug: string | null;
};

export const fotoProduk = (sql: Kueri, publik: boolean) => sql`
  coalesce((
    select jsonb_agg(
      jsonb_build_object(
        'id', i.id::int,
        'cloudinary_id', i.cloudinary_id,
        'alt', i.alt,
        'version', i.version,
        'width', i.width,
        'height', i.height,
        'variant_slug', v.slug
      ) order by i.sort_order, i.id
    )
    from product_images i
    left join product_variants v on v.id = i.variant_id
    where i.product_id = products.id
      and (${!publik}::boolean or v.id is null or v.is_active)
  ), '[]'::jsonb) as images
`;

const kolom = (sql: Kueri) => sql`
  i.id::int as id,
  i.cloudinary_id,
  i.alt,
  i.version::float8 as version,
  i.width,
  i.height,
  (select v.slug from product_variants v where v.id = i.variant_id) as variant_slug
`;

export type HasilTambahFoto =
  | { ok: true; foto: BarisFoto }
  | { ok: false; alasan: "not_found" | "variant_not_found" | "duplicate" | "too_many" };

export async function tambahFoto(
  sql: Sql,
  produkSlug: string,
  foto: FotoBersih,
  varianSlug: string | null,
  maksimal: number,
): Promise<HasilTambahFoto> {
  try {
    return await sql.begin(async (tx) => {
      const [produk] = await tx<{ id: number }[]>`
        select id::int as id from products where slug = ${produkSlug} for update
      `;
      if (!produk) return { ok: false, alasan: "not_found" } as const;

      const [hitung] = await tx<{ jumlah: number }[]>`
        select count(*)::int as jumlah from product_images where product_id = ${produk.id}
      `;
      if (hitung.jumlah >= maksimal) return { ok: false, alasan: "too_many" } as const;

      let varianId: number | null = null;
      if (varianSlug !== null) {
        const [varian] = await tx<{ id: number }[]>`
          select id::int as id from product_variants
          where product_id = ${produk.id} and slug = ${varianSlug}
        `;
        if (!varian) return { ok: false, alasan: "variant_not_found" } as const;
        varianId = varian.id;
      }

      const [baru] = await tx<BarisFoto[]>`
        insert into product_images as i (product_id, variant_id, cloudinary_id, version, width, height, sort_order)
        values (
          ${produk.id},
          ${varianId},
          ${foto.cloudinary_id},
          ${foto.version},
          ${foto.width},
          ${foto.height},
          (select coalesce(max(sort_order) + 1, 0) from product_images where product_id = ${produk.id})
        )
        returning ${kolom(tx)}
      `;

      return { ok: true, foto: baru } as const;
    });
  } catch (e) {
    if (bentrokUnik(e)) return { ok: false, alasan: "duplicate" };
    throw e;
  }
}

export async function ubahUkuranFoto(
  sql: Sql,
  id: number,
  varianSlug: string | null,
): Promise<{ ok: true; foto: BarisFoto } | { ok: false; alasan: "not_found" | "variant_not_found" }> {
  const [foto] = await sql<{ product_id: number }[]>`
    select product_id::int as product_id from product_images where id = ${id}
  `;
  if (!foto) return { ok: false, alasan: "not_found" };

  let varianId: number | null = null;
  if (varianSlug !== null) {
    const [varian] = await sql<{ id: number }[]>`
      select id::int as id from product_variants
      where product_id = ${foto.product_id} and slug = ${varianSlug}
    `;
    if (!varian) return { ok: false, alasan: "variant_not_found" };
    varianId = varian.id;
  }

  const [hasil] = await sql<BarisFoto[]>`
    update product_images i set variant_id = ${varianId}
    where i.id = ${id}
    returning ${kolom(sql)}
  `;

  return { ok: true, foto: hasil };
}

export async function urutkanFoto(
  sql: Sql,
  produkSlug: string,
  urutan: number[],
): Promise<{ ok: true } | { ok: false; alasan: "not_found" | "mismatch" }> {
  return sql.begin(async (tx) => {
    const [produk] = await tx<{ id: number }[]>`
      select id::int as id from products where slug = ${produkSlug} for update
    `;
    if (!produk) return { ok: false, alasan: "not_found" } as const;

    const ada = await tx<{ id: number }[]>`
      select id::int as id from product_images where product_id = ${produk.id}
    `;
    const sekarang = ada.map((f) => f.id).sort((a, b) => a - b);
    const diminta = [...urutan].sort((a, b) => a - b);
    if (sekarang.length !== diminta.length || sekarang.some((v, i) => v !== diminta[i])) {
      return { ok: false, alasan: "mismatch" } as const;
    }

    await tx`
      update product_images i
      set sort_order = u.urut - 1
      from jsonb_array_elements_text(${tx.json(urutan)}) with ordinality as u(id, urut)
      where i.id = u.id::bigint and i.product_id = ${produk.id}
    `;

    return { ok: true } as const;
  });
}

export async function hapusFoto(
  sql: Sql,
  id: number,
): Promise<{ ok: true } | { ok: false; alasan: "not_found" | "last_image" }> {
  return sql.begin(async (tx) => {
    const [foto] = await tx<{ product_id: number }[]>`
      select product_id::int as product_id from product_images where id = ${id}
    `;
    if (!foto) return { ok: false, alasan: "not_found" } as const;

    await tx`select id from products where id = ${foto.product_id} for update`;

    const [hitung] = await tx<{ jumlah: number }[]>`
      select count(*)::int as jumlah from product_images where product_id = ${foto.product_id}
    `;
    if (hitung.jumlah <= 1) return { ok: false, alasan: "last_image" } as const;

    await tx`delete from product_images where id = ${id}`;
    return { ok: true } as const;
  });
}
