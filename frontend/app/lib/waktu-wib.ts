const WIB_MS = 7 * 3600_000;

export function isoKeIsianWib(iso: string | null): string {
  if (!iso) return "";
  return new Date(new Date(iso).getTime() + WIB_MS).toISOString().slice(0, 16);
}

export function isianWibKeIso(nilai: string): string | null {
  return nilai ? `${nilai}:00+07:00` : null;
}

export function tanggalWib(iso: string): string {
  return new Date(iso).toLocaleString("id-ID", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });
}
