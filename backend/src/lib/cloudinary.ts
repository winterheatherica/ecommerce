import type { Gagal } from "./products";

export type KonfigCloudinary = { awan: string; kunci: string; rahasia: string };

export type FotoBaru = {
  cloudinary_id: string;
  version?: number | null;
  width?: number | null;
  height?: number | null;
};

export type FotoBersih = {
  cloudinary_id: string;
  version: number | null;
  width: number | null;
  height: number | null;
};

export const FOLDER_FOTO = "menik-store/produk";
export const POLA_ID_FOTO = /^menik-store\/produk\/[A-Za-z0-9_-]{1,120}$/;
export const UKURAN_FOTO_MAKS = 10 * 1024 * 1024;
export const FOTO_MAKS_PER_PRODUK = 12;

export const GALAT_FOTO_WAJIB: Gagal = {
  status: 422,
  badan: {
    error: "images_required",
    message: "Tambahkan minimal satu foto produk",
    field: "images",
  },
};

function teks(nilai: unknown): string {
  return typeof nilai === "string" ? nilai.trim() : "";
}

type FotoTanpaUrl = { cloudinary_id: string; version: number | null };

export function namaAwan(env: Record<string, unknown>): string {
  const awan = teks(env.CLOUDINARY_CLOUD_NAME);
  if (!awan) throw new Error("CLOUDINARY_CLOUD_NAME belum diisi");
  return awan;
}

export function urlFoto(awan: string, f: FotoTanpaUrl): string {
  const versi = f.version ? `v${f.version}/` : "";
  return `https://res.cloudinary.com/${awan}/image/upload/${versi}${f.cloudinary_id}`;
}

export function denganUrl<F extends FotoTanpaUrl>(awan: string, f: F): F & { url: string } {
  return { ...f, url: urlFoto(awan, f) };
}

export function produkDenganUrl<P extends { images: FotoTanpaUrl[] }>(awan: string, p: P): P {
  return { ...p, images: p.images.map((f) => denganUrl(awan, f)) };
}

export function bacaKonfigCloudinary(env: Record<string, unknown>): KonfigCloudinary | null {
  const awan = teks(env.CLOUDINARY_CLOUD_NAME);
  const kunci = teks(env.CLOUDINARY_API_KEY);
  const rahasia = teks(env.CLOUDINARY_API_SECRET);

  return awan && kunci && rahasia ? { awan, kunci, rahasia } : null;
}

export function periksaFoto(f: FotoBaru): FotoBersih | null {
  const id = f.cloudinary_id.trim();
  if (!POLA_ID_FOTO.test(id)) return null;

  const width = f.width ?? null;
  const height = f.height ?? null;
  if ((width === null) !== (height === null)) return null;

  return { cloudinary_id: id, version: f.version ?? null, width, height };
}

export function periksaDaftarFoto(
  daftar: FotoBaru[] | undefined,
): { ok: true; bersih: FotoBersih[] } | ({ ok: false } & Gagal) {
  if (!daftar || daftar.length === 0) return { ok: false, ...GALAT_FOTO_WAJIB };

  if (daftar.length > FOTO_MAKS_PER_PRODUK) {
    return {
      ok: false,
      status: 422,
      badan: {
        error: "too_many_images",
        message: `Maksimal ${FOTO_MAKS_PER_PRODUK} foto per produk`,
        field: "images",
      },
    };
  }

  const bersih: FotoBersih[] = [];
  for (const f of daftar) {
    const foto = periksaFoto(f);
    if (!foto) {
      return {
        ok: false,
        status: 422,
        badan: { error: "invalid_image", message: "Data foto tidak valid", field: "images" },
      };
    }
    if (!bersih.some((b) => b.cloudinary_id === foto.cloudinary_id)) bersih.push(foto);
  }

  return { ok: true, bersih };
}

export function teksTandaTangan(param: Record<string, string>): string {
  return Object.keys(param)
    .sort()
    .map((k) => `${k}=${param[k]}`)
    .join("&");
}

export async function tandaTangan(param: Record<string, string>, rahasia: string): Promise<string> {
  const data = new TextEncoder().encode(teksTandaTangan(param) + rahasia);
  const hash = await crypto.subtle.digest("SHA-1", data);

  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

const TANDA_PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function ascii(b: Uint8Array, dari: number, sampai: number): string {
  return String.fromCharCode(...b.subarray(dari, sampai));
}

export function jenisFoto(kepala: Uint8Array): string | null {
  if (kepala[0] === 0xff && kepala[1] === 0xd8 && kepala[2] === 0xff) return "image/jpeg";
  if (TANDA_PNG.every((x, i) => kepala[i] === x)) return "image/png";
  if (ascii(kepala, 0, 4) === "RIFF" && ascii(kepala, 8, 12) === "WEBP") return "image/webp";
  return null;
}

export async function periksaBerkas(berkas: Blob): Promise<string | null> {
  if (berkas.size === 0) return "File foto kosong";
  if (berkas.size > UKURAN_FOTO_MAKS) return "Ukuran foto maksimal 10 MB";

  const kepala = new Uint8Array(await berkas.slice(0, 12).arrayBuffer());
  if (!jenisFoto(kepala)) return "Foto harus berformat JPG, PNG, atau WebP";

  return null;
}

type JawabanUnggah = {
  public_id?: string;
  version?: number;
  width?: number;
  height?: number;
  error?: { message?: string };
};

export async function unggahFoto(
  konfig: KonfigCloudinary,
  berkas: Blob,
): Promise<{ ok: true; foto: FotoBersih } | { ok: false; pesan: string }> {
  const param = {
    public_id: `${FOLDER_FOTO}/${crypto.randomUUID()}`,
    timestamp: String(Math.floor(Date.now() / 1000)),
  };

  const form = new FormData();
  form.set("file", berkas);
  form.set("public_id", param.public_id);
  form.set("timestamp", param.timestamp);
  form.set("api_key", konfig.kunci);
  form.set("signature", await tandaTangan(param, konfig.rahasia));

  const res = await fetch(`https://api.cloudinary.com/v1_1/${konfig.awan}/image/upload`, {
    method: "POST",
    body: form,
  });
  const isi = (await res.json().catch(() => ({}))) as JawabanUnggah;

  if (!res.ok || !isi.public_id || !POLA_ID_FOTO.test(isi.public_id)) {
    return { ok: false, pesan: isi.error?.message ?? `Cloudinary menjawab ${res.status}` };
  }

  return {
    ok: true,
    foto: {
      cloudinary_id: isi.public_id,
      version: isi.version ?? null,
      width: isi.width ?? null,
      height: isi.height ?? null,
    },
  };
}
