import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Verificar la autenticación
  const session = await getSession(req);
  if (!session) {
    return res.status(401).json({ message: "No autenticado" });
  }

  // Verificar si el usuario es SUPERADMIN
  if (session.role !== "SUPERADMIN") {
    return res.status(403).json({ message: "No autorizado" });
  }

  // Manejar GET - Listar todos los emails permitidos
  if (req.method === "GET") {
    try {
      const emailsPermitidos = await prisma.emailPermitido.findMany({
        orderBy: { creadoEn: "desc" },
      });
      return res.status(200).json(emailsPermitidos);
    } catch (error) {
      console.error("Error al obtener emails permitidos:", error);
      return res
        .status(500)
        .json({ message: "Error al obtener emails permitidos" });
    }
  }

  // Manejar POST - Crear un nuevo email permitido
  if (req.method === "POST") {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "El email es requerido" });
    }

    try {
      // Verificar si ya existe
      const emailExistente = await prisma.emailPermitido.findUnique({
        where: { email },
      });

      if (emailExistente) {
        // Si existe pero está inactivo, activarlo
        if (!emailExistente.activo) {
          const emailActualizado = await prisma.emailPermitido.update({
            where: { id: emailExistente.id },
            data: { activo: true },
          });
          return res.status(200).json(emailActualizado);
        }
        return res.status(400).json({ message: "El email ya está permitido" });
      }

      // Crear nuevo email permitido
      const nuevoEmail = await prisma.emailPermitido.create({
        data: {
          email,
          creadoPor: session.email || "unknown",
        },
      });

      return res.status(201).json(nuevoEmail);
    } catch (error) {
      console.error("Error al crear email permitido:", error);
      return res
        .status(500)
        .json({ message: "Error al crear email permitido" });
    }
  }

  // Método no permitido
  return res.status(405).json({ message: "Método no permitido" });
}
