CREATE OR REPLACE FUNCTION sinkron_produk_dari_varian()
RETURNS trigger AS $$
DECLARE
  pid bigint;
BEGIN
  pid := COALESCE(NEW.product_id, OLD.product_id);

  UPDATE products p
  SET price = COALESCE(
        (SELECT MIN(price) FROM product_variants WHERE product_id = pid AND is_active),
        p.price
      ),
      weight_g = COALESCE(
        (SELECT MIN(weight_g) FROM product_variants WHERE product_id = pid AND is_active),
        p.weight_g
      ),
      stock = COALESCE(
        (SELECT SUM(stock)::int FROM product_variants WHERE product_id = pid AND is_active),
        0
      )
  WHERE p.id = pid;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER product_variants_sinkron
  AFTER INSERT OR UPDATE OR DELETE ON product_variants
  FOR EACH ROW EXECUTE FUNCTION sinkron_produk_dari_varian();
