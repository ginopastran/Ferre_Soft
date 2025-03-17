import { prisma } from "@/lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  try {
    const { id, mes, anio } = req.query;

    if (!id || !mes || !anio) {
      return res.status(400).json({
        error: "Faltan parámetros requeridos",
        details: { id: !id, mes: !mes, anio: !anio },
      });
    }

    // Convertir a números y asegurarnos de que no son arrays
    const mesNum = parseInt(Array.isArray(mes) ? mes[0] : mes);
    const anioNum = parseInt(Array.isArray(anio) ? anio[0] : anio);
    const userId = parseInt(Array.isArray(id) ? id[0] : id);

    // Validar que sean números válidos
    if (
      isNaN(mesNum) ||
      isNaN(anioNum) ||
      isNaN(userId) ||
      mesNum < 1 ||
      mesNum > 12
    ) {
      return res
        .status(400)
        .json({ error: "Parámetros de fecha o ID inválidos" });
    }

    // Calcular el primer y último día del mes
    const primerDia = new Date(anioNum, mesNum - 1, 1);
    const ultimoDia = new Date(anioNum, mesNum, 0, 23, 59, 59, 999);

    console.log(
      `Buscando facturas pagadas para el vendedor ${userId} entre ${primerDia.toISOString()} y ${ultimoDia.toISOString()}`
    );

    // Obtener todas las facturas del vendedor que fueron pagadas en el mes especificado
    // Necesitamos encontrar facturas donde:
    // 1. El vendedor es el especificado
    // 2. La factura está en estado PAGADA
    // 3. La factura tiene al menos un pago realizado en el mes especificado

    // Primero, obtenemos las facturas del vendedor que están pagadas
    const facturas = await prisma.factura.findMany({
      where: {
        vendedorId: userId,
        estado: "PAGADA",
        pagos: {
          some: {
            // Al menos un pago en el rango de fechas
            fecha: {
              gte: primerDia,
              lte: ultimoDia,
            },
          },
        },
      },
      include: {
        cliente: {
          select: {
            nombre: true,
          },
        },
        pagos: {
          where: {
            fecha: {
              gte: primerDia,
              lte: ultimoDia,
            },
          },
          orderBy: {
            fecha: "desc",
          },
        },
      },
    });

    // Procesar los resultados para incluir la fecha del último pago
    const facturasConFechaPago = facturas.map((factura) => {
      // Obtener la fecha del último pago (ya está ordenado por fecha desc)
      const fechaPago =
        factura.pagos.length > 0 ? factura.pagos[0].fecha : factura.fecha;

      return {
        id: factura.id,
        numero: factura.numero,
        fecha: factura.fecha,
        fechaPago,
        tipoComprobante: factura.tipoComprobante,
        total: factura.total,
        estado: factura.estado,
        cliente: factura.cliente,
      };
    });

    console.log(
      `Se encontraron ${facturasConFechaPago.length} facturas pagadas en el período`
    );

    return res.status(200).json({
      facturas: facturasConFechaPago,
      periodo: {
        mes: mesNum,
        anio: anioNum,
        inicio: primerDia,
        fin: ultimoDia,
      },
    });
  } catch (error) {
    console.error("Error al obtener comisiones:", error);
    return res.status(500).json({
      error: "Error al obtener comisiones",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
