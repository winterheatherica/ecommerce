DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'xendit_invoice_id'
  ) THEN
    ALTER TABLE orders RENAME COLUMN xendit_invoice_id TO payment_reference;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'xendit_invoice_url'
  ) THEN
    ALTER TABLE orders RENAME COLUMN xendit_invoice_url TO payment_url;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'payment_channel'
  ) THEN
    ALTER TABLE orders ADD COLUMN payment_channel text;
  END IF;
END $$;
