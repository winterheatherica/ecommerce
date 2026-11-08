CREATE TABLE variant_marketplace_names (
  id          bigserial   PRIMARY KEY,
  variant_id  bigint      NOT NULL REFERENCES product_variants (id) ON DELETE CASCADE,
  source      text        NOT NULL CHECK (source IN ('shopee', 'tokopedia')),
  name        text        NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 200),
  name_key    text        NOT NULL CHECK (length(name_key) BETWEEN 1 AND 200),
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT variant_marketplace_names_unik UNIQUE (variant_id, source, name_key)
);

CREATE INDEX variant_marketplace_names_cari_idx ON variant_marketplace_names (source, name_key);

ALTER TABLE variant_marketplace_names ENABLE ROW LEVEL SECURITY;

INSERT INTO variant_marketplace_names (variant_id, source, name, name_key)
SELECT variant_id, source, product_key, product_key
FROM review_product_aliases
ON CONFLICT DO NOTHING;

DROP TABLE review_product_aliases;
