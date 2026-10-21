ALTER TABLE reviews
  ADD COLUMN order_id bigint REFERENCES orders (id) ON DELETE CASCADE,
  ADD COLUMN user_id bigint REFERENCES users (id) ON DELETE SET NULL,
  ADD COLUMN updated_at timestamptz,
  ADD CONSTRAINT reviews_web_dari_pesanan CHECK (source <> 'web' OR order_id IS NOT NULL);

CREATE UNIQUE INDEX reviews_web_per_barang ON reviews (order_id, variant_id) WHERE source = 'web';
