UPDATE products AS p
SET name = v.name
FROM (VALUES
  ('gocat-spray-220ml', 'Bye Bye Cat Spray 220ml Pengusir Kucing'),
  ('paket-bye-bye-ular-gel-spray', 'Paket Bye Bye Snake Spray 80ml dan Gel 80g Pengusir Ular'),
  ('penghilang-bau-urin-kucing', 'SanGreat Penghilang Bau Urin Kucing dan Pasir Kandang 100ml')
) AS v (slug, name)
WHERE p.slug = v.slug;
