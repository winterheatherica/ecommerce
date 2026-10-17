function rapikan(nilai: unknown): string | undefined {
  return typeof nilai === "string" && nilai.trim() ? nilai.trim().replace(/\/+$/, "") : undefined;
}

export function asalApi(env: Record<string, unknown>, request: Request): string {
  return rapikan(env.API_URL) ?? new URL(request.url).origin;
}

export function alamatToko(env: Record<string, unknown>): string {
  return rapikan(env.STOREFRONT_URL) ?? "http://localhost:3000";
}
