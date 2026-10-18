UPDATE products SET usage_instructions = $$Sebarkan beberapa butir gel di tempat yang sering didatangi kucing, dengan jarak 5-10 cm antarbutir.
Sesuaikan jumlah gel dengan luas area.
Gel akan mengering setelah 4-5 hari. Sebar lagi setelah gel sebelumnya mengering, ulangi sampai 2-3 kali.
Gel bisa dipakai di dalam maupun di luar ruangan.
Catatan:
Efeknya bisa berbeda untuk setiap kucing.$$
WHERE slug = 'bye-bye-cat-gel' AND usage_instructions IS NULL;

UPDATE products SET usage_instructions = $$Semprot sampai basah di tempat yang sering didatangi kucing, misalnya sofa atau karpet.
Semprot lagi kalau wanginya mulai hilang.
Spray paling cocok dipakai di dalam ruangan.
Peringatan:
Jangan semprot langsung ke kucing.
Catatan:
Efeknya bisa berbeda untuk setiap kucing.$$
WHERE slug = 'bye-bye-cat-spray' AND usage_instructions IS NULL;

UPDATE products SET usage_instructions = $$Bersihkan dulu bekas kotoran tikus dan barang-barang yang bisa dijadikan sarang.
Sebarkan beberapa butir gel di tempat yang perlu, dengan jarak 5-10 cm antarbutir.
Sesuaikan jumlah gel dengan luas area.
Gel akan mengering setelah 2-3 hari. Sebar lagi setelah gel sebelumnya mengering, ulangi sampai 2-3 kali.
Catatan:
Efeknya bisa berbeda untuk setiap tikus.$$
WHERE slug = 'bye-bye-mouse-gel' AND usage_instructions IS NULL;

UPDATE products SET usage_instructions = $$Semprotkan ke tempat yang sering dilalui tikus atau tempat persembunyiannya.
Semprot menjelang malam, saat tikus mulai aktif.
Ulangi secara rutin di area yang sama.
Catatan:
Efeknya bisa berbeda untuk setiap tikus.$$
WHERE slug = 'bye-bye-mouse-spray' AND usage_instructions IS NULL;

UPDATE products SET usage_instructions = $$Bersihkan area rumah secara berkala.
Sebarkan beberapa butir gel di tempat yang perlu, dengan jarak 5-10 cm antarbutir. Sebar menjelang malam, saat kecoa mulai aktif.
Sesuaikan jumlah gel dengan luas area.
Gel akan mengering setelah 3-5 hari. Sebar lagi setelah gel sebelumnya mengering, ulangi sampai 2-3 kali.
Catatan:
Efeknya bisa berbeda untuk setiap kecoa.$$
WHERE slug = 'bye-bye-kecoa-gel' AND usage_instructions IS NULL;

UPDATE products SET usage_instructions = $$Bersihkan area rumah secara berkala.
Semprotkan ke tempat yang sering dilalui kecoa atau tempat persembunyiannya.
Semprot menjelang malam, saat kecoa mulai aktif.
Ulangi secara rutin di area yang sama.
Peringatan:
Jauhkan dari jangkauan anak-anak.
Kalau terkena mata, bilas dengan air.
Catatan:
Efeknya bisa berbeda untuk setiap kecoa.$$
WHERE slug = 'bye-bye-kecoa-spray-80ml' AND usage_instructions IS NULL;

UPDATE products SET usage_instructions = $$Gel:
Bersihkan area rumah secara berkala.
Sebarkan beberapa butir gel di tempat yang perlu, dengan jarak 5-10 cm antarbutir. Sebar menjelang malam, saat kecoa mulai aktif.
Sesuaikan jumlah gel dengan luas area.
Gel akan mengering setelah 3-5 hari. Sebar lagi setelah gel sebelumnya mengering, ulangi sampai 2-3 kali.
Spray:
Semprotkan ke tempat yang sering dilalui kecoa atau tempat persembunyiannya.
Semprot menjelang malam, saat kecoa mulai aktif.
Ulangi secara rutin di area yang sama.
Peringatan:
Jauhkan dari jangkauan anak-anak.
Kalau terkena mata, bilas dengan air.
Catatan:
Efeknya bisa berbeda untuk setiap kecoa.$$
WHERE slug = 'paket-bye-bye-kecoa-gel-spray' AND usage_instructions IS NULL;

UPDATE products SET usage_instructions = $$Bersihkan dulu bekas kotoran cicak dan barang-barang yang bisa dijadikan sarang.
Sebarkan beberapa butir gel di tempat yang perlu, misalnya di atas lemari, meja makan, atau lemari makan, dengan jarak 5-10 cm antarbutir.
Sesuaikan jumlah gel dengan luas area.
Gel akan mengering setelah 4-5 hari. Sebar lagi setelah gel sebelumnya mengering.
Ulangi secara rutin.
Catatan:
Efeknya bisa berbeda untuk setiap cicak.$$
WHERE slug = 'bye-bye-cicak-gel' AND usage_instructions IS NULL;

UPDATE products SET usage_instructions = $$Semprotkan ke tempat yang sering dilalui cicak atau tempat persembunyiannya.
Semprot menjelang malam, saat cicak mulai aktif.
Ulangi secara rutin di area yang sama.
Catatan:
Efeknya bisa berbeda untuk setiap cicak.$$
WHERE slug = 'bye-bye-cicak-spray' AND usage_instructions IS NULL;

UPDATE products SET usage_instructions = $$Sebarkan gel di tempat yang diduga didatangi ular.
Gel akan mengering setelah 4-5 hari. Sebar lagi kalau ular datang kembali.
Peringatan:
Kalau terkena mata, segera bilas dengan air mengalir.
Catatan:
Efeknya bisa berbeda untuk setiap jenis ular.$$
WHERE slug = 'bye-bye-snake-gel' AND usage_instructions IS NULL;

UPDATE products SET usage_instructions = $$Semprotkan ke tempat yang diduga didatangi ular.
Semprot sampai basah supaya wanginya lebih awet.
Bisa juga disemprotkan langsung ke arah ular.
Peringatan:
Kalau terkena mata, segera bilas dengan air mengalir.
Catatan:
Efeknya bisa berbeda untuk setiap jenis ular.$$
WHERE slug = 'bye-bye-snake-spray' AND usage_instructions IS NULL;

UPDATE products SET usage_instructions = $$Gel:
Sebarkan gel di tempat yang diduga didatangi ular.
Gel akan mengering setelah 4-5 hari. Sebar lagi kalau ular datang kembali.
Spray:
Semprotkan ke tempat yang diduga didatangi ular.
Semprot sampai basah supaya wanginya lebih awet.
Bisa juga disemprotkan langsung ke arah ular.
Peringatan:
Kalau terkena mata, segera bilas dengan air mengalir.
Catatan:
Efeknya bisa berbeda untuk setiap jenis ular.$$
WHERE slug = 'paket-bye-bye-ular-gel-spray' AND usage_instructions IS NULL;

UPDATE products SET usage_instructions = $$Sebarkan gel di tempat yang sering didatangi musang sampai wanginya tercium.
Gel akan mengering setelah 3-5 hari, tergantung cuaca. Sebar lagi kalau gel sudah kering dan musang datang lagi.
Peringatan:
Jauhkan dari jangkauan anak-anak.
Kalau terkena mata, bilas dengan air.
Kalau tidak sengaja tertelan, segera cari pertolongan medis.$$
WHERE slug = 'gel-pengusir-musang' AND usage_instructions IS NULL;

UPDATE products SET usage_instructions = $$Kocok dulu sebelum dipakai.
Semprotkan secukupnya di tempat yang perlu, atau ke arah musang supaya wanginya tercium.
Semprot lagi kalau wanginya sudah hilang.
Peringatan:
Jauhkan dari jangkauan anak-anak.
Kalau terkena mata, bilas dengan air.
Kalau tidak sengaja tertelan, segera cari pertolongan medis.$$
WHERE slug = 'spray-pengusir-musang' AND usage_instructions IS NULL;

UPDATE products SET usage_instructions = $$Sebarkan beberapa butir gel di tempat yang perlu, dengan jarak 5-10 cm antarbutir.
Sesuaikan jumlah gel dengan luas area.
Gel akan mengering setelah 2-3 hari. Sebar lagi setelah gel sebelumnya mengering, ulangi sampai 2-3 kali.
Catatan:
Efeknya bisa berbeda untuk setiap kucing.$$
WHERE slug = 'gocat-gel-refill-66g' AND usage_instructions IS NULL;

UPDATE products SET usage_instructions = $$Sebarkan beberapa butir gel di tempat yang perlu, dengan jarak 5-10 cm antarbutir.
Sesuaikan jumlah gel dengan luas area.
Gel akan mengering setelah 2-3 hari. Sebar lagi setelah gel sebelumnya mengering, ulangi sampai 2-3 kali.
Catatan:
Efeknya bisa berbeda untuk setiap kucing.$$
WHERE slug = 'gocat-gel-jumbo' AND usage_instructions IS NULL;

UPDATE products SET usage_instructions = $$Buka pengunci di bagian tengah spray yang bentuknya seperti roda, putar ke kiri.
Semprotkan secukupnya di tempat yang tidak ingin didatangi kucing.
Kalau disemprotkan ke udara, wanginya cepat menguap seperti pengharum ruangan.
Semprot lagi kalau wanginya hilang dan kucing datang lagi.
Spray paling cocok dipakai di dalam ruangan.
Peringatan:
Jangan semprot langsung ke kucing.
Catatan:
Efeknya bisa berbeda untuk setiap kucing.$$
WHERE slug = 'gocat-spray' AND usage_instructions IS NULL;

UPDATE products SET usage_instructions = $$Gel:
Sebarkan beberapa butir gel di tempat yang perlu, dengan jarak 5-10 cm antarbutir.
Sesuaikan jumlah gel dengan luas area.
Gel akan mengering setelah 2-3 hari. Sebar lagi setelah gel sebelumnya mengering, ulangi sampai 2-3 kali.
Spray:
Buka pengunci di bagian tengah spray yang bentuknya seperti roda, putar ke kiri.
Semprotkan secukupnya di tempat yang tidak ingin didatangi kucing.
Kalau disemprotkan ke udara, wanginya cepat menguap seperti pengharum ruangan.
Semprot lagi kalau wanginya hilang dan kucing datang lagi.
Spray paling cocok dipakai di dalam ruangan.
Peringatan:
Jangan semprot langsung ke kucing.
Catatan:
Efeknya bisa berbeda untuk setiap kucing.$$
WHERE slug = 'paket-gocat-gel-spray' AND usage_instructions IS NULL;

UPDATE products SET usage_instructions = $$Buka pengunci di bagian tengah spray yang bentuknya seperti roda, putar ke kiri.
Semprotkan secukupnya di tempat yang tidak ingin didatangi kucing.
Kalau disemprotkan ke udara, wanginya cepat menguap seperti pengharum ruangan.
Semprot lagi kalau wanginya hilang dan kucing datang lagi.
Spray paling cocok dipakai di dalam ruangan.
Peringatan:
Jangan semprot langsung ke kucing.
Catatan:
Efeknya bisa berbeda untuk setiap kucing.$$
WHERE slug = 'paket-hemat-3-gocat-spray' AND usage_instructions IS NULL;

UPDATE products SET usage_instructions = $$Gunting kantong Goito.
Pasang tali di lubang kantongnya.
Gantung di kipas angin atau AC, atau letakkan di tempat yang ada aliran udaranya.$$
WHERE slug = 'goito-gel-nyamuk' AND usage_instructions IS NULL;

UPDATE products SET usage_instructions = $$Kocok botol sebelum dipakai.
Semprotkan di ruangan atau permukaan yang sering dilalui nyamuk.
Setelah disemprot, tutup ruangan selama 15 menit.$$
WHERE slug = 'goito-spray-nyamuk-100ml' AND usage_instructions IS NULL;

UPDATE products SET usage_instructions = $$Gel:
Gunting kantong Goito.
Pasang tali di lubang kantongnya.
Gantung di kipas angin atau AC, atau letakkan di tempat yang ada aliran udaranya.
Spray:
Kocok botol sebelum dipakai.
Semprotkan di ruangan atau permukaan yang sering dilalui nyamuk.
Setelah disemprot, tutup ruangan selama 15 menit.$$
WHERE slug = 'paket-goito-gel-spray' AND usage_instructions IS NULL;

UPDATE products SET usage_instructions = $$Kocok dulu sebelum dipakai, lalu semprotkan ke bagian tas yang ingin dibersihkan.
Usapkan secara merata dengan kain bersih yang lembut.
Diamkan sebentar, lalu gosok sampai permukaannya tampak halus dan bersih.
Ulangi sampai tampilannya sesuai keinginan.
Keringkan dengan cara diangin-anginkan. Jangan dijemur di bawah sinar matahari langsung supaya bahannya tidak rusak.
Pakai secara rutin supaya tas tetap bersih dan terawat.$$
WHERE slug = 'sangreat-leather-bag-cleaner' AND usage_instructions IS NULL;

UPDATE products SET usage_instructions = $$Kocok dulu sebelum dipakai, lalu semprotkan ke bagian sepatu yang ingin dibersihkan.
Usapkan secara merata dengan kain bersih yang lembut.
Diamkan sebentar, lalu gosok sampai permukaannya tampak halus dan bersih.
Ulangi sampai tampilannya sesuai keinginan.
Keringkan dengan cara diangin-anginkan. Jangan dijemur di bawah sinar matahari langsung supaya bahannya tidak rusak.
Pakai secara rutin supaya sepatu tetap bersih dan terawat.$$
WHERE slug = 'sangreat-leather-shoe-cleaner' AND usage_instructions IS NULL;

UPDATE products SET usage_instructions = $$Kocok dulu sebelum dipakai, lalu semprotkan ke bagian jaket yang ingin dibersihkan.
Usapkan secara merata dengan kain bersih yang lembut.
Diamkan sebentar, lalu gosok sampai permukaannya tampak halus dan bersih.
Ulangi sampai tampilannya sesuai keinginan.
Keringkan dengan cara diangin-anginkan. Jangan dijemur di bawah sinar matahari langsung supaya bahannya tidak rusak.
Pakai secara rutin supaya jaket tetap bersih dan terawat.$$
WHERE slug = 'sangreat-leather-jacket-cleaner' AND usage_instructions IS NULL;

UPDATE products SET usage_instructions = $$Kocok dulu sebelum dipakai, lalu semprotkan ke bagian sofa atau jok yang ingin dibersihkan.
Usapkan secara merata dengan kain bersih yang lembut.
Diamkan sebentar, lalu gosok perlahan sampai permukaannya tampak halus dan bersih.
Ulangi langkah sebelumnya sampai tampilannya sesuai keinginan.
Untuk noda yang membandel, bisa pakai sikat.
Pakai secara rutin supaya sofa atau jok tetap bersih dan terawat.$$
WHERE slug = 'sangreat-car-seat-cleaner' AND usage_instructions IS NULL;
