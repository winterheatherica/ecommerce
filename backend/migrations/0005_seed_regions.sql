INSERT INTO regions (id, province, city, district, postal_code, label) VALUES
  ('50001', 'Jawa Barat', 'Kota Bandung', 'Coblong', '40132', 'Coblong, Kota Bandung, Jawa Barat'),
  ('50002', 'Jawa Barat', 'Kota Bandung', 'Cicendo', '40172', 'Cicendo, Kota Bandung, Jawa Barat'),
  ('50003', 'Jawa Barat', 'Kota Bekasi', 'Bekasi Selatan', '17141', 'Bekasi Selatan, Kota Bekasi, Jawa Barat'),
  ('50004', 'DKI Jakarta', 'Jakarta Selatan', 'Cilandak', '12430', 'Cilandak, Jakarta Selatan, DKI Jakarta'),
  ('50005', 'DKI Jakarta', 'Jakarta Pusat', 'Menteng', '10310', 'Menteng, Jakarta Pusat, DKI Jakarta'),
  ('50006', 'Jawa Tengah', 'Kota Semarang', 'Semarang Tengah', '50139', 'Semarang Tengah, Kota Semarang, Jawa Tengah'),
  ('50007', 'DI Yogyakarta', 'Sleman', 'Depok', '55281', 'Depok, Sleman, DI Yogyakarta'),
  ('50008', 'Jawa Timur', 'Kota Surabaya', 'Genteng', '60271', 'Genteng, Kota Surabaya, Jawa Timur'),
  ('50009', 'Jawa Timur', 'Kota Malang', 'Klojen', '65119', 'Klojen, Kota Malang, Jawa Timur'),
  ('50010', 'Bali', 'Kota Denpasar', 'Denpasar Barat', '80119', 'Denpasar Barat, Kota Denpasar, Bali'),
  ('50011', 'Sumatera Utara', 'Kota Medan', 'Medan Kota', '20212', 'Medan Kota, Kota Medan, Sumatera Utara'),
  ('50012', 'Sulawesi Selatan', 'Kota Makassar', 'Panakkukang', '90231', 'Panakkukang, Kota Makassar, Sulawesi Selatan')
ON CONFLICT (id) DO NOTHING;
