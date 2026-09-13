CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE products (
  id          bigserial PRIMARY KEY,
  slug        text        NOT NULL UNIQUE,
  name        text        NOT NULL,
  description text,
  price       integer     NOT NULL CHECK (price > 0),
  weight_g    integer     NOT NULL CHECK (weight_g > 0),
  stock       integer     NOT NULL DEFAULT 0 CHECK (stock >= 0),
  category    text        NOT NULL,
  is_featured boolean     NOT NULL DEFAULT false,
  sold_per_month integer  NOT NULL DEFAULT 0 CHECK (sold_per_month >= 0),
  sort_order  integer     NOT NULL DEFAULT 0,
  is_active   boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX products_category_idx ON products (category) WHERE is_active;
CREATE INDEX products_featured_idx ON products (is_featured, sort_order) WHERE is_active;

CREATE TRIGGER products_set_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE product_images (
  id            bigserial PRIMARY KEY,
  product_id    bigint      NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  cloudinary_id text        NOT NULL,
  alt           text,
  sort_order    integer     NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX product_images_product_idx ON product_images (product_id, sort_order);

CREATE TABLE regions (
  id          text PRIMARY KEY,
  province    text NOT NULL,
  city        text NOT NULL,
  district    text NOT NULL,
  postal_code text,
  label       text NOT NULL
);

CREATE INDEX regions_label_trgm_idx ON regions USING gin (label gin_trgm_ops);

CREATE TABLE orders (
  id                 bigserial PRIMARY KEY,
  order_no           text        NOT NULL UNIQUE,

  customer_name      text        NOT NULL,
  phone              text        NOT NULL,
  email              text,
  address            text        NOT NULL,
  notes              text,

  dest_id            text        NOT NULL REFERENCES regions (id),
  courier            text        NOT NULL,
  service            text        NOT NULL,
  etd                text,
  weight_g           integer     NOT NULL CHECK (weight_g > 0),

  subtotal           integer     NOT NULL CHECK (subtotal >= 0),
  shipping_cost      integer     NOT NULL CHECK (shipping_cost >= 0),
  total              integer     NOT NULL CHECK (total >= 0),

  status             text        NOT NULL DEFAULT 'PENDING'
                     CHECK (status IN ('PENDING','PAID','SHIPPED','DELIVERED','EXPIRED','CANCELLED')),

  xendit_invoice_id  text UNIQUE,
  xendit_invoice_url text,
  payment_method     text,
  expires_at         timestamptz,
  paid_at            timestamptz,

  tracking_number    text,
  shipped_at         timestamptz,

  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX orders_status_created_idx ON orders (status, created_at DESC);
CREATE INDEX orders_phone_idx ON orders (phone);

CREATE TRIGGER orders_set_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE order_items (
  id             bigserial PRIMARY KEY,
  order_id       bigint  NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  product_id     bigint  NOT NULL REFERENCES products (id),
  qty            integer NOT NULL CHECK (qty > 0),
  price_snapshot integer NOT NULL CHECK (price_snapshot > 0),
  name_snapshot  text    NOT NULL
);

CREATE INDEX order_items_order_idx ON order_items (order_id);

CREATE TABLE webhook_events (
  id          bigserial PRIMARY KEY,
  provider    text        NOT NULL,
  external_id text,
  event_type  text,
  payload     jsonb       NOT NULL,
  processed   boolean     NOT NULL DEFAULT false,
  received_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX webhook_events_external_idx ON webhook_events (provider, external_id);
