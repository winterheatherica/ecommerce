import { alamatApi } from "@/app/lib/akun";
import { kepalaPengunjung } from "@/app/lib/pengunjung";

export async function ambilKunciCaptcha(): Promise<string | null> {
  try {
    const res = await fetch(`${alamatApi()}/api/captcha`, {
      cache: "no-store",
      headers: await kepalaPengunjung(),
    });
    if (!res.ok) return null;
    return ((await res.json()) as { turnstile_site_key: string | null }).turnstile_site_key;
  } catch {
    return null;
  }
}
