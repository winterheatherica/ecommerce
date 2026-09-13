export type StatusPesanan =
  | "PENDING"
  | "PAID"
  | "SHIPPED"
  | "DELIVERED"
  | "EXPIRED"
  | "CANCELLED";

export type OrderItem = {
  product_id: number;
  slug: string;
  name_snapshot: string;
  qty: number;
  price_snapshot: number;
};

export type Order = {
  id: number;
  order_no: string;
  customer_name: string;
  phone: string;
  email: string | null;
  address: string;
  notes: string | null;
  dest_id: string;
  dest_label: string;
  courier: string;
  service: string;
  etd: string | null;
  weight_g: number;
  subtotal: number;
  shipping_cost: number;
  total: number;
  status: StatusPesanan;
  xendit_invoice_id: string | null;
  xendit_invoice_url: string | null;
  expires_at: string | null;
  payment_method: string | null;
  tracking_number: string | null;
  created_at: string;
  paid_at: string | null;
  shipped_at: string | null;
};

export const orders: Order[] = [
  {
    id: 1,
    order_no: "MNK-7K3QX9F2",
    customer_name: "Rina Kartika",
    phone: "081234567801",
    email: null,
    address: "Jl. Cihampelas No. 42, RT 03/RW 05",
    notes: null,
    dest_id: "50001",
    dest_label: "Coblong, Kota Bandung, Jawa Barat",
    courier: "JNE",
    service: "REG",
    etd: "1-2",
    weight_g: 155,
    subtotal: 117000,
    shipping_cost: 9000,
    total: 126000,
    status: "PAID",
    xendit_invoice_id: null,
    xendit_invoice_url: null,
    expires_at: null,
    payment_method: "BCA",
    tracking_number: null,
    created_at: "2026-08-10T01:12:00.000Z",
    paid_at: "2026-08-10T01:31:00.000Z",
    shipped_at: null,
  },
  {
    id: 2,
    order_no: "MNK-2WD8HL45",
    customer_name: "Agus Setiawan",
    phone: "081234567802",
    email: "agus@contoh.id",
    address: "Jl. Kaliurang KM 5 No. 8",
    notes: "Titip ke satpam kalau tidak ada orang",
    dest_id: "50007",
    dest_label: "Depok, Sleman, DI Yogyakarta",
    courier: "J&T",
    service: "EZ",
    etd: "2-3",
    weight_g: 160,
    subtotal: 118000,
    shipping_cost: 14500,
    total: 132500,
    status: "PAID",
    xendit_invoice_id: null,
    xendit_invoice_url: null,
    expires_at: null,
    payment_method: "BCA",
    tracking_number: null,
    created_at: "2026-08-10T00:41:00.000Z",
    paid_at: "2026-08-10T00:58:00.000Z",
    shipped_at: null,
  },
  {
    id: 3,
    order_no: "MNK-QP61VZ07",
    customer_name: "Dewi Anggraini",
    phone: "081234567803",
    email: null,
    address: "Jl. Melati Raya No. 17",
    notes: null,
    dest_id: "50004",
    dest_label: "Cilandak, Jakarta Selatan, DKI Jakarta",
    courier: "SiCepat",
    service: "BEST",
    etd: "1-1",
    weight_g: 120,
    subtotal: 97000,
    shipping_cost: 11000,
    total: 108000,
    status: "SHIPPED",
    xendit_invoice_id: null,
    xendit_invoice_url: null,
    expires_at: null,
    payment_method: "QRIS",
    tracking_number: "SPX2839471028",
    created_at: "2026-08-09T07:05:00.000Z",
    paid_at: "2026-08-09T07:22:00.000Z",
    shipped_at: "2026-08-09T10:40:00.000Z",
  },
  {
    id: 4,
    order_no: "MNK-M40YB3TC",
    customer_name: "Hendra Wijaya",
    phone: "081234567804",
    email: null,
    address: "Jl. Diponegoro No. 91",
    notes: null,
    dest_id: "50008",
    dest_label: "Genteng, Kota Surabaya, Jawa Timur",
    courier: "JNE",
    service: "REG",
    etd: "2-3",
    weight_g: 100,
    subtotal: 59000,
    shipping_cost: 16000,
    total: 75000,
    status: "SHIPPED",
    xendit_invoice_id: null,
    xendit_invoice_url: null,
    expires_at: null,
    payment_method: "QRIS",
    tracking_number: "JNE0093827461",
    created_at: "2026-08-09T03:22:00.000Z",
    paid_at: "2026-08-09T03:35:00.000Z",
    shipped_at: "2026-08-09T09:15:00.000Z",
  },
  {
    id: 5,
    order_no: "MNK-5RJ2NE88",
    customer_name: "Sari Puspita",
    phone: "081234567805",
    email: null,
    address: "Jl. Ahmad Yani No. 3",
    notes: null,
    dest_id: "50009",
    dest_label: "Klojen, Kota Malang, Jawa Timur",
    courier: "J&T",
    service: "EZ",
    etd: "2-3",
    weight_g: 50,
    subtotal: 54000,
    shipping_cost: 14500,
    total: 68500,
    status: "PENDING",
    xendit_invoice_id: null,
    xendit_invoice_url: null,
    expires_at: null,
    payment_method: null,
    tracking_number: null,
    created_at: "2026-08-10T02:03:00.000Z",
    paid_at: null,
    shipped_at: null,
  },
  {
    id: 6,
    order_no: "MNK-8XC1PA30",
    customer_name: "Bayu Nugroho",
    phone: "081234567806",
    email: null,
    address: "Jl. Gajah Mada No. 55",
    notes: null,
    dest_id: "50010",
    dest_label: "Denpasar Barat, Kota Denpasar, Bali",
    courier: "SiCepat",
    service: "BEST",
    etd: "2-3",
    weight_g: 236,
    subtotal: 134000,
    shipping_cost: 29000,
    total: 163000,
    status: "DELIVERED",
    xendit_invoice_id: null,
    xendit_invoice_url: null,
    expires_at: null,
    payment_method: "GoPay",
    tracking_number: "SPX1029384756",
    created_at: "2026-08-06T09:47:00.000Z",
    paid_at: "2026-08-06T10:02:00.000Z",
    shipped_at: "2026-08-06T14:20:00.000Z",
  },
  {
    id: 7,
    order_no: "MNK-VT94KD16",
    customer_name: "Lestari Handayani",
    phone: "081234567807",
    email: null,
    address: "Jl. Sisingamangaraja No. 22",
    notes: null,
    dest_id: "50011",
    dest_label: "Medan Kota, Kota Medan, Sumatera Utara",
    courier: "JNE",
    service: "REG",
    etd: "4-6",
    weight_g: 80,
    subtotal: 59000,
    shipping_cost: 30000,
    total: 89000,
    status: "EXPIRED",
    xendit_invoice_id: null,
    xendit_invoice_url: null,
    expires_at: null,
    payment_method: null,
    tracking_number: null,
    created_at: "2026-08-07T04:30:00.000Z",
    paid_at: null,
    shipped_at: null,
  },
  {
    id: 8,
    order_no: "MNK-3GH7SB52",
    customer_name: "Fajar Ramadhan",
    phone: "081234567808",
    email: null,
    address: "Jl. Pahlawan No. 12",
    notes: null,
    dest_id: "50006",
    dest_label: "Semarang Tengah, Kota Semarang, Jawa Tengah",
    courier: "J&T",
    service: "EZ",
    etd: "2-3",
    weight_g: 100,
    subtotal: 33000,
    shipping_cost: 14500,
    total: 47500,
    status: "CANCELLED",
    xendit_invoice_id: null,
    xendit_invoice_url: null,
    expires_at: null,
    payment_method: null,
    tracking_number: null,
    created_at: "2026-08-08T06:14:00.000Z",
    paid_at: null,
    shipped_at: null,
  },
];

export const orderItems: (OrderItem & { order_id: number })[] = [
  { order_id: 1, product_id: 1, slug: "bye-bye-cat-50g", name_snapshot: "Alat pengusir kucing Bye Bye Cat 50g", qty: 1, price_snapshot: 49000 },
  { order_id: 1, product_id: 6, slug: "cicago-gel-cicak-70g", name_snapshot: "Cicago Gel Pengusir Cicak Alami 70g", qty: 1, price_snapshot: 35000 },
  { order_id: 1, product_id: 3, slug: "goito-gel-nyamuk", name_snapshot: "Goito Gel — Pengusir Nyamuk Alami", qty: 1, price_snapshot: 33000 },
  { order_id: 2, product_id: 2, slug: "bye-bye-cat-80g", name_snapshot: "Alat pengusir kucing Bye Bye Cat 80g", qty: 2, price_snapshot: 59000 },
  { order_id: 3, product_id: 4, slug: "sangreat-leather-jacket-cleaner", name_snapshot: "SanGreat Leather Jacket Cleaner and Polish", qty: 1, price_snapshot: 97000 },
  { order_id: 4, product_id: 9, slug: "bye-bye-mouse-100gr", name_snapshot: "Bye Bye Mouse 100gr — Pengusir Tikus Non-Racun", qty: 1, price_snapshot: 59000 },
  { order_id: 5, product_id: 5, slug: "bye-bye-kecoa-50gr", name_snapshot: "Bye Bye Kecoa Gel 50gr — Pengusir Kecoa Natural", qty: 1, price_snapshot: 54000 },
  { order_id: 6, product_id: 8, slug: "bye-bye-cicak-spray-80ml", name_snapshot: "Bye Bye Cicak Spray 80ml Pengusir Cicak", qty: 1, price_snapshot: 64000 },
  { order_id: 6, product_id: 11, slug: "gocat-gel-refill-66g", name_snapshot: "GoCat Gel Refill Ekonomis 66g Pengusir Kucing", qty: 1, price_snapshot: 35000 },
  { order_id: 6, product_id: 6, slug: "cicago-gel-cicak-70g", name_snapshot: "Cicago Gel Pengusir Cicak Alami 70g", qty: 1, price_snapshot: 35000 },
  { order_id: 7, product_id: 2, slug: "bye-bye-cat-80g", name_snapshot: "Alat pengusir kucing Bye Bye Cat 80g", qty: 1, price_snapshot: 59000 },
  { order_id: 8, product_id: 3, slug: "goito-gel-nyamuk", name_snapshot: "Goito Gel — Pengusir Nyamuk Alami", qty: 1, price_snapshot: 33000 },
];

const ALFABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function nomorPesananBaru(): string {
  let hasil = "";
  const acak = new Uint8Array(8);
  crypto.getRandomValues(acak);

  for (const b of acak) {
    hasil += ALFABET[b % ALFABET.length];
  }

  return `MNK-${hasil}`;
}

let idBerikut = orders.length + 1;

export function idPesananBaru(): number {
  return idBerikut++;
}
