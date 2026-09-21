UPDATE products SET price =  40000 WHERE slug = 'goito-spray-nyamuk-100ml';
UPDATE products SET price =  70000 WHERE slug = 'paket-goito-gel-spray';
UPDATE products SET price =  90000 WHERE slug = 'paket-gocat-gel-spray';
UPDATE products SET price =  65000 WHERE slug = 'spray-pengusir-musang-80ml';

UPDATE products
SET name = 'Bye Bye Mouse 80gr Pengusir Tikus Non-Pestisida', weight_g = 80
WHERE slug = 'bye-bye-mouse-100gr';

UPDATE products
SET name = 'Goito Gel 70g Pengusir Nyamuk Alami', weight_g = 70
WHERE slug = 'goito-gel-nyamuk';

UPDATE products
SET name = 'Gel Pengusir Musang 80g'
WHERE slug = 'gel-pengusir-musang';

UPDATE products
SET name = 'SanGreat Leather Sofa dan Car Seat Cleaner'
WHERE slug = 'sangreat-car-seat-cleaner';

INSERT INTO products (slug, name, price, weight_g, stock, category, is_featured, sort_order, sold_per_month, is_active) VALUES
  ('bye-bye-cicak-gel-50gr',       'Bye Bye Cicak Gel 50gr Pengusir Cicak Non-Pestisida',  56000,  50, 0, 'cicak',  false, 171, 0, false),
  ('bye-bye-kecoa-gel-80gr',       'Bye Bye Kecoa Gel 80gr Pengusir Kecoa Natural',        64000,  80, 0, 'kecoa',  false, 172, 0, false),
  ('gel-pengusir-musang-50g',      'Gel Pengusir Musang 50g',                              64000,  50, 0, 'musang', false, 173, 0, false),
  ('spray-pengusir-musang-220ml',  'Spray Pengusir Musang 220ml',                         119000, 240, 0, 'musang', false, 174, 0, false)
ON CONFLICT (slug) DO NOTHING;

DELETE FROM products WHERE slug = 'bye-bye-mouse-gel-non-racun';
