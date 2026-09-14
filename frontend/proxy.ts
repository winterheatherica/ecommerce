import { NextResponse, type NextRequest } from "next/server";

const WILAYAH = 'Basic realm="Menik Store Admin", charset="UTF-8"';

function samaAman(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  let beda = 0;
  for (let i = 0; i < a.length; i++) {
    beda |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return beda === 0;
}

function mintaMasuk(pesan: string): NextResponse {
  return new NextResponse(pesan, {
    status: 401,
    headers: {
      "WWW-Authenticate": WILAYAH,
      "content-type": "text/plain; charset=utf-8",
    },
  });
}

export default function proxy(request: NextRequest) {
  const pengguna = process.env.ADMIN_USER?.trim();
  const sandi = process.env.ADMIN_PASSWORD?.trim();

  if (!pengguna || !sandi) {
    return new NextResponse("Admin belum dikonfigurasi.", {
      status: 503,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  const header = request.headers.get("authorization") ?? "";
  const cocok = header.match(/^Basic\s+(.+)$/i);

  if (!cocok) return mintaMasuk("Perlu masuk.");

  let dikirim = "";

  try {
    dikirim = atob(cocok[1].trim());
  } catch {
    return mintaMasuk("Kredensial tidak terbaca.");
  }

  if (!samaAman(dikirim, `${pengguna}:${sandi}`)) {
    return mintaMasuk("Pengguna atau sandi salah.");
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
