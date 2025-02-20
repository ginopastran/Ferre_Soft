import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (req.method === "PUT") {
    try {
      const { sucursalId } = req.body;
      const usuarioActualizado = await prisma.usuario.update({
        where: { id: Number(id) },
        data: { sucursalId },
        include: {
          sucursal: true,
          rol: true,
        },
      });
      return res.status(200).json(usuarioActualizado);
    } catch (error) {
      return res.status(500).json({ message: "Error al actualizar usuario" });
    }
  }

  return res.status(405).json({ message: "Método no permitido" });
}
