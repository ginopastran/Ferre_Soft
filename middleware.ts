// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

export async function middleware(req: NextRequest) {
  console.log("Middleware ejecutándose en:", req.nextUrl.pathname);

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

  console.log("Cookies en middleware:", {
    token: token ? "presente" : "ausente",
    userData: userData ? "presente" : "ausente",
  });

  // Redirigir a login si no hay token o userData
  if (!token?.value || !userData?.value) {
    console.log("Redirigiendo a login (no hay token o userData)");
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

    console.log("Usuario autenticado:", {
      email: user.email,
      rol: user.rol?.nombre,
      payload,
    });

    if (!user.email || !user.rol) {
      console.log("Datos de usuario inválidos");
      throw new Error("Datos de usuario inválidos");
    }

    // Redirecciones específicas
    if (req.nextUrl.pathname === "/") {
      let redirectUrl;
      if (user.rol.nombre === "ADMIN" || user.rol.nombre === "SUPERADMIN") {
        redirectUrl = new URL("/admin/reporte", req.url);
        console.log("Redirigiendo admin a:", redirectUrl.pathname);
        return NextResponse.redirect(redirectUrl);
      } else if (user.rol.nombre === "VENDEDOR") {
        redirectUrl = new URL("/admin/ventas", req.url);
        console.log("Redirigiendo vendedor a:", redirectUrl.pathname);
        return NextResponse.redirect(redirectUrl);
      }
    }

    // Proteger rutas de admin
    if (req.nextUrl.pathname.startsWith("/admin")) {
      if (user.rol.nombre === "VENDEDOR") {
        // Si es vendedor, solo permitir acceso a /admin/ventas
        if (!req.nextUrl.pathname.startsWith("/admin/ventas")) {
          console.log(
            "Vendedor intentando acceder a ruta protegida, redirigiendo a /admin/ventas"
          );
          return NextResponse.redirect(new URL("/admin/ventas", req.url));
        }
      } else if (
        user.rol.nombre !== "ADMIN" &&
        user.rol.nombre !== "SUPERADMIN"
      ) {
        // Si no es admin ni vendedor, redirigir a login
        console.log(
          "Usuario sin permisos intentando acceder a /admin, redirigiendo a login"
        );
        return NextResponse.redirect(new URL("/login", req.url));
      }
    }

    console.log("Acceso permitido a:", req.nextUrl.pathname);
    return NextResponse.next();
  } catch (error) {
    // Limpiar cookies y redirigir a login
    console.error("Error en middleware:", error);
    const response = NextResponse.redirect(new URL("/login", req.url));
    response.cookies.delete("token");
    response.cookies.delete("userData");
    return response;
  }
}

export const config = {
  matcher: "/((?!api|_next/static|_next/image|favicon.ico).*)",
};
