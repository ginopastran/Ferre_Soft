import { prisma } from "@/lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  try {
    const { proveedorId, porcentaje } = req.body;

    // Obtener el proveedor
    const proveedor = await prisma.proveedor.findUnique({
      where: { id: proveedorId },
    });

    if (!proveedor) {
      return res.status(404).json({ message: "Proveedor no encontrado" });
    }

    // Actualizar todos los productos del proveedor
    const productos = await prisma.producto.updateMany({
      where: {
        proveedor: proveedor.nombre, // Asumiendo que usamos el nombre del proveedor en los productos
      },
      data: {
        precioCosto: {
          multiply: 1 + porcentaje / 100,
        },
      },
    });

    // Recalcular precios finales para todos los productos afectados
    const productosActualizar = await prisma.producto.findMany({
      where: {
        proveedor: proveedor.nombre,
      },
    });

    for (const producto of productosActualizar) {
      const precioConIva = producto.precioCosto * (1 + producto.iva / 100);
      await prisma.producto.update({
        where: { id: producto.id },
        data: {
          precioFinal1: precioConIva * (1 + producto.margenGanancia1 / 100),
          precioFinal2: precioConIva * (1 + producto.margenGanancia2 / 100),
        },
      });
    }

    return res
      .status(200)
      .json({ message: "Precios actualizados correctamente" });
  } catch (error) {
    console.error("Error al actualizar precios:", error);
    return res.status(500).json({ error: "Error al actualizar precios" });
  }
}
