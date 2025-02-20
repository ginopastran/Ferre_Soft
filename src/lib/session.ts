import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { NextApiRequest } from "next";
import type { ReadonlyHeaders } from "next/dist/server/web/spec-extension/adapters/headers";
import type { IncomingHttpHeaders } from "http";

interface SessionUser {
  email: string;
  id: number;
  role: string;
}

export async function getSession(
  request: Request | NextApiRequest | ReadonlyHeaders
) {
  let token: string | undefined;

  // Agregar logs para debuggear
  console.log("Tipo de request:", request.constructor.name);

  if ("headers" in request) {
    // Intentar obtener el token del header de Authorization
    const authHeader =
      typeof request.headers.get === "function"
        ? request.headers.get("authorization")
        : (request.headers as IncomingHttpHeaders)["authorization"];
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
  }

  if (request instanceof Request) {
    const cookieStore = await cookies();
    token = cookieStore.get("token")?.value;
  } else if ("cookies" in request) {
    // Para NextApiRequest
    token = request.cookies.token;
    console.log("Cookie encontrada en NextApiRequest:", token);
  } else {
    // Para otros tipos de requests
    const cookieHeader = request.get ? request.get("cookie") : null;
    console.log("Cookie header:", cookieHeader);

    if (cookieHeader) {
      const cookies = cookieHeader.split(";").reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split("=");
        acc[key] = value;
        return acc;
      }, {} as Record<string, string>);

      token = cookies.token;
    }
  }

  console.log("Token encontrado:", token);

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET as string)
    );

    console.log("Payload decodificado:", payload);

    return {
      user: {
        email: payload.email as string,
        id: payload.userId as number,
        role: payload.role as string,
      },
    };
  } catch (err) {
    console.error("Error en la sesión:", err);
    return null;
  }
}
