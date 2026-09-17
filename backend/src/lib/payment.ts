import {
  bentukFormulir,
  dasarTripay,
  tandaTanganTransaksi,
  type ItemTripay,
  type KonfigTripay,
} from "./tripay";

export type Channel = {
  code: string;
  name: string;
  group: string;
  icon_url: string;
  active: boolean;
  minimum_amount: number;
  maximum_amount: number;
};

export type PermintaanTransaksi = {
  order_no: string;
  method: string;
  amount: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  expires_at: string;
  items: ItemTripay[];
  callback_url: string;
  return_url: string;
};

export type Transaksi = {
  reference: string;
  checkout_url: string;
  payment_name: string;
  expired_time: number;
};

export type HasilTripay<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; pesan: string };

async function baca<T>(res: Response): Promise<HasilTripay<T>> {
  const isi = (await res.json().catch(() => null)) as {
    success?: boolean;
    message?: string;
    data?: T;
  } | null;

  if (!isi || isi.success !== true || isi.data === undefined) {
    return {
      ok: false,
      status: res.ok ? 502 : res.status,
      pesan: isi?.message || `Tripay menolak permintaan (${res.status})`,
    };
  }

  return { ok: true, data: isi.data };
}

const BATAS_MS = 10000;

async function panggil<T>(
  url: string,
  init: RequestInit,
): Promise<HasilTripay<T>> {
  try {
    const res = await fetch(url, {
      ...init,
      signal: AbortSignal.timeout(BATAS_MS),
    });

    return baca<T>(res);
  } catch (e) {
    console.error("[tripay] tidak merespons", url, e);

    return {
      ok: false,
      status: 504,
      pesan: "Tripay tidak merespons tepat waktu. Coba lagi sebentar.",
    };
  }
}

export async function daftarChannel(
  konfig: KonfigTripay,
): Promise<HasilTripay<Channel[]>> {
  return panggil<Channel[]>(`${dasarTripay(konfig)}/merchant/payment-channel`, {
    headers: { Authorization: `Bearer ${konfig.apiKey}` },
  });
}

export async function buatTransaksi(
  konfig: KonfigTripay,
  req: PermintaanTransaksi,
): Promise<HasilTripay<Transaksi>> {
  const signature = await tandaTanganTransaksi(
    konfig,
    req.order_no,
    req.amount,
  );

  const form = bentukFormulir(
    {
      method: req.method,
      merchant_ref: req.order_no,
      amount: req.amount,
      customer_name: req.customer_name,
      customer_email: req.customer_email,
      customer_phone: req.customer_phone,
      callback_url: req.callback_url,
      return_url: req.return_url,
      expired_time: Math.floor(new Date(req.expires_at).getTime() / 1000),
      signature,
    },
    req.items,
  );

  const hasil = await panggil<Transaksi>(
    `${dasarTripay(konfig)}/transaction/create`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${konfig.apiKey}`,
        "content-type": "application/x-www-form-urlencoded",
      },
      body: form,
    },
  );

  if (!hasil.ok) {
    console.error("[tripay] transaksi ditolak", {
      status: hasil.status,
      pesan: hasil.pesan,
      order_no: req.order_no,
      method: req.method,
    });
  }

  return hasil;
}
