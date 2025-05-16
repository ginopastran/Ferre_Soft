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

      // Asegurar que todos los proveedores tengan una fecha de creación válida
      const proveedoresConFecha = proveedores.map((proveedor) => {
        if (!proveedor.creadoEn) {
          // Si no hay fecha, asignar la fecha actual
          return {
            ...proveedor,
            creadoEn: new Date(),
            createdAt: new Date(), // Para compatibilidad con la interfaz
          };
        }
        // Asegurar que createdAt esté disponible para la interfaz
        return {
          ...proveedor,
          createdAt: proveedor.creadoEn,
        };
      });

      return res.status(200).json(proveedoresConFecha);
    } catch (error) {
      console.error("Error al obtener proveedores:", error);
      return res.status(500).json({ error: "Error al obtener proveedores" });
    }
  }

  if (req.method === "POST") {
    try {
      const data = {
        ...req.body,
        creadoEn: new Date(),
        actualizadoEn: new Date(),
      };

      const proveedor = await prisma.proveedor.create({
        data,
      });

      return res.status(201).json({
        ...proveedor,
        createdAt: proveedor.creadoEn, // Para compatibilidad con la interfaz
      });
    } catch (error) {
      console.error("Error al crear proveedor:", error);
      return res.status(500).json({ error: "Error al crear proveedor" });
    }
  }

  return res.status(405).json({ message: "Método no permitido" });
}
