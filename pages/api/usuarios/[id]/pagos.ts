import { prisma } from "@/lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id, mes, anio } = req.query;

  // Validar el ID
  if (!id || Array.isArray(id) || isNaN(Number(id))) {
    return res.status(400).json({ error: "ID de usuario inválido" });
  }

  const userId = Number(id);

  // GET - Obtener los pagos de un vendedor
  if (req.method === "GET") {
    try {
      // Construir el filtro de consulta
      const whereCondition: any = {
        vendedorId: userId,
      };

      // Si se especifica mes y año, filtrar por esos valores
      if (mes && anio) {
        const mesNum = parseInt(Array.isArray(mes) ? mes[0] : mes);
        const anioNum = parseInt(Array.isArray(anio) ? anio[0] : anio);

        if (!isNaN(mesNum) && !isNaN(anioNum)) {
          whereCondition.mesComision = mesNum;
          whereCondition.anioComision = anioNum;
        }
      }

      // Obtener los pagos
      const pagos = await prisma.pagoVendedor.findMany({
        where: whereCondition,
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

  // POST - Crear un nuevo pago
  if (req.method === "POST") {
    try {
      const { monto, metodoPago, observaciones, mesComision, anioComision } =
        req.body;

      // Validar datos
      if (
        !monto ||
        isNaN(monto) ||
        monto <= 0 ||
        !metodoPago ||
        (mesComision && isNaN(mesComision)) ||
        (anioComision && isNaN(anioComision))
      ) {
        return res.status(400).json({ error: "Datos de pago inválidos" });
      }

      // Crear el pago
      const pago = await prisma.pagoVendedor.create({
        data: {
          vendedorId: userId,
          monto,
          metodoPago,
          observaciones,
          esComision: mesComision && anioComision ? true : false,
          mesComision: mesComision || null,
          anioComision: anioComision || null,
        },
      });

      return res.status(201).json(pago);
    } catch (error) {
      console.error("Error al crear pago:", error);
      return res.status(500).json({ error: "Error al registrar el pago" });
    }
  }

  return res.status(405).json({ message: "Método no permitido" });
}
