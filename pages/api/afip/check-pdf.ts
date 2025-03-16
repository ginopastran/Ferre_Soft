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
    const { facturaId } = req.query;

    if (!facturaId) {
      return res.status(400).json({ error: "ID de factura requerido" });
    }

    // Obtener datos de la factura
    const factura = await prisma.factura.findUnique({
      where: { id: facturaId as string },
      include: {
        cliente: true,
      },
    });

    if (!factura) {
      return res.status(404).json({ error: "Factura no encontrada" });
    }

    if (!factura.cae) {
      return res
        .status(400)
        .json({ error: "La factura no tiene CAE asignado" });
    }

    if (!factura.afipComprobante) {
      return res
        .status(400)
        .json({ error: "La factura no tiene número de comprobante AFIP" });
    }

    // Verificar que el cliente tenga CUIT/DNI
    if (!factura.cliente.cuitDni) {
      return res
        .status(400)
        .json({ error: "El cliente no tiene CUIT/DNI asignado" });
    }

    // Si todo está bien, devolver OK
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error al verificar factura para PDF:", error);
    return res.status(500).json({
      error: "Error interno del servidor",
      details: error instanceof Error ? error.message : "Error desconocido",
    });
  }
}
