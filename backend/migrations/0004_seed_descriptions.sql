UPDATE products AS p
SET description = v.description
FROM (VALUES
  ('bye-bye-cat-50g', 'Gel pengusir kucing berbahan dasar ekstrak tumbuhan. Letakkan di teras, kap mesin motor, atau sudut yang sering dilewati kucing. Aromanya tidak disukai kucing sehingga mereka menjauh dengan sendirinya, tanpa menyakiti. Ukuran 50 g cocok untuk satu titik seperti teras depan atau satu sudut garasi.'),
  ('bye-bye-cat-80g', 'Versi isi lebih banyak dari Bye Bye Cat 50 g, untuk area yang lebih luas atau beberapa titik sekaligus. Pilih ukuran ini kalau kucing datang dari lebih dari satu arah, misalnya teras depan dan belakang, atau kalau areanya terbuka sehingga aromanya lebih cepat menguap.'),
  ('goito-gel-nyamuk', 'Gel pengusir nyamuk tanpa asap dan tanpa bakar, jadi aman dipakai di ruangan tertutup seperti kamar tidur. Cukup dibuka dan diletakkan di sudut ruangan. Tidak meninggalkan noda dan tidak perlu dinyalakan, jadi bisa ditinggal saat tidur.'),
  ('sangreat-leather-jacket-cleaner', 'Pembersih sekaligus pemoles khusus jaket kulit. Mengangkat debu dan noda ringan tanpa membuat kulit kering atau retak, lalu meninggalkan lapisan pelembap agar warnanya tetap hidup. Cocok untuk perawatan rutin jaket yang jarang dipakai maupun yang sering kena panas dan hujan.'),
  ('bye-bye-kecoa-50gr', 'Gel pengusir kecoa untuk area dapur, bawah wastafel, dan celah lemari. Bekerja dengan aroma yang dihindari kecoa, bukan racun, jadi tidak meninggalkan bangkai yang harus dibersihkan dan lebih aman dipakai di sekitar tempat makanan disimpan.'),
  ('cicago-gel-cicak-70g', 'Gel pengusir cicak untuk dinding, plafon, dan sekitar lampu — tempat cicak biasa berkumpul mencari serangga. Bertahan lebih lama dibanding semprotan, jadi cocok untuk area tetap yang memang sering didatangi setiap malam.'),
  ('sangreat-leather-bag-cleaner', 'Pembersih dan pemoles untuk tas kulit. Formulanya sama lembutnya dengan versi jaket, tapi ditujukan untuk permukaan tas yang lebih sering bergesekan. Membantu menyamarkan bekas gores halus dan mengembalikan kilau tanpa membuat permukaannya licin.'),
  ('bye-bye-cicak-spray-80ml', 'Semprotan pengusir cicak yang bekerja lebih cepat daripada gel, tapi efeknya lebih singkat. Pilih ini untuk area yang hanya sesekali bermasalah, atau saat butuh mengusir cicak dari satu tempat dengan segera. Bisa dipakai berbarengan dengan gel untuk area yang sering didatangi.'),
  ('bye-bye-mouse-100gr', 'Pengusir tikus tanpa racun untuk plafon, gudang, dan belakang lemari. Karena mengusir dan bukan membunuh, tidak ada bangkai yang membusuk di tempat yang sulit dijangkau — masalah yang biasanya muncul beberapa hari setelah memakai racun tikus.'),
  ('bye-bye-cicak-gel-80gr', 'Gel pengusir cicak isi 80 g untuk rumah dengan banyak titik bermasalah sekaligus. Satu wadah bisa dibagi ke beberapa sudut, misalnya dapur, teras, dan kamar mandi, tanpa perlu membeli beberapa kemasan kecil.'),
  ('gocat-gel-refill-66g', 'Isi ulang untuk wadah GoCat yang sudah kamu punya. Pilihan paling hemat kalau sudah rutin memakai pengusir kucing dan hanya perlu mengganti isinya, bukan wadahnya.')
) AS v (slug, description)
WHERE p.slug = v.slug;
