ALTER TABLE products
  ADD COLUMN brand text
    CONSTRAINT products_merek CHECK (
      brand IS NULL OR (length(brand) BETWEEN 1 AND 70 AND brand = btrim(brand))
    );
