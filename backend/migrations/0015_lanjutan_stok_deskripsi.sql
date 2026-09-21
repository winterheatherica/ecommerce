UPDATE products AS p
SET stock = v.stock,
    description = v.description,
    is_active = true
FROM (VALUES
  ('bye-bye-mouse-spray-80ml', 4, 'Spray pengusir tikus ukuran 80 ml untuk jalur tikus di dapur, gudang, dan celah plafon. Semprotkan sampai permukaannya basah, paling baik menjelang malam saat tikus mulai aktif. Bekerja dengan aroma yang dihindari tikus, bukan racun.'),
  ('penghilang-bau-urin-kucing', 5, 'Penyerap bau kandang hewan peliharaan berbahan tanaman jarak kepyar. Mengikat senyawa bau dari kotoran dan minyak tubuh hewan supaya tidak terlepas ke udara. Buang dulu kotorannya, lalu semprotkan ke bagian kandang yang bekas. Isi 100 ml dan bisa dipakai berulang.'),
  ('gocoro-gel-kecoa-70g', 8, 'Gel pengusir kecoa dalam kemasan zip yang bisa ditutup kembali. Ambil empat sampai lima butir dan sebarkan di sumber kecoa seperti bawah wastafel, celah lemari, dan belakang kompor. Bekerja dengan aroma yang dihindari kecoa, bukan racun. Isi 70 g.'),
  ('flygo-gel-70g', 15, 'Gel pengusir lalat yang dikemas seperti pengharum ruangan dan sudah dilengkapi tali gantung. Gantung di dekat kipas atau AC, atau letakkan di tempat yang ada aliran udara. Tahan sekitar satu bulan. Isi 70 g.'),
  ('paket-bye-bye-lalat-gel-spray', 5, 'Paket pengusir lalat berisi spray 80 ml dan gel 50 g. Spray untuk disemprotkan sampai basah di tempat yang sering dikerubungi lalat, gel untuk ditebar dan bertahan empat sampai lima hari sebelum mengering. Hindari terkena makanan secara langsung.')
) AS v (slug, stock, description)
WHERE p.slug = v.slug;
