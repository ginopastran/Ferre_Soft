import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const { facturaId } = req.body;

    if (!facturaId) {
      return res.status(400).json({ error: "ID de remito requerido" });
    }

    // Obtener datos del remito
    const remito = await prisma.factura.findUnique({
      where: { id: facturaId },
      include: {
        cliente: true,
        detalles: {
          include: {
            producto: true,
          },
        },
      },
    });

    if (!remito) {
      return res.status(404).json({ error: "Remito no encontrado" });
    }

    if (remito.tipoComprobante !== "REMITO") {
      return res.status(400).json({ error: "El comprobante no es un remito" });
    }

    if (remito.estado === "ANULADA") {
      return res.status(400).json({ error: "El remito ya está anulado" });
    }

    // Generar un número para la nota de crédito de remito
    const ultimaNotaCredito = await prisma.factura.findFirst({
      where: {
        tipoComprobante: "NOTA_CREDITO_REMITO",
      },
      orderBy: {
        numero: "desc",
      },
    });

    // Generar un nuevo número para la nota de crédito
    let nuevoNumero = "NCR-0001";
    if (ultimaNotaCredito && ultimaNotaCredito.numero.startsWith("NCR-")) {
      const ultimoNumero = parseInt(ultimaNotaCredito.numero.substring(4));
      nuevoNumero = `NCR-${(ultimoNumero + 1).toString().padStart(4, "0")}`;
    }

    // Crear la nota de crédito en la base de datos usando una transacción
    const notaCredito = await prisma.$transaction(async (tx) => {
      // 1. Crear la nota de crédito
      const nc = await tx.factura.create({
        data: {
          numero: nuevoNumero,
          fecha: new Date(),
          tipoComprobante: "NOTA_CREDITO_REMITO",
          total: remito.total,
          pagado: remito.total,
          estado: "PAGADA",
          clienteId: remito.clienteId,
          vendedorId: remito.vendedorId,
          facturaAnuladaId: remito.id,
        },
      });

      // 2. Crear los detalles de la nota de crédito
      for (const detalle of remito.detalles) {
        await tx.detalleFactura.create({
          data: {
            facturaId: nc.id,
            productoId: detalle.productoId,
            cantidad: detalle.cantidad,
            precioUnitario: detalle.precioUnitario,
            subtotal: detalle.subtotal,
          },
        });

        // 3. Devolver el stock de los productos
        await tx.producto.update({
          where: { id: detalle.productoId },
          data: {
            stock: {
              increment: detalle.cantidad,
            },
          },
        });
      }

      // 4. Actualizar el estado del remito original a ANULADA
      await tx.factura.update({
        where: { id: remito.id },
        data: { estado: "ANULADA" },
      });

      return nc;
    });

    return res.status(200).json({
      success: true,
      message: "Remito anulado correctamente mediante nota de crédito",
      notaCredito: {
        id: notaCredito.id,
        numero: notaCredito.numero,
      },
    });
  } catch (error) {
    console.error("Error al crear nota de crédito de remito:", error);
    return res.status(500).json({
      error: "Error interno del servidor",
      details: error instanceof Error ? error.message : "Error desconocido",
    });
  }
}
