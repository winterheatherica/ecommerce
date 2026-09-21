UPDATE products AS p
SET stock = v.stock,
    description = v.description,
    is_active = true
FROM (VALUES
  ('bye-bye-kecoa-gel-80gr', 27, 'Gel pengusir kecoa ukuran 80 g untuk dapur, bawah wastafel, dan celah lemari. Sebarkan dengan jarak lima sampai sepuluh sentimeter, paling baik menjelang malam saat kecoa aktif. Gel mengering dalam tiga sampai lima hari, lalu bisa disebar ulang. Bekerja dengan aroma yang dihindari kecoa, bukan racun.'),
  ('bye-bye-lalat-spray-80ml', 5, 'Spray pengusir lalat untuk tempat sampah, dapur, dan area makan. Semprotkan sampai basah supaya aromanya bertahan lebih lama. Hindari mengenai makanan secara langsung, dan bilas dengan air mengalir jika terkena mata. Isi 80 ml.'),
  ('flygo-spray-100ml', 9, 'Spray pengusir lalat isi 100 ml untuk ruangan atau permukaan yang sering dilewati lalat. Kocok dulu sebelum dipakai, lalu semprotkan secukupnya. Cocok untuk rumah makan dan dapur yang perlu disemprot rutin.')
) AS v (slug, stock, description)
WHERE p.slug = v.slug;
