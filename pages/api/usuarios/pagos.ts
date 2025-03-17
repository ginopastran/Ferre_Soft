import { prisma } from "@/lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { userId } = req.query;

  if (!userId || Array.isArray(userId) || isNaN(Number(userId))) {
    return res.status(400).json({ error: "ID de usuario inválido" });
  }

  const id = Number(userId);

  // POST - Crear un nuevo pago
  if (req.method === "POST") {
    try {
      const { monto, metodoPago, observaciones, mesComision, anioComision } =
        req.body;

      // Validar datos
      if (!monto || !metodoPago) {
        return res.status(400).json({
          error: "Faltan datos requeridos",
          details: { monto: !monto, metodoPago: !metodoPago },
        });
      }

      // Crear el pago con los datos adicionales de comisión si están presentes
      const pago = await prisma.pagoVendedor.create({
        data: {
          vendedorId: id,
          monto: Number(monto),
          metodoPago,
          observaciones,
          // Agregar datos de comisión si están presentes
          ...(mesComision && anioComision
            ? {
                mesComision,
                anioComision,
                esComision: true,
              }
            : {}),
        },
      });

      return res.status(201).json(pago);
    } catch (error) {
      console.error("Error al registrar pago:", error);
      return res.status(500).json({ error: "Error al registrar el pago" });
    }
  }

  // GET - Obtener pagos de un vendedor
  if (req.method === "GET") {
    try {
      const { mes, anio } = req.query;

      let whereClause: any = {
        vendedorId: id,
      };

      // Si se especifican mes y año, filtrar por esos valores
      if (mes && anio) {
        whereClause = {
          ...whereClause,
          mesComision: parseInt(mes as string),
          anioComision: parseInt(anio as string),
          esComision: true,
        };
      }

      const pagos = await prisma.pagoVendedor.findMany({
        where: whereClause,
        orderBy: {
          fecha: "desc",
        },
      });

      return res.status(200).json(pagos);
    } catch (error) {
      console.error("Error al obtener pagos:", error);
      return res.status(500).json({ error: "Error al obtener los pagos" });
    }
  }

  return res.status(405).json({ message: "Método no permitido" });
}
