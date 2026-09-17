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
): Promise<HasilRO<T>> {
  try {
    const res = await fetch(url, {
      ...init,
      signal: AbortSignal.timeout(BATAS_MS),
    });

    return baca<T>(res);
  } catch (e) {
    console.error("[rajaongkir] tidak merespons", url, e);

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
