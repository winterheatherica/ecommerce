import { NextResponse, type NextRequest } from "next/server";

const COOKIE_ADMIN = "adm";
const HALAMAN_MASUK = "/masuk-admin";

function denganIpPembeli(request: NextRequest): NextResponse {
  const kepala = new Headers(request.headers);
  const ip = request.headers.get("cf-connecting-ip");

  if (ip) kepala.set("x-toko-ip", ip);
  else kepala.delete("x-toko-ip");

  return NextResponse.next({ request: { headers: kepala } });
}

function keHalamanMasuk(request: NextRequest): NextResponse {
  const tujuan = request.nextUrl.clone();
  tujuan.pathname = HALAMAN_MASUK;
  tujuan.search = `?next=${encodeURIComponent(request.nextUrl.pathname + request.nextUrl.search)}`;
  return NextResponse.redirect(tujuan);
}

export default function proxy(request: NextRequest) {
  const jalur = request.nextUrl.pathname;

  if (jalur.startsWith("/api/")) return denganIpPembeli(request);

  if (jalur.startsWith("/admin") && !request.cookies.get(COOKIE_ADMIN)?.value) {
    return keHalamanMasuk(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*"],
};
