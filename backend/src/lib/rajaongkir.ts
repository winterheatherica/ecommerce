export type KonfigOngkir = {
  apiKey: string;
  originId: string;
};

const DASAR = "https://rajaongkir.komerce.id/api/v1";

export function bacaKonfigOngkir(
  env: Record<string, unknown>,
): KonfigOngkir | undefined {
  const apiKey = env.RAJAONGKIR_API_KEY;

  if (typeof apiKey !== "string" || apiKey.trim().length === 0) {
    return undefined;
  }

  const originId = env.RAJAONGKIR_ORIGIN_ID;

  return {
    apiKey: apiKey.trim(),
    originId: typeof originId === "string" ? originId.trim() : "",
  };
}

export type TujuanRO = {
  id: number;
  label: string;
  province_name: string;
  city_name: string;
  district_name: string;
  subdistrict_name: string;
  zip_code: string;
};

export type OpsiRO = {
  name: string;
  code: string;
  service: string;
  description: string;
  cost: number;
  etd: string;
};

export type ManifestRO = {
  manifest_code?: string | null;
  manifest_description?: string | null;
  manifest_date?: string | null;
  manifest_time?: string | null;
  city_name?: string | null;
};

export type LacakRO = {
  delivered?: boolean | string | null;
  summary?: { status?: string | null } | null;
  delivery_status?: {
    status?: string | null;
    pod_receiver?: string | null;
    pod_date?: string | null;
    pod_time?: string | null;
  } | null;
  manifest?: ManifestRO[] | null;
};

export type HasilRO<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; pesan: string };

async function baca<T>(res: Response): Promise<HasilRO<T>> {
  const isi = (await res.json().catch(() => null)) as {
    meta?: { message?: string; code?: number; status?: string };
    data?: T;
  } | null;

  if (!isi || isi.meta?.status !== "success" || isi.data === undefined) {
    return {
      ok: false,
      status: isi?.meta?.code ?? (res.ok ? 502 : res.status),
      pesan: isi?.meta?.message || `RajaOngkir menolak permintaan (${res.status})`,
    };
  }

  return { ok: true, data: isi.data };
}

const BATAS_MS = 8000;

async function panggil<T>(
  url: string,
  init: RequestInit,
  batasMs: number = BATAS_MS,
): Promise<HasilRO<T>> {
  try {
    const res = await fetch(url, {
      ...init,
      signal: AbortSignal.timeout(batasMs),
    });

    return baca<T>(res);
  } catch (e) {
    console.error("[rajaongkir] tidak merespons", new URL(url).pathname, e);

    return {
      ok: false,
      status: 504,
      pesan: "RajaOngkir tidak merespons tepat waktu",
    };
  }
}

export async function cariTujuan(
  konfig: KonfigOngkir,
  kata: string,
  batas: number,
): Promise<HasilRO<TujuanRO[]>> {
  const q = new URLSearchParams({
    search: kata,
    limit: String(batas),
    offset: "0",
  });

  return panggil<TujuanRO[]>(
    `${DASAR}/destination/domestic-destination?${q}`,
    { headers: { key: konfig.apiKey } },
  );
}

export async function hitungOngkir(
  konfig: KonfigOngkir,
  destinationId: string,
  weightG: number,
  courier: string,
): Promise<HasilRO<OpsiRO[]>> {
  const form = new URLSearchParams({
    origin: konfig.originId,
    destination: destinationId,
    weight: String(Math.max(1, Math.ceil(weightG))),
    courier,
  });

  return panggil<OpsiRO[]>(`${DASAR}/calculate/domestic-cost`, {
    method: "POST",
    headers: {
      key: konfig.apiKey,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: form,
  });
}

const BATAS_LACAK_MS = 5000;

export async function lacakResi(
  konfig: KonfigOngkir,
  awb: string,
  courier: string,
  hpAkhir: string | null,
): Promise<HasilRO<LacakRO>> {
  const isian = new URLSearchParams({ awb: awb.trim(), courier });
  if (hpAkhir) isian.set("last_phone_number", hpAkhir);

  return panggil<LacakRO>(
    `${DASAR}/track/waybill?${isian}`,
    {
      method: "POST",
      headers: {
        key: konfig.apiKey,
        "content-type": "application/x-www-form-urlencoded",
      },
      body: isian,
    },
    BATAS_LACAK_MS,
  );
}
