// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Lista de rutas públicas que no requieren autenticación
const PUBLIC_ROUTES = [
  "/login",
  "/register",
  "/offline",
  "/catalogo",
  "/catalogo-tabla",
];

// Lista de rutas de recursos estáticos y API que no deben ser bloqueadas
const EXCLUDED_ROUTES = [
  "/manifest.json",
  "/icons/",
  "/sw.js",
  "/workbox-",
  "/api/",
  "/favicon.ico",
  "/_next/",
];

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  console.log("Middleware ejecutándose en:", pathname);

  // Verificar si es una ruta pública o un recurso estático
  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
  const isExcludedRoute = EXCLUDED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );
  const isOfflineMode = req.headers.get("online") === "false";

  // Permitir acceso directo a rutas públicas, recursos excluidos o en modo offline
  if (isPublicRoute || isExcludedRoute || isOfflineMode) {
    // Asegurar que los archivos de service worker tengan el tipo MIME correcto
    if (pathname === "/sw.js") {
      const response = NextResponse.next();
      response.headers.set("Content-Type", "application/javascript");
      return response;
    }

    // Para rutas públicas (no APIs ni recursos estáticos), configurar nocache
    if (isPublicRoute && !pathname.startsWith("/api/")) {
      const response = NextResponse.next();
      response.headers.set("Cache-Control", "no-store, max-age=0");
      return response;
    }

    return NextResponse.next();
  }

  // Obtener token y datos de usuario
  const token = req.cookies.get("token");
  const userData = req.cookies.get("userData");

  console.log("Cookies en middleware:", {
    token: token ? "presente" : "ausente",
    userData: userData ? "presente" : "ausente",
  });

  // Redirigir a login si no hay token o userData
  if (!token?.value || !userData?.value) {
    console.log("Redirigiendo a login (no hay token o userData)");
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    // Verificar validez del token
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

    // Redirecciones específicas para la página principal
    if (pathname === "/") {
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
    if (pathname.startsWith("/admin")) {
      if (user.rol.nombre === "VENDEDOR") {
        // Si es vendedor, solo permitir acceso a /admin/ventas
        if (!pathname.startsWith("/admin/ventas")) {
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

    console.log("Acceso permitido a:", pathname);

    // Asegurar que la respuesta no se almacene en caché para rutas protegidas
    const response = NextResponse.next();
    response.headers.set("Cache-Control", "no-store, max-age=0");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    return response;
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
  matcher: ["/((?!_next/static|_next/image).*)"],
};
