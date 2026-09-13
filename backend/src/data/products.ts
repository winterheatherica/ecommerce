export type Product = {
  id: number;
  slug: string;
  name: string;
  description: string;
  price: number;
  weight_g: number;
  stock: number;
  category: string;
  is_featured: boolean;
  sold_per_month: number;
  sort_order: number;
  is_active: boolean;
};

export const products: Product[] = [
  {
    id: 1,
    slug: "bye-bye-cat-50g",
    name: "Alat pengusir kucing Bye Bye Cat 50g",
    description:
      "Gel pengusir kucing berbahan dasar ekstrak tumbuhan. Letakkan di teras, kap mesin motor, atau sudut yang sering dilewati kucing. Aromanya tidak disukai kucing sehingga mereka menjauh dengan sendirinya, tanpa menyakiti. Ukuran 50 g cocok untuk satu titik seperti teras depan atau satu sudut garasi.",
    price: 49000,
    weight_g: 50,
    stock: 24,
    category: "kucing",
    sold_per_month: 27,
    is_featured: true,
    sort_order: 1,
    is_active: true,
  },
  {
    id: 2,
    slug: "bye-bye-cat-80g",
    name: "Alat pengusir kucing Bye Bye Cat 80g",
    description:
      "Versi isi lebih banyak dari Bye Bye Cat 50 g, untuk area yang lebih luas atau beberapa titik sekaligus. Pilih ukuran ini kalau kucing datang dari lebih dari satu arah, misalnya teras depan dan belakang, atau kalau areanya terbuka sehingga aromanya lebih cepat menguap.",
    price: 59000,
    weight_g: 80,
    stock: 18,
    category: "kucing",
    sold_per_month: 18,
    is_featured: true,
    sort_order: 2,
    is_active: true,
  },
  {
    id: 3,
    slug: "goito-gel-nyamuk",
    name: "Goito Gel — Pengusir Nyamuk Alami",
    description:
      "Gel pengusir nyamuk tanpa asap dan tanpa bakar, jadi aman dipakai di ruangan tertutup seperti kamar tidur. Cukup dibuka dan diletakkan di sudut ruangan. Tidak meninggalkan noda dan tidak perlu dinyalakan, jadi bisa ditinggal saat tidur.",
    price: 33000,
    weight_g: 100,
    stock: 31,
    category: "nyamuk",
    sold_per_month: 17,
    is_featured: true,
    sort_order: 3,
    is_active: true,
  },
  {
    id: 4,
    slug: "sangreat-leather-jacket-cleaner",
    name: "SanGreat Leather Jacket Cleaner and Polish",
    description:
      "Pembersih sekaligus pemoles khusus jaket kulit. Mengangkat debu dan noda ringan tanpa membuat kulit kering atau retak, lalu meninggalkan lapisan pelembap agar warnanya tetap hidup. Cocok untuk perawatan rutin jaket yang jarang dipakai maupun yang sering kena panas dan hujan.",
    price: 97000,
    weight_g: 120,
    stock: 7,
    category: "perawatan-kulit",
    sold_per_month: 10,
    is_featured: true,
    sort_order: 4,
    is_active: true,
  },
  {
    id: 5,
    slug: "bye-bye-kecoa-50gr",
    name: "Bye Bye Kecoa Gel 50gr — Pengusir Kecoa Natural",
    description:
      "Gel pengusir kecoa untuk area dapur, bawah wastafel, dan celah lemari. Bekerja dengan aroma yang dihindari kecoa, bukan racun, jadi tidak meninggalkan bangkai yang harus dibersihkan dan lebih aman dipakai di sekitar tempat makanan disimpan.",
    price: 54000,
    weight_g: 50,
    stock: 12,
    category: "kecoa",
    sold_per_month: 9,
    is_featured: true,
    sort_order: 5,
    is_active: true,
  },
  {
    id: 6,
    slug: "cicago-gel-cicak-70g",
    name: "Cicago Gel Pengusir Cicak Alami 70g",
    description:
      "Gel pengusir cicak untuk dinding, plafon, dan sekitar lampu — tempat cicak biasa berkumpul mencari serangga. Bertahan lebih lama dibanding semprotan, jadi cocok untuk area tetap yang memang sering didatangi setiap malam.",
    price: 35000,
    weight_g: 70,
    stock: 15,
    category: "cicak",
    sold_per_month: 8,
    is_featured: true,
    sort_order: 6,
    is_active: true,
  },
  {
    id: 7,
    slug: "sangreat-leather-bag-cleaner",
    name: "SanGreat Leather Bag Cleaner & Polish",
    description:
      "Pembersih dan pemoles untuk tas kulit. Formulanya sama lembutnya dengan versi jaket, tapi ditujukan untuk permukaan tas yang lebih sering bergesekan. Membantu menyamarkan bekas gores halus dan mengembalikan kilau tanpa membuat permukaannya licin.",
    price: 97000,
    weight_g: 120,
    stock: 5,
    category: "perawatan-kulit",
    sold_per_month: 6,
    is_featured: false,
    sort_order: 7,
    is_active: true,
  },
  {
    id: 8,
    slug: "bye-bye-cicak-spray-80ml",
    name: "Bye Bye Cicak Spray 80ml Pengusir Cicak",
    description:
      "Semprotan pengusir cicak yang bekerja lebih cepat daripada gel, tapi efeknya lebih singkat. Pilih ini untuk area yang hanya sesekali bermasalah, atau saat butuh mengusir cicak dari satu tempat dengan segera. Bisa dipakai berbarengan dengan gel untuk area yang sering didatangi.",
    price: 64000,
    weight_g: 90,
    stock: 9,
    category: "cicak",
    sold_per_month: 5,
    is_featured: false,
    sort_order: 8,
    is_active: true,
  },
  {
    id: 9,
    slug: "bye-bye-mouse-100gr",
    name: "Bye Bye Mouse 100gr — Pengusir Tikus Non-Racun",
    description:
      "Pengusir tikus tanpa racun untuk plafon, gudang, dan belakang lemari. Karena mengusir dan bukan membunuh, tidak ada bangkai yang membusuk di tempat yang sulit dijangkau — masalah yang biasanya muncul beberapa hari setelah memakai racun tikus.",
    price: 59000,
    weight_g: 100,
    stock: 11,
    category: "tikus",
    sold_per_month: 5,
    is_featured: false,
    sort_order: 9,
    is_active: true,
  },
  {
    id: 10,
    slug: "bye-bye-cicak-gel-80gr",
    name: "Bye Bye Cicak Gel 80gr — Pengusir Cicak",
    description:
      "Gel pengusir cicak isi 80 g untuk rumah dengan banyak titik bermasalah sekaligus. Satu wadah bisa dibagi ke beberapa sudut, misalnya dapur, teras, dan kamar mandi, tanpa perlu membeli beberapa kemasan kecil.",
    price: 69000,
    weight_g: 80,
    stock: 0,
    category: "cicak",
    sold_per_month: 4,
    is_featured: false,
    sort_order: 10,
    is_active: true,
  },
  {
    id: 11,
    slug: "gocat-gel-refill-66g",
    name: "GoCat Gel Refill Ekonomis 66g Pengusir Kucing",
    description:
      "Isi ulang untuk wadah GoCat yang sudah kamu punya. Pilihan paling hemat kalau sudah rutin memakai pengusir kucing dan hanya perlu mengganti isinya, bukan wadahnya.",
    price: 35000,
    weight_g: 66,
    stock: 20,
    category: "kucing",
    sold_per_month: 4,
    is_featured: false,
    sort_order: 11,
    is_active: true,
  },
];
