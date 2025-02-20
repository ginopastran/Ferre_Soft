import { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { SignJWT } from "jose"; // Importa el método de firma de jwt
import cors from "cors";

// Inicializar el middleware CORS
const corsMiddleware = cors({
  origin:
    process.env.NODE_ENV === "production"
      ? ["file://"]
      : process.env.ALLOWED_ORIGIN || "http://localhost:5173",
  methods: ["POST", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization", "X-App-ID"],
});

// Wrapper para promisificar el middleware
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

  if (req.method === "POST") {
    const appId = req.headers["x-app-id"];
    if (!appId || appId !== process.env.ALLOWED_APP_ID) {
      return res.status(403).json({ message: "Acceso no autorizado" });
    }

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Faltan campos requeridos" });
    }

    try {
      const user = await prisma.usuario.findUnique({
        where: { email },
        include: { rol: true },
      });

      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ message: "Credenciales incorrectas" });
      }

      // Crear el token
      const jwt = await new SignJWT({
        userId: user.id,
        email: user.email,
        role: user.rol?.nombre || null,
      })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("24h")
        .sign(new TextEncoder().encode(process.env.JWT_SECRET));

      // Modificar cómo se establece la cookie para que funcione con Electron
      res.setHeader(
        "Set-Cookie",
        `token=${jwt}; Path=/; Max-Age=86400; HttpOnly; SameSite=None; Secure`
      );

      console.log("Token generado:", jwt);
      console.log("Cookie establecida en el login");

      return res.status(200).json({
        message: "Login exitoso",
        user: {
          id: user.id,
          nombre: user.nombre,
          email: user.email,
          rol: user.rol,
        },
        token: jwt, // Enviar el token en la respuesta también
      });
    } catch (error) {
      console.error("Error en login:", error);
      return res.status(500).json({ message: "Error en el servidor" });
    }
  }
  return res.status(405).json({ message: "Método no permitido" });
}
