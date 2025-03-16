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
      return res.status(400).json({ error: "ID de factura requerido" });
    }

    // Obtener datos de la factura
    const factura = await prisma.factura.findUnique({
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

    if (!factura) {
      return res.status(404).json({ error: "Factura no encontrada" });
    }

    if (!factura.cae) {
      return res
        .status(400)
        .json({ error: "La factura no tiene CAE asignado" });
    }

    if (factura.estado === "ANULADA") {
      return res.status(400).json({ error: "La factura ya está anulada" });
    }

    // Determinar el tipo de comprobante para la nota de crédito
    let tipoNotaCredito;
    switch (factura.tipoComprobante) {
      case "FACTURA_A":
        tipoNotaCredito = "NOTA_CREDITO_A";
        break;
      case "FACTURA_B":
        tipoNotaCredito = "NOTA_CREDITO_B";
        break;
      case "FACTURA_C":
        tipoNotaCredito = "NOTA_CREDITO_C";
        break;
      default:
        return res
          .status(400)
          .json({ error: "Tipo de comprobante no soportado para anulación" });
    }

    // Generar un número para la nota de crédito
    const ultimaNotaCredito = await prisma.factura.findFirst({
      where: {
        tipoComprobante: tipoNotaCredito,
      },
      orderBy: {
        numero: "desc",
      },
    });

    // Generar un nuevo número para la nota de crédito
    let nuevoNumero = "NC-0001";
    if (ultimaNotaCredito && ultimaNotaCredito.numero.startsWith("NC-")) {
      const ultimoNumero = parseInt(ultimaNotaCredito.numero.substring(3));
      nuevoNumero = `NC-${(ultimoNumero + 1).toString().padStart(4, "0")}`;
    }

    // Generar un CAE simulado para la nota de crédito
    const cae = Math.floor(Math.random() * 10000000000000)
      .toString()
      .padStart(14, "0");

    // Fecha de vencimiento del CAE (10 días después de la fecha actual)
    const fechaActual = new Date();
    const fechaVencimiento = new Date(fechaActual);
    fechaVencimiento.setDate(fechaVencimiento.getDate() + 10);

    // Crear la nota de crédito en la base de datos usando una transacción
    const notaCredito = await prisma.$transaction(async (tx) => {
      // 1. Crear la nota de crédito
      const nc = await tx.factura.create({
        data: {
          numero: nuevoNumero,
          fecha: new Date(),
          tipoComprobante: tipoNotaCredito,
          total: factura.total,
          pagado: factura.total,
          estado: "PAGADA",
          cae: cae,
          vencimientoCae: fechaVencimiento.toISOString(),
          afipComprobante: factura.afipComprobante
            ? factura.afipComprobante + 1
            : 1,
          clienteId: factura.clienteId,
          vendedorId: factura.vendedorId,
          facturaAnuladaId: factura.id,
        },
      });

      // 2. Crear los detalles de la nota de crédito
      for (const detalle of factura.detalles) {
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

      // 4. Actualizar el estado de la factura original a ANULADA
      await tx.factura.update({
        where: { id: factura.id },
        data: { estado: "ANULADA" },
      });

      return nc;
    });

    return res.status(200).json({
      success: true,
      message: "Factura anulada correctamente mediante nota de crédito",
      notaCredito: {
        id: notaCredito.id,
        numero: notaCredito.numero,
        cae: notaCredito.cae,
      },
    });
  } catch (error) {
    console.error("Error al crear nota de crédito:", error);
    return res.status(500).json({
      error: "Error interno del servidor",
      details: error instanceof Error ? error.message : "Error desconocido",
    });
  }
}
