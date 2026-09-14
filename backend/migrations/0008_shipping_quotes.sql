CREATE TABLE IF NOT EXISTS shipping_quotes (
  dest_id    text        NOT NULL,
  weight_kg  integer     NOT NULL CHECK (weight_kg > 0),
  courier    text        NOT NULL,
  options    jsonb       NOT NULL,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (dest_id, weight_kg, courier)
);

CREATE INDEX IF NOT EXISTS shipping_quotes_umur_idx
  ON shipping_quotes (fetched_at);

ALTER TABLE shipping_quotes ENABLE ROW LEVEL SECURITY;
