CREATE TABLE reviews (
  id bigserial PRIMARY KEY,
  variant_id bigint NOT NULL REFERENCES product_variants (id) ON DELETE CASCADE,
  source text NOT NULL CHECK (source IN ('shopee', 'web')),
  external_id text,
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  author_name text NOT NULL CHECK (length(btrim(author_name)) BETWEEN 1 AND 60),
  body text CHECK (body IS NULL OR length(btrim(body)) BETWEEN 1 AND 3000),
  follow_up text CHECK (follow_up IS NULL OR length(btrim(follow_up)) BETWEEN 1 AND 3000),
  follow_up_at timestamptz,
  reviewed_at timestamptz NOT NULL,
  is_hidden boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reviews_shopee_berteks CHECK (
    source <> 'shopee' OR body IS NOT NULL OR follow_up IS NOT NULL
  ),
  CONSTRAINT reviews_external_unik UNIQUE (source, external_id)
);

CREATE INDEX reviews_variant_idx ON reviews (variant_id, reviewed_at DESC);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
