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

  const { id } = req.query;

  if (!id || Array.isArray(id)) {
    return res.status(400).json({ message: "ID inválido" });
  }

  const emailId = parseInt(id);

  if (isNaN(emailId)) {
    return res.status(400).json({ message: "ID debe ser un número" });
  }

  // Manejar PUT - Actualizar estado de un email (activar/desactivar)
  if (req.method === "PUT") {
    const { activo } = req.body;

    if (typeof activo !== "boolean") {
      return res
        .status(400)
        .json({
          message: "El campo 'activo' es requerido y debe ser booleano",
        });
    }

    try {
      const emailActualizado = await prisma.emailPermitido.update({
        where: { id: emailId },
        data: { activo },
      });

      return res.status(200).json(emailActualizado);
    } catch (error) {
      console.error("Error al actualizar email permitido:", error);
      return res
        .status(500)
        .json({ message: "Error al actualizar email permitido" });
    }
  }

  // Manejar DELETE - Eliminar un email permitido
  if (req.method === "DELETE") {
    try {
      await prisma.emailPermitido.delete({
        where: { id: emailId },
      });

      return res.status(204).end();
    } catch (error) {
      console.error("Error al eliminar email permitido:", error);
      return res
        .status(500)
        .json({ message: "Error al eliminar email permitido" });
    }
  }

  // Método no permitido
  return res.status(405).json({ message: "Método no permitido" });
}
