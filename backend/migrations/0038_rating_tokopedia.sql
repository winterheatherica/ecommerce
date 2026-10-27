ALTER TABLE product_variants
  ADD COLUMN tokopedia_url text,
  ADD COLUMN tokopedia_rating numeric(3, 2),
  ADD COLUMN tokopedia_rating_count integer,
  ADD COLUMN tokopedia_rating_at timestamptz,
  ADD CONSTRAINT product_variants_tokopedia_url CHECK (
    tokopedia_url IS NULL
    OR (length(tokopedia_url) <= 300 AND tokopedia_url ~ '^https://(www\.)?tokopedia\.com/\S+$')
  ),
  ADD CONSTRAINT product_variants_tokopedia_rating CHECK (
    CASE
      WHEN coalesce(tokopedia_rating_count, 0) = 0 THEN tokopedia_rating IS NULL
      ELSE tokopedia_rating_count > 0 AND coalesce(tokopedia_rating BETWEEN 1 AND 5, false)
    END
  );
