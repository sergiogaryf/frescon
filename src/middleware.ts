import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Proteger rutas /admin (excepto login)
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const cookie = request.cookies.get("fa_admin");
    const pin    = process.env.ADMIN_PIN ?? "frescon2024";
    if (!cookie || !safeEqual(cookie.value, pin)) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  // Proteger ruta repartidor (solo /repartidor/ruta)
  if (pathname.startsWith("/repartidor/ruta")) {
    const cookie = request.cookies.get("fa_rep");
    const pin    = process.env.REPARTIDOR_PIN ?? "1234";
    if (!cookie || !safeEqual(cookie.value, pin)) {
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

  // Headers de seguridad para todas las respuestas
  const response = NextResponse.next();

  // Prevenir clickjacking
  response.headers.set("X-Frame-Options", "DENY");

  // Prevenir MIME type sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");

  // Protección XSS básica (navegadores legacy)
  response.headers.set("X-XSS-Protection", "1; mode=block");

  // Control de referrer
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // HSTS — forzar HTTPS (solo en producción)
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains"
    );
  }

  // Permissions Policy — restringir APIs del navegador
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(self), payment=(self)"
  );

  // Content Security Policy
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://apis.google.com",
      "style-src 'self' 'unsafe-inline' https://accounts.google.com https://fonts.googleapis.com",
      "img-src 'self' data: blob: https: http:",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://accounts.google.com https://oauth2.googleapis.com https://api.airtable.com",
      "frame-src https://accounts.google.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ")
  );

  return response;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/repartidor/ruta",
    "/encargado/compras",
    // Headers de seguridad para todas las páginas (no para assets estáticos)
    "/((?!_next/static|_next/image|favicon.ico|images|icon.png).*)",
  ],
};
