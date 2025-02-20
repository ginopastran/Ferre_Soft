import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    try {
      const sucursales = await prisma.sucursal.findMany();
      return res.status(200).json(sucursales);
    } catch (error) {
      return res.status(500).json({ message: "Error al obtener sucursales" });
    }
  }

  if (req.method === "POST") {
    const { nombre, ubicacion } = req.body;

    if (!nombre || !ubicacion) {
      return res.status(400).json({
        message: "Nombre y ubicación son requeridos",
      });
    }

    try {
      const nuevaSucursal = await prisma.sucursal.create({
        data: {
          nombre,
          ubicacion,
        },
      });
      return res.status(201).json(nuevaSucursal);
    } catch (error) {
      return res.status(500).json({ message: "Error al crear la sucursal" });
    }
  }

  return res.status(405).json({ message: "Método no permitido" });
}
