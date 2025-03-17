import { prisma } from "@/lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (!id || isNaN(Number(id))) {
    return res.status(400).json({ error: "ID de usuario inválido" });
  }

  // GET - Obtener un vendedor específico
  if (req.method === "GET") {
    try {
      const { includeVentas } = req.query;

      const usuario = await prisma.usuario.findUnique({
        where: {
          id: Number(id),
          rol: {
            nombre: "VENDEDOR",
          },
        },
        include: {
          sucursal: true,
          Factura:
            includeVentas === "true"
              ? {
                  select: {
                    total: true,
                  },
                }
              : false,
          pagosRecibidos: true,
        },
      });

      if (!usuario) {
        return res.status(404).json({ error: "Vendedor no encontrado" });
      }

      // Calcular totales
      const totalVentas =
        usuario.Factura?.reduce((sum, factura) => sum + factura.total, 0) || 0;
      const totalPagado =
        usuario.pagosRecibidos?.reduce((sum, pago) => sum + pago.monto, 0) || 0;
      const comisionTotal = (totalVentas * usuario.comision) / 100;

      const vendedorConTotales = {
        ...usuario,
        totalVentas,
        totalPagado,
        montoPendiente: comisionTotal - totalPagado,
        Factura: undefined,
        pagosRecibidos: undefined,
      };

      return res.status(200).json(vendedorConTotales);
    } catch (error) {
      console.error("Error al obtener vendedor:", error);
      return res.status(500).json({ error: "Error al obtener el vendedor" });
    }
  }

  // PUT - Actualizar un vendedor
  if (req.method === "PUT") {
    try {
      const { comision, sucursalId } = req.body;

      // Validar datos
      if (
        comision !== undefined &&
        (isNaN(comision) || comision < 0 || comision > 100)
      ) {
        return res.status(400).json({ error: "Comisión inválida" });
      }

      // Construir objeto de actualización
      const updateData: any = {};

      if (comision !== undefined) {
        updateData.comision = comision;
      }

      if (sucursalId !== undefined) {
        updateData.sucursalId = sucursalId;
      }

      // Actualizar vendedor
      const vendedor = await prisma.usuario.update({
        where: { id: Number(id) },
        data: updateData,
        include: {
          sucursal: true,
          Factura: {
            select: {
              total: true,
            },
          },
          pagosRecibidos: true,
        },
      });

      // Calcular totales
      const totalVentas =
        vendedor.Factura?.reduce((sum, factura) => sum + factura.total, 0) || 0;
      const totalPagado =
        vendedor.pagosRecibidos?.reduce((sum, pago) => sum + pago.monto, 0) ||
        0;
      const comisionTotal = (totalVentas * vendedor.comision) / 100;

      const vendedorConTotales = {
        ...vendedor,
        totalVentas,
        totalPagado,
        montoPendiente: comisionTotal - totalPagado,
        Factura: undefined,
        pagosRecibidos: undefined,
      };

      return res.status(200).json(vendedorConTotales);
    } catch (error) {
      console.error("Error al actualizar vendedor:", error);
      return res.status(500).json({ error: "Error al actualizar el vendedor" });
    }
  }

  return res.status(405).json({ message: "Método no permitido" });
}
