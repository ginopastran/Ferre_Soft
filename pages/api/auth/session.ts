import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { NextApiRequest, NextApiResponse } from "next";
import cors from "cors";

const corsMiddleware = cors({
  origin:
    process.env.NODE_ENV === "production"
      ? ["file://"]
      : process.env.ALLOWED_ORIGIN || "http://localhost:5173",
  methods: ["GET", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization", "X-App-ID"],
});

const runMiddleware = (req: NextApiRequest, res: NextApiResponse, fn: any) => {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await runMiddleware(req, res, corsMiddleware);

  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  // Deshabilitar caché
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  // Validar APP_ID
  const appId = req.headers["x-app-id"];
  if (!appId || appId !== process.env.ALLOWED_APP_ID) {
    return res.status(403).json({
      message: "Acceso no autorizado",
      received: appId,
      expected: process.env.ALLOWED_APP_ID,
    });
  }

  try {
    const session = await getSession(req);
    console.log("Sesión obtenida:", session);

    if (!session?.user?.email) {
      console.log("No hay sesión de usuario");
      return res.status(200).json({ user: null });
    }

    const user = await prisma.usuario.findUnique({
      where: { email: session.user.email },
      include: { rol: true },
    });

    console.log("Usuario encontrado:", user);

    if (!user) {
      console.log("Usuario no encontrado en la base de datos");
      return res.status(200).json({ user: null });
    }

    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        sucursalId: user.sucursalId,
        rol: {
          id: user.rol?.id,
          nombre: user.rol?.nombre,
        },
      },
    });
  } catch (error) {
    console.error("Session error:", error);
    return res.status(200).json({ user: null });
  }
}
