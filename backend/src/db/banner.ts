import type { BannerBersih } from "../lib/banner";
import type { Sql } from "../lib/db";

export async function simpanBanner(sql: Sql, daftar: BannerBersih[]): Promise<void> {
  await sql.begin(async (tx) => {
    await tx`delete from promo_banners`;

    if (daftar.length === 0) return;

    await tx`
      insert into promo_banners ${tx(
        daftar.map((b, i) => ({ ...b, sort_order: i })) as unknown as Record<string, never>[],
      )}
    `;
  });
}
