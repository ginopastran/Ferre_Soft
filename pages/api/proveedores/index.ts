import { prisma } from "@/lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    try {
      const proveedores = await prisma.proveedor.findMany({
        orderBy: {
          nombre: "asc",
        },
      });
      return res.status(200).json(proveedores);
    } catch (error) {
      console.error("Error al obtener proveedores:", error);
      return res.status(500).json({ error: "Error al obtener proveedores" });
    }
  }

  if (req.method === "POST") {
    try {
      const proveedor = await prisma.proveedor.create({
        data: req.body,
      });
      return res.status(201).json(proveedor);
    } catch (error) {
      console.error("Error al crear proveedor:", error);
      return res.status(500).json({ error: "Error al crear proveedor" });
    }
  }

  return res.status(405).json({ message: "Método no permitido" });
}
