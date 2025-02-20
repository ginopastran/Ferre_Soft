import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (req.method === "PUT") {
    try {
      const { nombre, ubicacion } = req.body;
      const sucursalActualizada = await prisma.sucursal.update({
        where: { id: Number(id) },
        data: { nombre, ubicacion },
      });
      return res.status(200).json(sucursalActualizada);
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Error al actualizar la sucursal" });
    }
  }

  return res.status(405).json({ message: "Método no permitido" });
}
