import { prisma } from "@/lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    try {
      const rubros = await prisma.rubro.findMany({
        orderBy: {
          nombre: "asc",
        },
      });
      return res.status(200).json(rubros);
    } catch (error) {
      console.error("Error al obtener rubros:", error);
      return res.status(500).json({ error: "Error al obtener rubros" });
    }
  }

  if (req.method === "POST") {
    try {
      const rubro = await prisma.rubro.create({
        data: req.body,
      });
      return res.status(201).json(rubro);
    } catch (error) {
      console.error("Error al crear rubro:", error);
      return res.status(500).json({ error: "Error al crear rubro" });
    }
  }

  if (req.method === "PUT") {
    try {
      const { nombre, descripcion, nombreAnterior } = req.body;

      // Primero actualizamos el rubro
      const rubroActualizado = await prisma.rubro.update({
        where: { nombre: nombreAnterior },
        data: {
          nombre,
          descripcion,
        },
      });

      // Luego actualizamos todos los productos que usan este rubro
      await prisma.producto.updateMany({
        where: { rubro: nombreAnterior },
        data: { rubro: nombre },
      });

      return res.status(200).json(rubroActualizado);
    } catch (error) {
      console.error("Error al actualizar rubro:", error);
      return res.status(500).json({ error: "Error al actualizar rubro" });
    }
  }

  return res.status(405).json({ error: "Método no permitido" });
}
