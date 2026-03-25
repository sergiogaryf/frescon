import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Proteger rutas /admin (excepto login)
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const cookie = request.cookies.get("fa_admin");
    const pin    = process.env.ADMIN_PIN ?? "frescon2024";
    if (!cookie || cookie.value !== pin) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  // Proteger ruta repartidor (solo /repartidor/ruta)
  if (pathname.startsWith("/repartidor/ruta")) {
    const cookie = request.cookies.get("fa_rep");
    const pin    = process.env.REPARTIDOR_PIN ?? "1234";
    if (!cookie || cookie.value !== pin) {
      return NextResponse.redirect(new URL("/repartidor", request.url));
    }
  }

  // Proteger rutas /encargado/compras (cookie existe = autenticado via API)
  if (pathname.startsWith("/encargado/compras")) {
    const cookie = request.cookies.get("fa_enc");
    if (!cookie || !cookie.value) {
      return NextResponse.redirect(new URL("/encargado", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/repartidor/ruta", "/encargado/compras"],
};
