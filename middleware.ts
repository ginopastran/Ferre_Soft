// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

export async function middleware(req: NextRequest) {
  // Permitir acceso a archivos públicos y rutas de autenticación
  if (
    req.nextUrl.pathname === "/manifest.json" ||
    req.nextUrl.pathname === "/login" ||
    req.nextUrl.pathname === "/register" ||
    req.nextUrl.pathname.startsWith("/icons/") ||
    req.nextUrl.pathname === "/sw.js" ||
    req.nextUrl.pathname.startsWith("/workbox-") ||
    req.nextUrl.pathname.includes("worker") ||
    req.nextUrl.pathname === "/offline" ||
    req.headers.get("online") === "false"
  ) {
    if (req.nextUrl.pathname === "/sw.js") {
      const response = NextResponse.next();
      response.headers.set("Content-Type", "application/javascript");
      return response;
    }
    return NextResponse.next();
  }

  const token = req.cookies.get("token");

  // Redirigir a login si no hay token (excepto para rutas públicas)
  if (!token || !token.value) {
    if (req.nextUrl.pathname === "/") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    // Si estamos offline, permitir acceso
    if (req.headers.get("online") === "false") {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    const { payload } = await jwtVerify(
      token.value,
      new TextEncoder().encode(process.env.JWT_SECRET)
    );

    if (!payload.email || !payload.role) {
      throw new Error("Token inválido");
    }

    // Redirecciones específicas
    if (req.nextUrl.pathname === "/") {
      if (payload.role === "ADMIN") {
        return NextResponse.redirect(new URL("/admin/reporte", req.url));
      } else {
        return NextResponse.redirect(new URL("/cart", req.url));
      }
    }

    return NextResponse.next();
  } catch (error) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: "/((?!api|_next/static|_next/image|favicon.ico).*)",
};
