import { headers } from "next/headers";

export async function kepalaPengunjung(): Promise<Record<string, string>> {
  const ip = (await headers()).get("cf-connecting-ip");
  return ip ? { "x-toko-ip": ip } : {};
}
