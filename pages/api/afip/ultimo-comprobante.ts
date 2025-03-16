import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const { tipo } = req.query;

    if (!tipo) {
      return res.status(400).json({ error: "Tipo de comprobante requerido" });
    }

    const tipoComprobante = parseInt(tipo as string);

    // Mapear el tipo de comprobante AFIP al tipo de comprobante en nuestra base de datos
    let tipoComprobanteDB;
    switch (tipoComprobante) {
      case 1: // Factura A
        tipoComprobanteDB = "FACTURA_A";
        break;
      case 6: // Factura B
        tipoComprobanteDB = "FACTURA_B";
        break;
      case 11: // Factura C
        tipoComprobanteDB = "FACTURA_C";
        break;
      case 3: // Nota de Crédito A
        tipoComprobanteDB = "NOTA_CREDITO_A";
        break;
      case 8: // Nota de Crédito B
        tipoComprobanteDB = "NOTA_CREDITO_B";
        break;
      case 13: // Nota de Crédito C
        tipoComprobanteDB = "NOTA_CREDITO_C";
        break;
      default:
        return res
          .status(400)
          .json({ error: "Tipo de comprobante no soportado" });
    }

    // Buscar el último comprobante de ese tipo en la base de datos
    const ultimoComprobante = await prisma.factura.findFirst({
      where: {
        tipoComprobante: tipoComprobanteDB,
        afipComprobante: {
          not: null,
        },
      },
      orderBy: {
        afipComprobante: "desc",
      },
      select: {
        afipComprobante: true,
      },
    });

    // Si no hay comprobantes, devolver 0
    if (!ultimoComprobante || !ultimoComprobante.afipComprobante) {
      return res.status(200).json({ numero: 0 });
    }

    // Devolver el último número de comprobante
    return res.status(200).json({ numero: ultimoComprobante.afipComprobante });
  } catch (error) {
    console.error("Error al obtener el último número de comprobante:", error);
    return res.status(500).json({
      error: "Error interno del servidor",
      details: error instanceof Error ? error.message : "Error desconocido",
    });
  }
}
