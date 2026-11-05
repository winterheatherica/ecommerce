import type { CatatanEmail } from "@/app/lib/api";

const LABEL_JENIS: Record<CatatanEmail["kind"], string> = {
  order_paid: "Pesanan dibayar",
  needs_check: "Perlu dicek",
  test: "Email uji",
};

export function labelJenis(jenis: CatatanEmail["kind"]): string {
  return LABEL_JENIS[jenis];
}

export function judulCatatan(c: CatatanEmail): string {
  return c.order_no ? `${LABEL_JENIS[c.kind]} ${c.order_no}` : LABEL_JENIS[c.kind];
}

export function waktuCatatan(iso: string): string {
  return new Date(iso).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });
}
