export type Invoice = {
  invoice_id: string;
  invoice_url: string;
  expires_at: string;
};

export type PermintaanInvoice = {
  order_no: string;
  amount: number;
  customer_name: string;
  email: string | null;
};

const UMUR_JAM = 1;

export function buatInvoice(
  req: PermintaanInvoice,
  storefrontUrl: string,
): Invoice {
  const kedaluwarsa = new Date(Date.now() + UMUR_JAM * 60 * 60 * 1000);

  return {
    invoice_id: `stub-inv-${req.order_no.toLowerCase()}`,
    invoice_url: `${storefrontUrl}/bayar/${req.order_no}`,
    expires_at: kedaluwarsa.toISOString(),
  };
}
