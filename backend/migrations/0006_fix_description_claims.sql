UPDATE products AS p
SET description = v.description
FROM (VALUES
  ('bye-bye-cat-50g', 'Gel pengusir kucing berbahan dasar ekstrak tumbuhan. Letakkan di teras, kap mesin motor, atau sudut yang sering dilewati kucing. Aromanya tidak disukai kucing sehingga mereka menjauh dengan sendirinya. Ukuran 50 g cocok untuk satu titik seperti teras depan atau satu sudut garasi.'),
  ('goito-gel-nyamuk', 'Gel pengusir nyamuk tanpa asap dan tanpa bakar. Cukup dibuka dan diletakkan di sudut ruangan. Tidak meninggalkan noda dan tidak perlu dinyalakan.'),
  ('bye-bye-kecoa-50gr', 'Gel pengusir kecoa untuk area dapur, bawah wastafel, dan celah lemari. Bekerja dengan aroma yang dihindari kecoa, bukan racun, jadi tidak meninggalkan bangkai yang harus dibersihkan.')
) AS v (slug, description)
WHERE p.slug = v.slug;
