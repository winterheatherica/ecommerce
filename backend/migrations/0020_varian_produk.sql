CREATE TABLE product_variants (
  id         bigserial   PRIMARY KEY,
  product_id bigint      NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  slug       text        NOT NULL UNIQUE,
  label      text        NOT NULL,
  price      integer     NOT NULL CHECK (price > 0),
  weight_g   integer     NOT NULL CHECK (weight_g > 0),
  stock      integer     NOT NULL DEFAULT 0 CHECK (stock >= 0),
  sort_order integer     NOT NULL DEFAULT 0,
  is_active  boolean     NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX product_variants_product_idx ON product_variants (product_id, sort_order);

CREATE TRIGGER product_variants_set_updated_at
  BEFORE UPDATE ON product_variants
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

INSERT INTO product_variants (product_id, slug, label, price, weight_g, stock, sort_order, is_active)
SELECT p.id, p.slug, v.label, p.price, p.weight_g, p.stock, v.urut, p.is_active
FROM products p
JOIN (VALUES
  ('anti-jamur-lumut', 'Standar', 0),
  ('bye-bye-bed-bugs-spray-220ml', '220 ml', 220),
  ('bye-bye-bed-bugs-spray-80ml', '80 ml', 80),
  ('bye-bye-cat-50g', '50 g', 50),
  ('bye-bye-cat-80g', '80 g', 80),
  ('bye-bye-cat-spray-80ml', '80 ml', 80),
  ('bye-bye-cicak-gel-50gr', '50 g', 50),
  ('bye-bye-cicak-gel-80gr', '80 g', 80),
  ('bye-bye-cicak-spray-220ml', '220 ml', 220),
  ('bye-bye-cicak-spray-80ml', '80 ml', 80),
  ('bye-bye-dog-anti-chew-spray-220ml', '220 ml', 220),
  ('bye-bye-dog-anti-chew-spray-80ml', '80 ml', 80),
  ('bye-bye-dog-bad-behavior-gel-50g', '50 g', 50),
  ('bye-bye-dog-bad-behavior-gel-80g', '80 g', 80),
  ('bye-bye-dog-bad-behavior-spray-220ml', '220 ml', 220),
  ('bye-bye-dog-bad-behavior-spray-80ml', '80 ml', 80),
  ('bye-bye-kecoa-50gr', '50 g', 50),
  ('bye-bye-kecoa-gel-80gr', '80 g', 80),
  ('bye-bye-kecoa-spray-80ml', '80 ml', 80),
  ('bye-bye-lalat-gel-50g', '50 g', 50),
  ('bye-bye-lalat-spray-80ml', '80 ml', 80),
  ('bye-bye-mouse-100gr', '80 g', 80),
  ('bye-bye-mouse-gel-ekonomis', '50 g', 50),
  ('bye-bye-mouse-spray-220ml', '220 ml', 220),
  ('bye-bye-mouse-spray-80ml', '80 ml', 80),
  ('bye-bye-semut-spray-80ml', '80 ml', 80),
  ('bye-bye-snake-gel-50g', '50 g', 50),
  ('bye-bye-snake-gel-80g', '80 g', 80),
  ('bye-bye-snake-spray-220ml', '220 ml', 220),
  ('bye-bye-snake-spray-80ml', '80 ml', 80),
  ('cairan-pengusir-siput-220ml', '220 ml', 220),
  ('cairan-pengusir-siput-80ml', '80 ml', 80),
  ('cicago-gel-cicak-70g', '70 g', 70),
  ('cicago-spray-100ml', '100 ml', 100),
  ('flygo-gel-70g', '70 g', 70),
  ('flygo-spray-100ml', '100 ml', 100),
  ('foam-shoe-cleaner', 'Standar', 0),
  ('gel-pengusir-musang', '80 g', 80),
  ('gel-pengusir-musang-50g', '50 g', 50),
  ('gocat-gel-jumbo', 'Standar', 0),
  ('gocat-gel-refill-66g', '66 g', 66),
  ('gocat-spray-220ml', '220 ml', 220),
  ('gocat-spray-250ml', '250 ml', 250),
  ('gocat-spray-80ml', '80 ml', 80),
  ('gocoro-gel-kecoa-70g', '70 g', 70),
  ('gocoro-spray-100ml', '100 ml', 100),
  ('goito-gel-nyamuk', '70 g', 70),
  ('goito-spray-nyamuk-100ml', '100 ml', 100),
  ('gomouse-gel-70g', '70 g', 70),
  ('gomouse-spray-100ml', '100 ml', 100),
  ('mitigo-spray-rayap', 'Standar', 0),
  ('ogoant-gel-70g', '70 g', 70),
  ('ogoant-spray-100ml', '100 ml', 100),
  ('paket-bye-bye-dog-behaviour-chew', 'Standar', 0),
  ('paket-bye-bye-dog-gel-spray', '80 g', 80),
  ('paket-bye-bye-kecoa-gel-spray', '80 g', 80),
  ('paket-bye-bye-lalat-gel-spray', '80 ml', 80),
  ('paket-bye-bye-ular-gel-spray', '80 ml', 80),
  ('paket-cicago-gel-spray', 'Standar', 0),
  ('paket-flygo-gel-spray', '100 ml', 100),
  ('paket-gocat-gel-spray', '70 g', 70),
  ('paket-gocoro-gel-spray', 'Standar', 0),
  ('paket-goito-gel-spray', 'Standar', 0),
  ('paket-gomouse-gel-spray', 'Standar', 0),
  ('paket-hemat-3-gocat-spray', 'Standar', 0),
  ('paket-ogoant-gel-spray', '100 ml', 100),
  ('paket-pengusir-kucing', 'Standar', 0),
  ('penghilang-bau-urin-kucing', '100 ml', 100),
  ('sangreat-car-seat-cleaner', 'Standar', 0),
  ('sangreat-leather-bag-cleaner', 'Standar', 0),
  ('sangreat-leather-jacket-cleaner', 'Standar', 0),
  ('sangreat-leather-shoe-cleaner', 'Standar', 0),
  ('soy-candle-aromaterapi', 'Standar', 0),
  ('spray-anti-kusut', 'Standar', 0),
  ('spray-pengusir-laba-laba-220ml', '220 ml', 220),
  ('spray-pengusir-laba-laba-80ml', '80 ml', 80),
  ('spray-pengusir-musang-220ml', '220 ml', 220),
  ('spray-pengusir-musang-80ml', '80 ml', 80)
) AS v (slug, label, urut) ON v.slug = p.slug;

ALTER TABLE order_items ADD COLUMN variant_id bigint REFERENCES product_variants (id);

UPDATE order_items oi
SET variant_id = pv.id
FROM products p
JOIN product_variants pv ON pv.slug = p.slug
WHERE oi.product_id = p.id;

-- Bye Bye Cat Gel Pengusir Kucing
UPDATE product_variants SET product_id = (SELECT id FROM products WHERE slug = 'bye-bye-cat-50g') WHERE product_id = (SELECT id FROM products WHERE slug = 'bye-bye-cat-80g');
UPDATE order_items SET product_id = (SELECT id FROM products WHERE slug = 'bye-bye-cat-50g') WHERE product_id = (SELECT id FROM products WHERE slug = 'bye-bye-cat-80g');
DELETE FROM products WHERE slug = 'bye-bye-cat-80g';
UPDATE products SET slug = 'bye-bye-cat-gel', name = 'Bye Bye Cat Gel Pengusir Kucing' WHERE slug = 'bye-bye-cat-50g';

-- Bye Bye Cat Spray Pengusir Kucing
UPDATE product_variants SET product_id = (SELECT id FROM products WHERE slug = 'bye-bye-cat-spray-80ml') WHERE product_id = (SELECT id FROM products WHERE slug = 'gocat-spray-220ml');
UPDATE order_items SET product_id = (SELECT id FROM products WHERE slug = 'bye-bye-cat-spray-80ml') WHERE product_id = (SELECT id FROM products WHERE slug = 'gocat-spray-220ml');
DELETE FROM products WHERE slug = 'gocat-spray-220ml';
UPDATE products SET slug = 'bye-bye-cat-spray', name = 'Bye Bye Cat Spray Pengusir Kucing' WHERE slug = 'bye-bye-cat-spray-80ml';

-- GoCat Spray Pengusir Kucing
UPDATE product_variants SET product_id = (SELECT id FROM products WHERE slug = 'gocat-spray-80ml') WHERE product_id = (SELECT id FROM products WHERE slug = 'gocat-spray-250ml');
UPDATE order_items SET product_id = (SELECT id FROM products WHERE slug = 'gocat-spray-80ml') WHERE product_id = (SELECT id FROM products WHERE slug = 'gocat-spray-250ml');
DELETE FROM products WHERE slug = 'gocat-spray-250ml';
UPDATE products SET slug = 'gocat-spray', name = 'GoCat Spray Pengusir Kucing' WHERE slug = 'gocat-spray-80ml';

-- Bye Bye Cicak Gel Pengusir Cicak
UPDATE product_variants SET product_id = (SELECT id FROM products WHERE slug = 'bye-bye-cicak-gel-50gr') WHERE product_id = (SELECT id FROM products WHERE slug = 'bye-bye-cicak-gel-80gr');
UPDATE order_items SET product_id = (SELECT id FROM products WHERE slug = 'bye-bye-cicak-gel-50gr') WHERE product_id = (SELECT id FROM products WHERE slug = 'bye-bye-cicak-gel-80gr');
DELETE FROM products WHERE slug = 'bye-bye-cicak-gel-80gr';
UPDATE products SET slug = 'bye-bye-cicak-gel', name = 'Bye Bye Cicak Gel Pengusir Cicak' WHERE slug = 'bye-bye-cicak-gel-50gr';

-- Bye Bye Cicak Spray Pengusir Cicak
UPDATE product_variants SET product_id = (SELECT id FROM products WHERE slug = 'bye-bye-cicak-spray-80ml') WHERE product_id = (SELECT id FROM products WHERE slug = 'bye-bye-cicak-spray-220ml');
UPDATE order_items SET product_id = (SELECT id FROM products WHERE slug = 'bye-bye-cicak-spray-80ml') WHERE product_id = (SELECT id FROM products WHERE slug = 'bye-bye-cicak-spray-220ml');
DELETE FROM products WHERE slug = 'bye-bye-cicak-spray-220ml';
UPDATE products SET slug = 'bye-bye-cicak-spray', name = 'Bye Bye Cicak Spray Pengusir Cicak' WHERE slug = 'bye-bye-cicak-spray-80ml';

-- Bye Bye Kecoa Gel Pengusir Kecoa
UPDATE product_variants SET product_id = (SELECT id FROM products WHERE slug = 'bye-bye-kecoa-50gr') WHERE product_id = (SELECT id FROM products WHERE slug = 'bye-bye-kecoa-gel-80gr');
UPDATE order_items SET product_id = (SELECT id FROM products WHERE slug = 'bye-bye-kecoa-50gr') WHERE product_id = (SELECT id FROM products WHERE slug = 'bye-bye-kecoa-gel-80gr');
DELETE FROM products WHERE slug = 'bye-bye-kecoa-gel-80gr';
UPDATE products SET slug = 'bye-bye-kecoa-gel', name = 'Bye Bye Kecoa Gel Pengusir Kecoa' WHERE slug = 'bye-bye-kecoa-50gr';

-- Bye Bye Mouse Gel Pengusir Tikus
UPDATE product_variants SET product_id = (SELECT id FROM products WHERE slug = 'bye-bye-mouse-gel-ekonomis') WHERE product_id = (SELECT id FROM products WHERE slug = 'bye-bye-mouse-100gr');
UPDATE order_items SET product_id = (SELECT id FROM products WHERE slug = 'bye-bye-mouse-gel-ekonomis') WHERE product_id = (SELECT id FROM products WHERE slug = 'bye-bye-mouse-100gr');
DELETE FROM products WHERE slug = 'bye-bye-mouse-100gr';
UPDATE products SET slug = 'bye-bye-mouse-gel', name = 'Bye Bye Mouse Gel Pengusir Tikus' WHERE slug = 'bye-bye-mouse-gel-ekonomis';

-- Bye Bye Mouse Spray Pengusir Tikus
UPDATE product_variants SET product_id = (SELECT id FROM products WHERE slug = 'bye-bye-mouse-spray-80ml') WHERE product_id = (SELECT id FROM products WHERE slug = 'bye-bye-mouse-spray-220ml');
UPDATE order_items SET product_id = (SELECT id FROM products WHERE slug = 'bye-bye-mouse-spray-80ml') WHERE product_id = (SELECT id FROM products WHERE slug = 'bye-bye-mouse-spray-220ml');
DELETE FROM products WHERE slug = 'bye-bye-mouse-spray-220ml';
UPDATE products SET slug = 'bye-bye-mouse-spray', name = 'Bye Bye Mouse Spray Pengusir Tikus' WHERE slug = 'bye-bye-mouse-spray-80ml';

-- Bye Bye Snake Gel Pengusir Ular
UPDATE product_variants SET product_id = (SELECT id FROM products WHERE slug = 'bye-bye-snake-gel-50g') WHERE product_id = (SELECT id FROM products WHERE slug = 'bye-bye-snake-gel-80g');
UPDATE order_items SET product_id = (SELECT id FROM products WHERE slug = 'bye-bye-snake-gel-50g') WHERE product_id = (SELECT id FROM products WHERE slug = 'bye-bye-snake-gel-80g');
DELETE FROM products WHERE slug = 'bye-bye-snake-gel-80g';
UPDATE products SET slug = 'bye-bye-snake-gel', name = 'Bye Bye Snake Gel Pengusir Ular' WHERE slug = 'bye-bye-snake-gel-50g';

-- Bye Bye Snake Spray Pengusir Ular
UPDATE product_variants SET product_id = (SELECT id FROM products WHERE slug = 'bye-bye-snake-spray-80ml') WHERE product_id = (SELECT id FROM products WHERE slug = 'bye-bye-snake-spray-220ml');
UPDATE order_items SET product_id = (SELECT id FROM products WHERE slug = 'bye-bye-snake-spray-80ml') WHERE product_id = (SELECT id FROM products WHERE slug = 'bye-bye-snake-spray-220ml');
DELETE FROM products WHERE slug = 'bye-bye-snake-spray-220ml';
UPDATE products SET slug = 'bye-bye-snake-spray', name = 'Bye Bye Snake Spray Pengusir Ular' WHERE slug = 'bye-bye-snake-spray-80ml';

-- Gel Pengusir Musang
UPDATE product_variants SET product_id = (SELECT id FROM products WHERE slug = 'gel-pengusir-musang-50g') WHERE product_id = (SELECT id FROM products WHERE slug = 'gel-pengusir-musang');
UPDATE order_items SET product_id = (SELECT id FROM products WHERE slug = 'gel-pengusir-musang-50g') WHERE product_id = (SELECT id FROM products WHERE slug = 'gel-pengusir-musang');
DELETE FROM products WHERE slug = 'gel-pengusir-musang';
UPDATE products SET slug = 'gel-pengusir-musang', name = 'Gel Pengusir Musang' WHERE slug = 'gel-pengusir-musang-50g';

-- Spray Pengusir Musang
UPDATE product_variants SET product_id = (SELECT id FROM products WHERE slug = 'spray-pengusir-musang-80ml') WHERE product_id = (SELECT id FROM products WHERE slug = 'spray-pengusir-musang-220ml');
UPDATE order_items SET product_id = (SELECT id FROM products WHERE slug = 'spray-pengusir-musang-80ml') WHERE product_id = (SELECT id FROM products WHERE slug = 'spray-pengusir-musang-220ml');
DELETE FROM products WHERE slug = 'spray-pengusir-musang-220ml';
UPDATE products SET slug = 'spray-pengusir-musang', name = 'Spray Pengusir Musang' WHERE slug = 'spray-pengusir-musang-80ml';

-- Spray Pengusir Laba-laba
UPDATE product_variants SET product_id = (SELECT id FROM products WHERE slug = 'spray-pengusir-laba-laba-80ml') WHERE product_id = (SELECT id FROM products WHERE slug = 'spray-pengusir-laba-laba-220ml');
UPDATE order_items SET product_id = (SELECT id FROM products WHERE slug = 'spray-pengusir-laba-laba-80ml') WHERE product_id = (SELECT id FROM products WHERE slug = 'spray-pengusir-laba-laba-220ml');
DELETE FROM products WHERE slug = 'spray-pengusir-laba-laba-220ml';
UPDATE products SET slug = 'spray-pengusir-laba-laba', name = 'Spray Pengusir Laba-laba' WHERE slug = 'spray-pengusir-laba-laba-80ml';

-- Cairan Pengusir Siput dan Bekicot
UPDATE product_variants SET product_id = (SELECT id FROM products WHERE slug = 'cairan-pengusir-siput-80ml') WHERE product_id = (SELECT id FROM products WHERE slug = 'cairan-pengusir-siput-220ml');
UPDATE order_items SET product_id = (SELECT id FROM products WHERE slug = 'cairan-pengusir-siput-80ml') WHERE product_id = (SELECT id FROM products WHERE slug = 'cairan-pengusir-siput-220ml');
DELETE FROM products WHERE slug = 'cairan-pengusir-siput-220ml';
UPDATE products SET slug = 'cairan-pengusir-siput', name = 'Cairan Pengusir Siput dan Bekicot' WHERE slug = 'cairan-pengusir-siput-80ml';

-- Bye Bye Bed Bugs Anti Kutu dan Tungau
UPDATE product_variants SET product_id = (SELECT id FROM products WHERE slug = 'bye-bye-bed-bugs-spray-80ml') WHERE product_id = (SELECT id FROM products WHERE slug = 'bye-bye-bed-bugs-spray-220ml');
UPDATE order_items SET product_id = (SELECT id FROM products WHERE slug = 'bye-bye-bed-bugs-spray-80ml') WHERE product_id = (SELECT id FROM products WHERE slug = 'bye-bye-bed-bugs-spray-220ml');
DELETE FROM products WHERE slug = 'bye-bye-bed-bugs-spray-220ml';
UPDATE products SET slug = 'bye-bye-bed-bugs', name = 'Bye Bye Bed Bugs Anti Kutu dan Tungau' WHERE slug = 'bye-bye-bed-bugs-spray-80ml';

-- Bye Bye Dog Bad Behavior Gel
UPDATE product_variants SET product_id = (SELECT id FROM products WHERE slug = 'bye-bye-dog-bad-behavior-gel-50g') WHERE product_id = (SELECT id FROM products WHERE slug = 'bye-bye-dog-bad-behavior-gel-80g');
UPDATE order_items SET product_id = (SELECT id FROM products WHERE slug = 'bye-bye-dog-bad-behavior-gel-50g') WHERE product_id = (SELECT id FROM products WHERE slug = 'bye-bye-dog-bad-behavior-gel-80g');
DELETE FROM products WHERE slug = 'bye-bye-dog-bad-behavior-gel-80g';
UPDATE products SET slug = 'bye-bye-dog-gel', name = 'Bye Bye Dog Bad Behavior Gel' WHERE slug = 'bye-bye-dog-bad-behavior-gel-50g';

-- Bye Bye Dog Bad Behavior Spray
UPDATE product_variants SET product_id = (SELECT id FROM products WHERE slug = 'bye-bye-dog-bad-behavior-spray-80ml') WHERE product_id = (SELECT id FROM products WHERE slug = 'bye-bye-dog-bad-behavior-spray-220ml');
UPDATE order_items SET product_id = (SELECT id FROM products WHERE slug = 'bye-bye-dog-bad-behavior-spray-80ml') WHERE product_id = (SELECT id FROM products WHERE slug = 'bye-bye-dog-bad-behavior-spray-220ml');
DELETE FROM products WHERE slug = 'bye-bye-dog-bad-behavior-spray-220ml';
UPDATE products SET slug = 'bye-bye-dog-spray', name = 'Bye Bye Dog Bad Behavior Spray' WHERE slug = 'bye-bye-dog-bad-behavior-spray-80ml';

-- Bye Bye Dog Anti Chew Spray
UPDATE product_variants SET product_id = (SELECT id FROM products WHERE slug = 'bye-bye-dog-anti-chew-spray-80ml') WHERE product_id = (SELECT id FROM products WHERE slug = 'bye-bye-dog-anti-chew-spray-220ml');
UPDATE order_items SET product_id = (SELECT id FROM products WHERE slug = 'bye-bye-dog-anti-chew-spray-80ml') WHERE product_id = (SELECT id FROM products WHERE slug = 'bye-bye-dog-anti-chew-spray-220ml');
DELETE FROM products WHERE slug = 'bye-bye-dog-anti-chew-spray-220ml';
UPDATE products SET slug = 'bye-bye-dog-anti-chew', name = 'Bye Bye Dog Anti Chew Spray' WHERE slug = 'bye-bye-dog-anti-chew-spray-80ml';

UPDATE products p
SET price = x.harga, stock = x.stok, weight_g = x.berat
FROM (
  SELECT product_id, MIN(price) AS harga, SUM(stock)::int AS stok, MIN(weight_g) AS berat
  FROM product_variants GROUP BY product_id
) x
WHERE p.id = x.product_id;

ALTER TABLE order_items ALTER COLUMN variant_id SET NOT NULL;
CREATE INDEX order_items_variant_idx ON order_items (variant_id);
