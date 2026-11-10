CREATE TABLE IF NOT EXISTS shipping_rates (
  dest_id    text        NOT NULL,
  weight_g   integer     NOT NULL CHECK (weight_g > 0),
  courier    text        NOT NULL,
  options    jsonb       NOT NULL,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (dest_id, weight_g, courier)
);

CREATE INDEX IF NOT EXISTS shipping_rates_umur_idx
  ON shipping_rates (fetched_at);

ALTER TABLE shipping_rates ENABLE ROW LEVEL SECURITY;

INSERT INTO shipping_rates (dest_id, weight_g, courier, options, fetched_at)
SELECT dest_id, 1000, courier, options, fetched_at
FROM shipping_quotes
WHERE weight_kg = 1
ON CONFLICT DO NOTHING;
