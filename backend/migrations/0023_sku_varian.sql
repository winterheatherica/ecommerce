ALTER TABLE product_variants ADD COLUMN sku text;

WITH urut AS (
  SELECT
    v.id,
    row_number() OVER (ORDER BY p.sort_order, p.id, v.sort_order, v.id) AS n
  FROM product_variants v
  JOIN products p ON p.id = v.product_id
)
UPDATE product_variants v
SET sku = lpad(urut.n::text, greatest(length(urut.n::text), 3), '0')
FROM urut
WHERE urut.id = v.id;

CREATE SEQUENCE product_variants_sku_seq OWNED BY product_variants.sku;

SELECT setval(
  'product_variants_sku_seq',
  greatest((SELECT count(*) FROM product_variants), 1),
  (SELECT count(*) FROM product_variants) > 0
);

CREATE FUNCTION sku_varian_berikutnya()
RETURNS text AS $$
  SELECT lpad(n::text, greatest(length(n::text), 3), '0')
  FROM (SELECT nextval('product_variants_sku_seq') AS n) s
$$ LANGUAGE sql VOLATILE;

ALTER TABLE product_variants
  ALTER COLUMN sku SET DEFAULT sku_varian_berikutnya(),
  ALTER COLUMN sku SET NOT NULL,
  ADD CONSTRAINT product_variants_sku_key UNIQUE (sku);
