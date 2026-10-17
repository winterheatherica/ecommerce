ALTER TABLE product_variants
  ADD COLUMN promo_price integer,
  ADD COLUMN promo_starts_at timestamptz,
  ADD COLUMN promo_ends_at timestamptz,
  ADD COLUMN promo_show_period boolean NOT NULL DEFAULT false,
  ADD CONSTRAINT product_variants_promo_lebih_murah
    CHECK (promo_price IS NULL OR (promo_price > 0 AND promo_price < price)),
  ADD CONSTRAINT product_variants_promo_urutan_waktu
    CHECK (promo_starts_at IS NULL OR promo_ends_at IS NULL OR promo_ends_at > promo_starts_at);

ALTER TABLE order_items
  ADD COLUMN list_price_snapshot integer
    CHECK (list_price_snapshot IS NULL OR list_price_snapshot > 0);

CREATE FUNCTION promo_aktif(promo integer, mulai timestamptz, akhir timestamptz)
RETURNS boolean AS $$
  SELECT promo IS NOT NULL
    AND (mulai IS NULL OR mulai <= now())
    AND (akhir IS NULL OR akhir > now())
$$ LANGUAGE sql STABLE;

CREATE FUNCTION harga_berlaku(harga integer, promo integer, mulai timestamptz, akhir timestamptz)
RETURNS integer AS $$
  SELECT CASE WHEN promo_aktif(promo, mulai, akhir) THEN promo ELSE harga END
$$ LANGUAGE sql STABLE;

CREATE FUNCTION status_promo(promo integer, mulai timestamptz, akhir timestamptz)
RETURNS text AS $$
  SELECT CASE
    WHEN promo IS NULL THEN 'none'
    WHEN promo_aktif(promo, mulai, akhir) THEN 'active'
    WHEN mulai IS NOT NULL AND mulai > now() THEN 'scheduled'
    ELSE 'ended'
  END
$$ LANGUAGE sql STABLE;
