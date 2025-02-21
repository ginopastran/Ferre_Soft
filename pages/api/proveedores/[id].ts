import { prisma } from "@/lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (req.method === "GET") {
    try {
      const proveedor = await prisma.proveedor.findUnique({
        where: { id: Number(id) },
      });

      if (!proveedor) {
        return res.status(404).json({ message: "Proveedor no encontrado" });
      }

      return res.status(200).json(proveedor);
    } catch (error) {
      console.error("Error al obtener proveedor:", error);
      return res.status(500).json({ error: "Error al obtener proveedor" });
    }
  }

  if (req.method === "PUT") {
    try {
      const proveedor = await prisma.proveedor.update({
        where: { id: Number(id) },
        data: req.body,
      });

      return res.status(200).json(proveedor);
    } catch (error) {
      console.error("Error al actualizar proveedor:", error);
      return res.status(500).json({ error: "Error al actualizar proveedor" });
    }
  }

  return res.status(405).json({ message: "Método no permitido" });
}
