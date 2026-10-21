INSERT INTO products
  (slug, name, description, usage_instructions, price, weight_g, stock, category, is_featured, sold_per_month, sort_order, is_active)
VALUES
  (
    'bye-bye-nyamuk-gel',
    'Bye Bye Nyamuk Gel Pengusir Nyamuk',
    'Gel pengusir nyamuk berbahan dasar minyak atsiri, tanpa asap dan tanpa perlu dibakar. Gelnya dikeluarkan dari wadah lalu digantung di kipas angin atau AC, supaya aromanya menyebar ke seluruh ruangan.',
    E'Keluarkan gel dari wadahnya.\nGantung di kipas angin atau AC.\nGanti dengan yang baru setelah 4 sampai 5 hari, atau saat nyamuk mulai datang lagi.\nKalau terkena mata, segera bilas dengan air mengalir.\nCatatan:\nEfeknya bisa berbeda untuk setiap nyamuk dan lingkungan.',
    29000, 50, 0, 'nyamuk', false, 0, 174, false
  ),
  (
    'bye-bye-nyamuk-spray',
    'Bye Bye Nyamuk Spray Pengusir Nyamuk',
    'Semprotan pengusir nyamuk berbahan dasar minyak atsiri, untuk kamar, ruang keluarga, kantor, atau sekolah. Disemprotkan ke tempat yang banyak nyamuknya. Tersedia ukuran 80 ml dan 220 ml.',
    E'Semprotkan ke tempat yang banyak nyamuknya.\nSemprot sampai permukaannya basah.\nBisa juga disemprotkan langsung ke nyamuk.\nKalau terkena mata, segera bilas dengan air mengalir.\nCatatan:\nEfeknya bisa berbeda untuk setiap nyamuk dan lingkungan.',
    39000, 90, 0, 'nyamuk', false, 0, 175, false
  ),
  (
    'bye-bye-rayap-spray',
    'Bye Bye Rayap Spray Pengusir Rayap',
    'Spray pengusir rayap berbahan dasar campuran minyak atsiri, untuk kusen, perabot kayu, dan bagian rumah yang rawan didatangi rayap tanah, rayap kayu kering, maupun rayap kayu lembap. Tersedia ukuran 80 ml dan 220 ml.',
    E'Kocok dulu sebelum dipakai.\nSemprotkan secukupnya ke tempat yang ingin dilindungi.\nSemprot lagi kalau aromanya sudah tidak tercium.\nPakai secara rutin di area yang sama.\nJauhkan dari jangkauan anak-anak. Kalau terkena mata, bilas dengan air.',
    39000, 90, 0, 'rayap', false, 0, 176, false
  ),
  (
    'ertwo-essential-oil',
    'ERTWO Essential Oil Minyak Atsiri',
    'Minyak atsiri (essential oil) ERTWO untuk mewangikan ruangan lewat diffuser atau tungku aromaterapi. Tersedia aroma peppermint, lemongrass, eucalyptus, lavender, citronella, dan cajuput, dalam ukuran 10 ml dan 30 ml.',
    E'Teteskan 3 sampai 4 tetes ke air di diffuser atau tungku aromaterapi.\nBiarkan aromanya menyebar di ruangan.\nJangan dioleskan langsung ke kulit tanpa diencerkan.\nJauhkan dari jangkauan anak-anak.',
    8000, 15, 0, 'aroma-rumah', false, 0, 177, false
  ),
  (
    'ertwo-room-spray-relaxing',
    'ERTWO Relaxing Room Spray Pewangi Ruangan',
    'Pewangi ruangan varian Relaxing dari ERTWO, berbahan dasar air dengan campuran minyak atsiri lavender, geranium, dan citronella. Bisa disemprotkan ke kamar, kamar mandi, sofa, gorden, pakaian, atau mobil. Isi 100 ml.',
    'Semprotkan ke ruangan atau ke permukaan kain seperti sofa, gorden, bantal, dan selimut.',
    20000, 110, 0, 'aroma-rumah', false, 0, 178, false
  )
ON CONFLICT (slug) DO NOTHING;

INSERT INTO product_variants
  (product_id, slug, label, price, weight_g, stock, sort_order, is_active,
   package_weight_g, package_length_cm, package_width_cm, package_height_cm)
SELECT p.id, v.slug, v.label, v.price, v.weight_g, 0, v.urut, true, v.paket_g, v.panjang, v.lebar, v.tinggi
FROM (
  VALUES
    ('bye-bye-nyamuk-gel', 'bye-bye-nyamuk-gel', 'Standar', 29000, 50, 0, 150, 18, 8, 6),
    ('bye-bye-nyamuk-spray', 'bye-bye-nyamuk-spray-80ml', '80 ml', 39000, 90, 80, 150, 18, 8, 6),
    ('bye-bye-nyamuk-spray', 'bye-bye-nyamuk-spray-220ml', '220 ml', 94000, 240, 220, 400, 7, 7, 22),
    ('bye-bye-rayap-spray', 'bye-bye-rayap-spray-80ml', '80 ml', 39000, 90, 80, 150, 18, 8, 6),
    ('bye-bye-rayap-spray', 'bye-bye-rayap-spray-220ml', '220 ml', 94000, 240, 220, 400, 7, 7, 22),
    ('ertwo-essential-oil', 'ertwo-peppermint-10ml', 'Peppermint 10 ml', 24500, 15, 1, 150, 18, 8, 6),
    ('ertwo-essential-oil', 'ertwo-lemongrass-10ml', 'Lemongrass 10 ml', 19500, 15, 2, 150, 18, 8, 6),
    ('ertwo-essential-oil', 'ertwo-eucalyptus-10ml', 'Eucalyptus 10 ml', 8000, 15, 3, 150, 18, 8, 6),
    ('ertwo-essential-oil', 'ertwo-lavender-10ml', 'Lavender 10 ml', 32000, 15, 4, 150, 18, 8, 6),
    ('ertwo-essential-oil', 'ertwo-lavender-30ml', 'Lavender 30 ml', 87000, 35, 5, 150, 18, 8, 6),
    ('ertwo-essential-oil', 'ertwo-lemongrass-30ml', 'Lemongrass 30 ml', 60000, 35, 6, 150, 18, 8, 6),
    ('ertwo-essential-oil', 'ertwo-citronella-30ml', 'Citronella 30 ml', 12000, 35, 7, 150, 18, 8, 6),
    ('ertwo-essential-oil', 'ertwo-cajuput-30ml', 'Cajuput 30 ml', 27500, 35, 8, 150, 18, 8, 6),
    ('ertwo-room-spray-relaxing', 'ertwo-room-spray-relaxing', '100 ml', 20000, 110, 0, 150, 18, 8, 6)
) AS v (produk, slug, label, price, weight_g, urut, paket_g, panjang, lebar, tinggi)
JOIN products p ON p.slug = v.produk
ON CONFLICT (slug) DO NOTHING;
