import {
  JALUR_CHECKOUT,
  METODE_BAYAR,
  dasarDoku,
  hpInternasional,
  kepalaPermintaan,
  type KonfigDoku,
} from "./doku";

export type ItemBayar = {
  sku: string;
  name: string;
  price: number;
  quantity: number;
};

export type PermintaanBayar = {
  invoice_number: string;
  amount: number;
  due_minutes: number;
  customer: { name: string; email: string | null; phone: string };
  items: ItemBayar[];
  callback_url: string;
  notification_url: string;
};

export type HalamanBayar = {
  url: string;
  token_id: string;
  expired_date: string | null;
};

export type HasilGateway<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; pesan: string };

export function badanCheckout(req: PermintaanBayar) {
  return {
    order: {
      amount: req.amount,
      invoice_number: req.invoice_number,
      currency: "IDR",
      callback_url: req.callback_url,
      auto_redirect: true,
      line_items: req.items.map((i) => ({
        id: i.sku,
        sku: i.sku,
        name: i.name.slice(0, 255),
        price: i.price,
        quantity: i.quantity,
      })),
    },
    payment: {
      payment_due_date: req.due_minutes,
      payment_method_types: METODE_BAYAR.map((m) => m.code),
    },
    customer: {
      name: req.customer.name.slice(0, 255),
      ...(req.customer.email ? { email: req.customer.email.slice(0, 128) } : {}),
      phone: hpInternasional(req.customer.phone).slice(0, 16),
      country: "ID",
    },
    additional_info: {
      override_notification_url: req.notification_url,
    },
  };
}

type JawabanDoku = {
  message?: string[];
  error_messages?: string[];
  error?: { message?: string };
  response?: {
    payment?: { url?: string; token_id?: string; expired_date?: string };
  };
};

export async function bacaJawaban(res: Response): Promise<HasilGateway<HalamanBayar>> {
  const isi = (await res.json().catch(() => null)) as JawabanDoku | null;
  const bayar = isi?.response?.payment;

  if (res.ok && bayar?.url && bayar.token_id) {
    return {
      ok: true,
      data: {
        url: bayar.url,
        token_id: bayar.token_id,
        expired_date: bayar.expired_date ?? null,
      },
    };
  }

  const alasan =
    isi?.error_messages?.join(", ") || isi?.error?.message || isi?.message?.join(", ");

  return {
    ok: false,
    status: res.ok ? 502 : res.status,
    pesan: alasan ? `DOKU menolak: ${alasan}` : `DOKU menolak permintaan (${res.status})`,
  };
}

const BATAS_MS = 10000;

export async function buatHalamanBayar(
  konfig: KonfigDoku,
  req: PermintaanBayar,
  requestId: string = crypto.randomUUID(),
  waktu: Date = new Date(),
): Promise<HasilGateway<HalamanBayar>> {
  const jumlahItem = req.items.reduce((s, i) => s + i.price * i.quantity, 0);

  if (jumlahItem !== req.amount) {
    console.error("[doku] rincian tidak sama dengan total", {
      invoice: req.invoice_number,
      rincian: jumlahItem,
      total: req.amount,
    });

    return {
      ok: false,
      status: 500,
      pesan: "Rincian pesanan tidak cocok dengan totalnya. Hubungi kami lewat WhatsApp.",
    };
  }

  const badan = JSON.stringify(badanCheckout(req));
  const kepala = await kepalaPermintaan(konfig, JALUR_CHECKOUT, badan, requestId, waktu);

  try {
    const res = await fetch(`${dasarDoku(konfig)}${JALUR_CHECKOUT}`, {
      method: "POST",
      headers: { ...kepala, "Content-Type": "application/json" },
      body: badan,
      signal: AbortSignal.timeout(BATAS_MS),
    });

    const hasil = await bacaJawaban(res);

    if (!hasil.ok) {
      console.error("[doku] halaman bayar ditolak", {
        status: hasil.status,
        pesan: hasil.pesan,
        invoice: req.invoice_number,
      });
    }

    return hasil;
  } catch (e) {
    console.error("[doku] tidak merespons", req.invoice_number, e);

    return {
      ok: false,
      status: 504,
      pesan: "DOKU tidak merespons tepat waktu. Coba lagi sebentar.",
    };
  }
}
