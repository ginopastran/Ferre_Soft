import { prisma } from "@/lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Utilizaremos userId como query parameter en lugar de parte de la ruta
  const { userId, includeVentas } = req.query;

  if (!userId || Array.isArray(userId) || isNaN(Number(userId))) {
    return res.status(400).json({ error: "ID de usuario inválido" });
  }

  const id = Number(userId);

  // GET - Obtener un vendedor específico
  if (req.method === "GET") {
    try {
      const usuario = await prisma.usuario.findUnique({
        where: {
          id,
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
      const totalVentas = usuario.Factura
        ? usuario.Factura.reduce((sum, factura) => sum + factura.total, 0)
        : 0;

      const totalPagado = usuario.pagosRecibidos
        ? usuario.pagosRecibidos.reduce((sum, pago) => sum + pago.monto, 0)
        : 0;

      const comisionTotal = (totalVentas * usuario.comision) / 100;

      // Crear una nueva respuesta limpia sin las propiedades que pueden causar problemas
      const vendedorConTotales = {
        id: usuario.id,
        nombre: usuario.nombre,
        dni: usuario.dni,
        telefono: usuario.telefono,
        email: usuario.email,
        comision: usuario.comision,
        sucursalId: usuario.sucursalId,
        sucursal: usuario.sucursal
          ? {
              id: usuario.sucursal.id,
              nombre: usuario.sucursal.nombre,
              ubicacion: usuario.sucursal.ubicacion,
            }
          : null,
        totalVentas,
        totalPagado,
        montoPendiente: comisionTotal - totalPagado,
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
        (isNaN(Number(comision)) ||
          Number(comision) < 0 ||
          Number(comision) > 100)
      ) {
        return res.status(400).json({ error: "Comisión inválida" });
      }

      // Construir objeto de actualización
      const updateData: any = {};

      if (comision !== undefined) {
        updateData.comision = Number(comision);
      }

      if (sucursalId !== undefined) {
        updateData.sucursalId = Number(sucursalId);
      }

      // Actualizar vendedor
      const vendedor = await prisma.usuario.update({
        where: { id },
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
      const totalVentas = vendedor.Factura
        ? vendedor.Factura.reduce((sum, factura) => sum + factura.total, 0)
        : 0;

      const totalPagado = vendedor.pagosRecibidos
        ? vendedor.pagosRecibidos.reduce((sum, pago) => sum + pago.monto, 0)
        : 0;

      const comisionTotal = (totalVentas * vendedor.comision) / 100;

      // Crear una respuesta limpia
      const vendedorConTotales = {
        id: vendedor.id,
        nombre: vendedor.nombre,
        dni: vendedor.dni,
        telefono: vendedor.telefono,
        email: vendedor.email,
        comision: vendedor.comision,
        sucursalId: vendedor.sucursalId,
        sucursal: vendedor.sucursal
          ? {
              id: vendedor.sucursal.id,
              nombre: vendedor.sucursal.nombre,
              ubicacion: vendedor.sucursal.ubicacion,
            }
          : null,
        totalVentas,
        totalPagado,
        montoPendiente: comisionTotal - totalPagado,
      };

      return res.status(200).json(vendedorConTotales);
    } catch (error) {
      console.error("Error al actualizar vendedor:", error);
      return res.status(500).json({ error: "Error al actualizar el vendedor" });
    }
  }

  return res.status(405).json({ message: "Método no permitido" });
}
