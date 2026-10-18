ALTER TABLE products
  ADD COLUMN usage_instructions text,
  ADD CONSTRAINT products_cara_pakai_panjang
    CHECK (usage_instructions IS NULL OR char_length(usage_instructions) BETWEEN 1 AND 4000);
