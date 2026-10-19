INSERT INTO reviews (variant_id, source, external_id, rating, author_name, body, follow_up, follow_up_at, reviewed_at)
SELECT v.id, 'shopee', d.external_id, d.rating, d.author_name, d.body, d.follow_up, d.follow_up_at, d.reviewed_at
FROM (VALUES
  ('gocat-gel-refill-66g', '114424960448', 4, 'n*****0', $u$Bintang 4 dl belum coba semoga ampuh$u$, NULL, NULL, to_timestamp(1792298097)),
  ('gocat-gel-refill-66g', '114353423650', 5, 'r*****3', NULL, $u$Cepat sekali responnya. Belum ada 1 jam pesan, barang udah sampe. Terima kasih banyak. Saya beli refill karena produknya sangat bermanfaat. Kucing tidak berani mendekat ke pekarangan rumah lagi setelah diberi gel ini.$u$, to_timestamp(1792231180), to_timestamp(1792230865)),
  ('goito-gel-nyamuk', '112446961121', 4, 'm*****8', $u$Biasa aj efekny$u$, NULL, NULL, to_timestamp(1791124406)),
  ('goito-gel-nyamuk', '112015331934', 5, 'c*****4', $u$sudah sampai masih segel...nanti malam baru di coba.. makasih.$u$, NULL, NULL, to_timestamp(1790841940)),
  ('paket-goito-gel-spray', '111793237352', 4, 'r*****8', $u$aroma:👍
daya semprot:👍

Baik$u$, NULL, NULL, to_timestamp(1790752956)),
  ('flygo-gel-70g', '111689855297', 5, 'g*****w', $u$efektivitas mengusir lalat:lumayan mengurangi dikit demi sedikit lalat diruangan terbuka
kegunaan untuk mengusir lalat:membantu berkurang lalat di ruang terbuka
aroma alami:aromanya dikit tidak enak

lebih efektif diruangan terbuka$u$, NULL, NULL, to_timestamp(1790651010)),
  ('bye-bye-cat-50g', '111543001183', 1, 'm*****3', $u$Kualitas:Kucing malah makin rame dtg ke rumah$u$, NULL, NULL, to_timestamp(1790572045)),
  ('goito-gel-nyamuk', '111195754483', 5, 'r*****i', $u$Barang sudah sampai terima kasih.$u$, NULL, NULL, to_timestamp(1790333737)),
  ('gocoro-gel-kecoa-70g', '111113909366', 5, 'o*****8', $u$Sdh diterima$u$, NULL, NULL, to_timestamp(1790288801)),
  ('bye-bye-cat-50g', '110515818040', 5, 'r*****1', NULL, $u$Ini produk bener-bener bikin “BYE” 
Awalnya beli buat ngusir kucing liar yang suka bully kucingku. Eh… kok kucing peliharaanku sendiri ikut “BYE” juga 😭

Ya sudahlah… mungkin ini bukan pengusir kucing, tapi alat seleksi alam. Yang kuat bertahan, yang pergi mungkin memang sudah takdir. 😂$u$, to_timestamp(1790642569), to_timestamp(1789888681)),
  ('bye-bye-cat-50g', '109783695400', 2, 'a*****6', $u$Wewangian:aroma seperti permen mentos

Baru saja taruh 2 area yang sering didatangi kucing. Semoga barangnya efektif ngusir 🙏$u$, $u$Hanya ngefek jika ditaruh semua di area yang bau dan sering dilewati kucing$u$, to_timestamp(1790439112), to_timestamp(1789398656)),
  ('sangreat-leather-jacket-cleaner', '109089357182', 5, 'd*****8', $u$Kualitas:bagus
Wewangian:bagus
Tekstur:bagus

Recomended terimakasih$u$, NULL, NULL, to_timestamp(1788951431)),
  ('goito-gel-nyamuk', '108298142704', 5, 'i*****4', $u$Trimakasih🙏 mantab 👍$u$, NULL, NULL, to_timestamp(1788423053)),
  ('bye-bye-cat-80g', '107555132783', 5, 'm*****3', $u$M$u$, NULL, NULL, to_timestamp(1787850056)),
  ('bye-bye-cat-50g', '105117267218', 3, 'y*****y', $u$Efektivitas:kurang mempan, sudah 1 hari kucingnya cuek
Wewangian:wangi$u$, NULL, NULL, to_timestamp(1785156431)),
  ('goito-gel-nyamuk', '104971855483', 5, '1*****g', $u$Efektivitas:setelah digunakan, nyamuk di sekitar berkurang
Wewangian:aroma sereh segar
Desain:mudah dibuka tutup, praktis tinggal digantung$u$, NULL, NULL, to_timestamp(1784440250)),
  ('sangreat-leather-jacket-cleaner', '104117009121', 5, 'd*****8', $u$Kualitas:bagus
Wewangian:bagus
Tekstur:bagus

Recomended$u$, NULL, NULL, to_timestamp(1783598423)),
  ('bye-bye-mouse-gel-ekonomis', '103213178111', 5, 'c*****4', $u$Belum dicoba$u$, NULL, NULL, to_timestamp(1783048154)),
  ('sangreat-car-seat-cleaner', '103098219401', 5, 'd*****8', $u$Performa:bagus
Cocok Untuk:bagus
Kualitas:bagus

Recomended$u$, NULL, NULL, to_timestamp(1782980507)),
  ('sangreat-leather-jacket-cleaner', '102458378233', 5, 'a*****s', $u$Barang sudah sampai dan sudah saya gunakan untuk mbersihkan jaket kulit hasil nya sangat bagus tp.sayang tidak ada sikat semir nya rokomondasi untuk kualitas nya sangat baik$u$, NULL, NULL, to_timestamp(1782616516)),
  ('bye-bye-snake-gel-50g', '100503255494', 5, '2*****s', $u$Fungsi:membantu mengusir ular dalam rumah
Kualitas:kualitas baik$u$, NULL, NULL, to_timestamp(1781261145)),
  ('bye-bye-semut-spray-80ml', '99278090956', 1, '6*****t', $u$Aku beli ini karena infonya mengusir dan mencegah semut kembali / bersarang.
Di semprot malah mati, beberapa saat yg lain datang kembali,.$u$, NULL, NULL, to_timestamp(1780540120)),
  ('goito-gel-nyamuk', '99166801077', 1, 'a*****4', $u$Efektivitas:gak bagus
Wewangian:gak ada wanginya
Desain:bukan pengusir nyamuk tapi pengusir seller$u$, NULL, NULL, to_timestamp(1779980606)),
  ('bye-bye-cat-80g', '99092247778', 3, 'a*****e', $u$Efektivitas:didatengin kucing 😅$u$, NULL, NULL, to_timestamp(1779721276)),
  ('bye-bye-cat-50g', '98586730003', 5, 'd*****o', $u$Pengiriman cepat dan sangat manfaat buat usir kucing yg suka pup sembarangan$u$, NULL, NULL, to_timestamp(1779081947)),
  ('bye-bye-cat-50g', '98400124596', 3, 'e*****y', NULL, $u$Kucing nya masi tetap datang. Bahkan pas sebelah bye2 cat nya kucing nya nongkrong santai$u$, to_timestamp(1779337352), to_timestamp(1778925720)),
  ('bye-bye-cat-50g', '98349816830', 5, 'a*****0', $u$Paket sudah sampai$u$, NULL, NULL, to_timestamp(1778893942)),
  ('gocat-gel-refill-66g', '97798842773', 5, 'n*****h', $u$mantap. selalu ampuh buat usir kucing biar gak pup sembarangan$u$, NULL, NULL, to_timestamp(1778555817)),
  ('goito-gel-nyamuk', '97773929526', 5, 'd*****5', $u$Sudah di terima 👍👍👍$u$, NULL, NULL, to_timestamp(1778411621)),
  ('bye-bye-cat-50g', '97591036112', 5, 'd*****o', $u$Ternyata packingnya kecil ya. Isi jg dikit. Mudah2an ampuh utk diletakan di tempat kucing buang air sembarangan. Baunya wangi mint. Seller fast response, packing aman dan pengiriman juga cepat. Terima kasih.$u$, NULL, NULL, to_timestamp(1778005004))
) AS d(slug, external_id, rating, author_name, body, follow_up, follow_up_at, reviewed_at)
JOIN product_variants v ON v.slug = d.slug
ON CONFLICT (source, external_id) DO NOTHING;
