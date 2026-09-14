export type KonfigTripay = {
  apiKey: string;
  privateKey: string;
  merchantCode: string;
  sandbox: boolean;
};

const DASAR_SANDBOX = "https://tripay.co.id/api-sandbox";
const DASAR_PRODUKSI = "https://tripay.co.id/api";

export function dasarTripay(konfig: KonfigTripay): string {
  return konfig.sandbox ? DASAR_SANDBOX : DASAR_PRODUKSI;
}

export function bacaKonfig(
  env: Record<string, unknown>,
): KonfigTripay | undefined {
  const apiKey = env.TRIPAY_API_KEY;
  const privateKey = env.TRIPAY_PRIVATE_KEY;
  const merchantCode = env.TRIPAY_MERCHANT_CODE;

  if (
    typeof apiKey !== "string" ||
    typeof privateKey !== "string" ||
    typeof merchantCode !== "string" ||
    !apiKey ||
    !privateKey ||
    !merchantCode
  ) {
    return undefined;
  }

  return {
    apiKey,
    privateKey,
    merchantCode,
    sandbox: env.TRIPAY_SANDBOX !== "false",
  };
}

export async function hmacHex(kunci: string, pesan: string): Promise<string> {
  const enc = new TextEncoder();

  const k = await crypto.subtle.importKey(
    "raw",
    enc.encode(kunci),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const sig = await crypto.subtle.sign("HMAC", k, enc.encode(pesan));

  return [...new Uint8Array(sig)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function tandaTanganTransaksi(
  konfig: KonfigTripay,
  merchantRef: string,
  amount: number,
): Promise<string> {
  return hmacHex(
    konfig.privateKey,
    `${konfig.merchantCode}${merchantRef}${amount}`,
  );
}

export function tandaTanganCallback(
  konfig: KonfigTripay,
  badanMentah: string,
): Promise<string> {
  return hmacHex(konfig.privateKey, badanMentah);
}

export function samaAman(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  let beda = 0;
  for (let i = 0; i < a.length; i++) {
    beda |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return beda === 0;
}

export type ItemTripay = {
  sku: string;
  name: string;
  price: number;
  quantity: number;
};

export function bentukFormulir(
  data: Record<string, string | number>,
  items: ItemTripay[],
): URLSearchParams {
  const form = new URLSearchParams();

  for (const [kunci, nilai] of Object.entries(data)) {
    form.set(kunci, String(nilai));
  }

  items.forEach((item, i) => {
    form.set(`order_items[${i}][sku]`, item.sku);
    form.set(`order_items[${i}][name]`, item.name);
    form.set(`order_items[${i}][price]`, String(item.price));
    form.set(`order_items[${i}][quantity]`, String(item.quantity));
  });

  return form;
}
