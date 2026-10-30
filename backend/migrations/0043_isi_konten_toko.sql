INSERT INTO store_settings (
  wa_number, wa_link, address_street, address_village, address_district, address_city, address_province,
  postal_code, maps_url, open_days, opens_at, closes_at, closed_on_holidays, social_links
) VALUES (
  '6281317244671', 'https://wa.me/message/3CITYZQM7RROA1',
  'Jl. Bhayangkara I No. 76, RT 3/RW 3', 'Munjul', 'Cipayung',
  'Jakarta Timur', 'DKI Jakarta', '13850', 'https://maps.app.goo.gl/bJCzn1oBK7J1mZrS7',
  '[1,2,3,4,5,6]', '09:00', '17:00', true,
  '[{"label":"Instagram","url":"https://www.instagram.com/menikstore12"}]'
);

INSERT INTO category_groups (slug, label, title, summary, sort_order) VALUES
  ('hama', 'Pengusir hama', 'Pengusir Hama Alami', 'Pengusir kucing, tikus, kecoa, cicak, nyamuk, dan hama rumah lainnya, semuanya berbahan dasar alami dan bekerja dengan aroma.', 0),
  ('hewan', 'Hewan peliharaan', 'Kebutuhan Hewan Peliharaan', 'Spray pelatih perilaku, suplemen campuran makanan, dan penghilang bau untuk anjing dan kucing di rumah.', 1),
  ('rumah', 'Perawatan rumah', 'Perawatan Rumah dan Barang', 'Perawatan bahan kulit, pembersih sepatu, penghilang jamur dan lumut, serta pewangi ruangan.', 2),
  ('paket', 'Paket hemat', 'Paket Hemat', 'Paket berisi gel dan spray sekaligus, lebih hemat dibanding membeli terpisah.', 3);

INSERT INTO categories (slug, group_slug, label, title, seo_title, summary, complaint, sort_order) VALUES
  ('kucing', 'hama', 'Kucing', 'Pengusir Kucing', 'Pengusir Kucing Alami', 'Pengusir kucing berbahan dasar alami untuk teras, motor, dan taman. Bekerja lewat aroma yang dihindari kucing, tanpa racun dan tanpa melukai.', 'Berak di teras & motor', 0),
  ('tikus', 'hama', 'Tikus', 'Pengusir Tikus', 'Pengusir Tikus Alami', 'Pengusir tikus tanpa racun untuk plafon, gudang, dan dapur. Mengusir tikus keluar, jadi tidak ada bangkai yang membusuk di tempat sulit dijangkau.', 'Gerogoti kabel, bau plafon', 1),
  ('kecoa', 'hama', 'Kecoa', 'Pengusir Kecoa', 'Pengusir Kecoa Alami', 'Pengusir kecoa berbahan alami untuk dapur, saluran air, dan sudut lembap. Ditaruh di jalur yang biasa dilewati, bukan disemprot ke kecoanya.', 'Muncul malam di dapur', 2),
  ('cicak', 'hama', 'Cicak', 'Pengusir Cicak', 'Pengusir Cicak Alami', 'Pengusir cicak untuk dinding, plafon, dan sekitar lampu. Mengurangi kotoran cicak di rumah tanpa memakai bahan beracun.', 'Kotoran di dinding', 3),
  ('nyamuk', 'hama', 'Nyamuk', 'Pengusir Nyamuk', 'Pengusir Nyamuk Alami', 'Pengusir nyamuk untuk kamar dan ruang keluarga. Berbahan dasar alami, cocok dipakai di ruangan yang ditempati sehari-hari.', 'Gigitan malam di kamar', 4),
  ('semut', 'hama', 'Semut', 'Pengusir Semut', 'Pengusir Semut Alami', 'Pengusir semut alami untuk dapur, lemari makanan, dan jalur semut di dinding. Mengusir tanpa meninggalkan bahan beracun di dekat makanan.', 'Antri di lemari makanan', 5),
  ('lalat', 'hama', 'Lalat', 'Pengusir Lalat', 'Pengusir Lalat Alami', 'Pengusir lalat alami untuk dapur, tempat sampah, dan warung. Bekerja lewat aroma, tanpa racun dan tanpa kertas lengket yang perlu diganti terus.', 'Kerumunan dekat tempat sampah', 6),
  ('ular', 'hama', 'Ular', 'Pengusir Ular', 'Pengusir Ular Alami', 'Pengusir ular berbahan alami untuk halaman, kebun, saluran air, dan celah bawah rumah. Ditaruh di jalur masuk, bukan untuk melukai ularnya.', 'Masuk lewat kebun & selokan', 7),
  ('musang', 'hama', 'Musang', 'Pengusir Musang', 'Pengusir Musang Alami', 'Pengusir musang untuk plafon, atap, dan kandang unggas. Mengusir lewat aroma yang dihindari musang, tanpa perangkap dan tanpa melukai.', 'Berisik di plafon malam hari', 8),
  ('laba-laba', 'hama', 'Laba-laba', 'Pengusir Laba-laba', 'Pengusir Laba-laba Alami', 'Pengusir laba-laba untuk sudut plafon, gudang, dan belakang lemari. Mengurangi sarang yang terus muncul di tempat yang jarang tersentuh.', 'Sarang di sudut plafon', 9),
  ('rayap', 'hama', 'Rayap', 'Pengusir Rayap', 'Pengusir Rayap Alami', 'Pengusir rayap untuk kusen, perabot kayu, dan bagian rumah yang lembap. Disemprotkan ke area yang ingin dilindungi, bukan ke rayapnya.', 'Kusen dan perabot kayu', 10),
  ('siput', 'hama', 'Siput', 'Pengusir Siput dan Bekicot', 'Pengusir Siput dan Bekicot Alami', 'Pengusir siput dan bekicot untuk kebun, pot tanaman, dan teras yang lembap. Menjaga tanaman tanpa memakai bahan yang meracuni tanahnya.', 'Merusak tanaman di kebun', 11),
  ('kutu-kasur', 'hama', 'Kutu kasur', 'Pengusir Kutu Kasur', 'Pengusir Kutu Kasur dan Tungau', 'Untuk kasur, sofa, dan kain pelapis yang jadi sarang kutu dan tungau. Disemprotkan ke permukaan yang sering bersentuhan dengan kulit.', 'Gatal di kasur dan sofa', 12),
  ('perilaku-anjing', 'hewan', 'Perilaku anjing', 'Perilaku Anjing', 'Spray Pelatih Perilaku Anjing', 'Untuk anjing yang menggigiti perabot atau buang air sembarangan. Disemprotkan ke barang atau area yang ingin dihindari, bukan ke anjingnya.', NULL, 13),
  ('perawatan-hewan', 'hewan', 'Perawatan hewan', 'Perawatan Hewan Peliharaan', 'Suplemen dan Perawatan Hewan Peliharaan', 'Suplemen campuran makanan dan penghilang bau untuk anjing dan kucing peliharaan di rumah.', NULL, 14),
  ('perawatan-kulit', 'rumah', 'Bahan kulit', 'Perawatan Bahan Kulit', 'Pembersih dan Perawatan Bahan Kulit', 'Perawatan bahan kulit untuk jaket, tas, sepatu, dan jok. Membersihkan dan merawat tanpa membuat permukaannya kering.', NULL, 15),
  ('pembersih-rumah', 'rumah', 'Pembersih rumah', 'Pembersih Rumah', 'Pembersih Rumah dan Perabot', 'Pembersih sepatu, penghilang jamur dan lumut, serta perapi kain tanpa setrika untuk keperluan rumah sehari-hari.', NULL, 16),
  ('aroma-rumah', 'rumah', 'Aroma rumah', 'Aroma Rumah', 'Lilin Aromaterapi dan Pewangi Rumah', 'Lilin aromaterapi, minyak atsiri, dan pewangi untuk ruangan di rumah.', NULL, 17),
  ('paket', 'paket', 'Paket', 'Paket Hemat', 'Paket Hemat Gel dan Spray', 'Paket berisi gel dan spray sekaligus, untuk area yang perlu penanganan cepat sekaligus perlindungan yang bertahan lama.', NULL, 18);

INSERT INTO faq_groups (slug, title, sort_order) VALUES
  ('produk', 'Produk', 0),
  ('pemesanan-pembayaran', 'Pemesanan & Pembayaran', 1),
  ('pengiriman', 'Pengiriman', 2),
  ('pengembalian', 'Pengembalian', 3);

INSERT INTO faq_items (group_slug, question, answer, sort_order) VALUES
  ('produk', 'Aman untuk anak dan hewan peliharaan?', 'Bahan dasarnya alami dan bekerja dengan aroma yang dihindari hama, bukan racun. Tetap simpan di luar jangkauan anak kecil dan jangan sampai termakan.', 0),
  ('produk', 'Berapa lama efeknya bertahan?', 'Tergantung bentuknya. Gel gantung seperti Goito dan Flygo bertahan sekitar satu bulan. Gel yang ditebar mengering dalam 2 sampai 5 hari tergantung produknya, lalu perlu ditebar ulang. Spray disemprot lagi begitu aromanya mulai hilang. Di area terbuka, kena hujan, atau kena matahari langsung, semuanya menguap lebih cepat.', 1),
  ('produk', 'Cara pakainya bagaimana?', 'Letakkan di jalur yang biasa dilewati hama: pintu, sudut teras, celah dapur, atau dekat tempat sampah. Jangan disemprotkan langsung ke hewannya.', 2),
  ('produk', 'Kalau hamanya tetap datang bagaimana?', 'Umumnya karena titik penempatannya kurang tepat, atau jumlahnya kurang untuk luas area tersebut. Kirim foto lokasinya lewat WhatsApp, nanti kami bantu tentukan penempatannya.', 3),
  ('produk', 'Bedanya gel dan spray apa?', 'Gel bertahan lebih lama dan cocok untuk area tetap seperti sudut ruangan. Spray bekerja lebih cepat tapi lebih singkat, cocok untuk area yang sesekali saja bermasalah.', 4),
  ('pemesanan-pembayaran', 'Bagaimana cara memesan?', 'Pilih produknya, isi alamat pengiriman, lalu selesaikan pembayaran di halaman yang muncul. Tidak perlu membuat akun.', 0),
  ('pemesanan-pembayaran', 'Metode pembayaran apa saja yang diterima?', 'QRIS, yang bisa dibayar dari aplikasi m-banking atau e-wallet yang mendukung QRIS; Virtual Account BNI, BRI, Mandiri, BSI, CIMB Niaga, Permata, Danamon, BTN, dan DOKU; serta bayar tunai di kasir Indomaret atau Alfamart. Semua pilihan itu muncul di halaman pembayaran setelah checkout.', 1),
  ('pemesanan-pembayaran', 'Bisa bayar di tempat (COD)?', 'Untuk saat ini belum. Semua pesanan dibayar di muka supaya paket bisa langsung masuk antrian kirim.', 2),
  ('pengiriman', 'Kapan pesanan saya dikirim?', 'Pesanan yang dibayar sebelum pukul 12.00 dikirim hari itu juga. Setelah pukul 12.00 dikirim hari berikutnya. {libur} tidak ada pengiriman.', 0),
  ('pengiriman', 'Dikirim dari mana dan berapa lama sampai?', 'Dikirim dari {kota}. Estimasi 1 sampai 3 hari kerja untuk Pulau Jawa, dan 3 sampai 7 hari kerja untuk luar Jawa, tergantung kurir dan alamat tujuan.', 1),
  ('pengiriman', 'Ongkos kirimnya berapa?', 'Dihitung otomatis saat checkout berdasarkan alamat dan berat paket, jadi angkanya sudah pasti sebelum kamu membayar.', 2),
  ('pengiriman', 'Bisa melacak pesanan?', 'Bisa. Nomor resi dikirimkan setelah paket diserahkan ke kurir, dan status pesanan juga bisa dicek lewat halaman pesanan.', 3),
  ('pengembalian', 'Barang rusak atau salah kirim, bagaimana?', 'Rekam video saat membuka paket, lalu kirimkan ke WhatsApp kami dalam 2x24 jam sejak paket diterima. Barang akan kami ganti tanpa biaya tambahan.', 0),
  ('pengembalian', 'Bisa retur kalau berubah pikiran?', 'Setelah barang dikirim, pengembalian karena berubah pikiran tidak bisa kami terima. Kalau ragu soal ukuran atau kecocokan produk, tanyakan dulu lewat WhatsApp sebelum memesan.', 1);

ALTER TABLE products
  ADD CONSTRAINT products_category_fkey FOREIGN KEY (category) REFERENCES categories (slug);
