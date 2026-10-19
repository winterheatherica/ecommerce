ALTER TABLE product_variants
  ADD COLUMN shopee_url text,
  ADD COLUMN shopee_rating numeric(3, 2),
  ADD COLUMN shopee_rating_count integer,
  ADD COLUMN shopee_rating_at timestamptz,
  ADD CONSTRAINT product_variants_shopee_url CHECK (
    shopee_url IS NULL
    OR (length(shopee_url) <= 300 AND shopee_url ~ '^https://shopee\.co\.id/\S+$')
  ),
  ADD CONSTRAINT product_variants_shopee_rating CHECK (
    CASE
      WHEN coalesce(shopee_rating_count, 0) = 0 THEN shopee_rating IS NULL
      ELSE shopee_rating_count > 0 AND coalesce(shopee_rating BETWEEN 1 AND 5, false)
    END
  );
