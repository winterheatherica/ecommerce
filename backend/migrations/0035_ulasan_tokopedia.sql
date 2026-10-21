ALTER TABLE reviews DROP CONSTRAINT reviews_source_check;
ALTER TABLE reviews ADD CONSTRAINT reviews_source_check
  CHECK (source IN ('shopee', 'web', 'tokopedia'));

ALTER TABLE reviews DROP CONSTRAINT reviews_shopee_berteks;
ALTER TABLE reviews ADD CONSTRAINT reviews_impor_berteks
  CHECK (source NOT IN ('shopee', 'tokopedia') OR body IS NOT NULL OR follow_up IS NOT NULL);

ALTER TABLE reviews
  ADD COLUMN reviewed_precision text NOT NULL DEFAULT 'day'
    CHECK (reviewed_precision IN ('day', 'month', 'over_year')),
  ADD COLUMN source_product text
    CHECK (source_product IS NULL OR length(btrim(source_product)) BETWEEN 1 AND 200),
  ADD COLUMN source_url text
    CHECK (source_url IS NULL OR (length(source_url) <= 400 AND source_url ~ '^https://www\.tokopedia\.com/\S+$'));

CREATE INDEX reviews_urutan_tampil_idx
  ON reviews (variant_id, (reviewed_precision = 'over_year'), reviewed_at DESC, id DESC);
