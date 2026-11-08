ALTER TABLE reviews DROP CONSTRAINT reviews_impor_berteks;

CREATE TABLE review_product_aliases (
  source      text        NOT NULL CHECK (source IN ('shopee', 'tokopedia')),
  product_key text        NOT NULL CHECK (length(product_key) BETWEEN 1 AND 200),
  variant_id  bigint      NOT NULL REFERENCES product_variants (id) ON DELETE CASCADE,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (source, product_key)
);

CREATE INDEX review_product_aliases_varian_idx ON review_product_aliases (variant_id);

ALTER TABLE review_product_aliases ENABLE ROW LEVEL SECURITY;
