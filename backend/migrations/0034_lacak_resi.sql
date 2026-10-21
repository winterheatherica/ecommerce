ALTER TABLE orders
  ADD COLUMN tracking jsonb,
  ADD COLUMN tracking_checked_at timestamptz,
  ADD COLUMN tracking_error text,
  ADD COLUMN delivered_at timestamptz,
  ADD CONSTRAINT orders_tracking_objek CHECK (tracking IS NULL OR jsonb_typeof(tracking) = 'object');
