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
    req.nextUrl.pathname === "/catalogo" ||
    req.nextUrl.pathname === "/api/productos/catalogo" ||
    req.nextUrl.pathname.startsWith("/api/") ||
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
  const userData = req.cookies.get("userData");

  // Redirigir a login si no hay token o userData
  if (!token?.value || !userData?.value) {
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

    const user = JSON.parse(userData.value);

    if (!user.email || !user.rol) {
      throw new Error("Datos de usuario inválidos");
    }

    // Redirecciones específicas
    if (req.nextUrl.pathname === "/") {
      if (user.rol.nombre === "ADMIN") {
        return NextResponse.redirect(new URL("/admin/reporte", req.url));
      } else if (user.rol.nombre === "VENDEDOR") {
        return NextResponse.redirect(new URL("/admin/ventas", req.url));
      }
    }

    // Proteger rutas de admin
    if (req.nextUrl.pathname.startsWith("/admin")) {
      if (user.rol.nombre === "VENDEDOR") {
        // Si es vendedor, solo permitir acceso a /admin/ventas
        if (!req.nextUrl.pathname.startsWith("/admin/ventas")) {
          return NextResponse.redirect(new URL("/admin/ventas", req.url));
        }
      } else if (user.rol.nombre !== "ADMIN") {
        // Si no es admin ni vendedor, redirigir a login
        return NextResponse.redirect(new URL("/login", req.url));
      }
    }

    return NextResponse.next();
  } catch (error) {
    // Limpiar cookies y redirigir a login
    const response = NextResponse.redirect(new URL("/login", req.url));
    response.cookies.delete("token");
    response.cookies.delete("userData");
    return response;
  }
}

export const config = {
  matcher: "/((?!api|_next/static|_next/image|favicon.ico).*)",
};
