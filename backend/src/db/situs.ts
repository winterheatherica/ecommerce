import type { Sql } from "../lib/db";
import type { KelompokFaqBaru } from "../lib/faq";
import type { GrupBaru, IsiKategoriBersih, KategoriBersih } from "../lib/kategori";
import type { TokoBersih } from "../lib/toko";

export type BarisToko = TokoBersih & { updated_at: string };
export type BarisKategori = KategoriBersih & { product_count?: number };
export type BarisKelompokFaq = {
  slug: string;
  title: string;
  items: { id: number; question: string; answer: string }[];
};

export type Situs = {
  store: BarisToko | null;
  groups: GrupBaru[];
  categories: BarisKategori[];
  faq: BarisKelompokFaq[];
};

export async function ambilSitus(sql: Sql, admin = false): Promise<Situs> {
  const [baris] = await sql<Situs[]>`
    select
      (select to_jsonb(s) - 'id' from store_settings s) as store,
      coalesce((
        select jsonb_agg(
          jsonb_build_object('slug', g.slug, 'label', g.label, 'title', g.title, 'summary', g.summary)
          order by g.sort_order, g.slug
        )
        from category_groups g
      ), '[]'::jsonb) as groups,
      coalesce((
        select jsonb_agg(
          jsonb_build_object(
            'slug', c.slug,
            'group_slug', c.group_slug,
            'label', c.label,
            'title', c.title,
            'seo_title', c.seo_title,
            'summary', c.summary,
            'complaint', c.complaint
          ) || case
            when ${admin}::boolean then jsonb_build_object(
              'product_count', (select count(*)::int from products p where p.category = c.slug)
            )
            else '{}'::jsonb
          end
          order by c.sort_order, c.slug
        )
        from categories c
      ), '[]'::jsonb) as categories,
      coalesce((
        select jsonb_agg(
          jsonb_build_object(
            'slug', f.slug,
            'title', f.title,
            'items', coalesce((
              select jsonb_agg(
                jsonb_build_object('id', i.id::int, 'question', i.question, 'answer', i.answer)
                order by i.sort_order, i.id
              )
              from faq_items i
              where i.group_slug = f.slug
            ), '[]'::jsonb)
          )
          order by f.sort_order, f.slug
        )
        from faq_groups f
      ), '[]'::jsonb) as faq
  `;

  return baris;
}

export async function simpanToko(sql: Sql, t: TokoBersih): Promise<BarisToko> {
  const [baris] = await sql<{ store: BarisToko }[]>`
    insert into store_settings as s (
      id, wa_number, wa_link, address_street, address_village, address_district, address_city,
      address_province, postal_code, maps_url, open_days, opens_at, closes_at, closed_on_holidays,
      social_links
    )
    values (
      true, ${t.wa_number}, ${t.wa_link}, ${t.address_street}, ${t.address_village}, ${t.address_district},
      ${t.address_city}, ${t.address_province}, ${t.postal_code}, ${t.maps_url}, ${sql.json(t.open_days)},
      ${t.opens_at}, ${t.closes_at}, ${t.closed_on_holidays}, ${sql.json(t.social_links)}
    )
    on conflict (id) do update set
      wa_number = excluded.wa_number,
      wa_link = excluded.wa_link,
      address_street = excluded.address_street,
      address_village = excluded.address_village,
      address_district = excluded.address_district,
      address_city = excluded.address_city,
      address_province = excluded.address_province,
      postal_code = excluded.postal_code,
      maps_url = excluded.maps_url,
      open_days = excluded.open_days,
      opens_at = excluded.opens_at,
      closes_at = excluded.closes_at,
      closed_on_holidays = excluded.closed_on_holidays,
      social_links = excluded.social_links,
      updated_at = now()
    returning to_jsonb(s) - 'id' as store
  `;

  return baris.store;
}

export type HasilSimpanKategori =
  | { ok: true }
  | { ok: false; alasan: "category_in_use"; slugs: string[] };

export async function simpanKategori(sql: Sql, isi: IsiKategoriBersih): Promise<HasilSimpanKategori> {
  return sql.begin(async (tx) => {
    await tx`lock table category_groups, categories in share row exclusive mode`;

    const slugKategori = tx.json(isi.categories.map((k) => k.slug));
    const slugGrup = tx.json(isi.groups.map((g) => g.slug));

    const dipakai = await tx<{ category: string }[]>`
      select distinct category from products
      where category not in (select jsonb_array_elements_text(${slugKategori}))
      order by category
    `;
    if (dipakai.length > 0) {
      return { ok: false, alasan: "category_in_use", slugs: dipakai.map((d) => d.category) } as const;
    }

    await tx`
      insert into category_groups ${tx(
        isi.groups.map((g, i) => ({ ...g, sort_order: i })) as unknown as Record<string, never>[],
      )}
      on conflict (slug) do update set
        label = excluded.label,
        title = excluded.title,
        summary = excluded.summary,
        sort_order = excluded.sort_order
    `;

    await tx`delete from categories where slug not in (select jsonb_array_elements_text(${slugKategori}))`;

    await tx`
      insert into categories ${tx(
        isi.categories.map((k, i) => ({ ...k, sort_order: i })) as unknown as Record<string, never>[],
      )}
      on conflict (slug) do update set
        group_slug = excluded.group_slug,
        label = excluded.label,
        title = excluded.title,
        seo_title = excluded.seo_title,
        summary = excluded.summary,
        complaint = excluded.complaint,
        sort_order = excluded.sort_order
    `;

    await tx`delete from category_groups where slug not in (select jsonb_array_elements_text(${slugGrup}))`;

    return { ok: true } as const;
  });
}

export async function simpanFaq(sql: Sql, kelompok: KelompokFaqBaru[]): Promise<void> {
  await sql.begin(async (tx) => {
    await tx`delete from faq_groups`;

    await tx`
      insert into faq_groups ${tx(
        kelompok.map((k, i) => ({ slug: k.slug, title: k.title, sort_order: i })) as unknown as Record<
          string,
          never
        >[],
      )}
    `;

    await tx`
      insert into faq_items ${tx(
        kelompok.flatMap((k) =>
          k.items.map((x, i) => ({ group_slug: k.slug, question: x.question, answer: x.answer, sort_order: i })),
        ) as unknown as Record<string, never>[],
      )}
    `;
  });
}
