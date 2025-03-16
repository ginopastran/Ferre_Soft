import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";

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

    // Mapear tipo de comprobante
    const tipoComprobante =
      factura.tipoComprobante === "FACTURA_A"
        ? "A"
        : factura.tipoComprobante === "FACTURA_B"
        ? "B"
        : "C";

    // Formatear fecha
    const fechaEmision = new Date(factura.fecha).toLocaleDateString();
    const fechaVencimientoCae = factura.vencimientoCae
      ? new Date(factura.vencimientoCae).toLocaleDateString()
      : "";

    // Generar código QR para la factura
    const qrData = `https://www.afip.gob.ar/fe/qr/?p=${Buffer.from(
      JSON.stringify({
        ver: 1,
        fecha: fechaEmision,
        cuit: process.env.AFIP_CUIT || "20461628312",
        ptoVta: 1,
        tipoCmp: tipoComprobante === "A" ? 1 : tipoComprobante === "B" ? 6 : 11,
        nroCmp: factura.afipComprobante || 0,
        importe: factura.total,
        moneda: "PES",
        ctz: 1,
        tipoCodAut: "E",
        codAut: factura.cae,
      })
    ).toString("base64")}`;

    const qrDataUrl = await QRCode.toDataURL(qrData);

    // Crear un nuevo documento PDF
    const doc = new PDFDocument({ size: "A4", margin: 50 });

    // Configurar la respuesta
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename=factura_simple_${factura.numero || facturaId}.pdf`
    );

    // Pipe el PDF a la respuesta
    doc.pipe(res);

    // Agregar contenido al PDF
    doc.fontSize(20).text("FACTURA", { align: "center" });
    doc.moveDown();

    // Tipo de comprobante
    doc.fontSize(24).text(`TIPO ${tipoComprobante}`, { align: "center" });
    doc.moveDown();

    // Información de la empresa
    doc.fontSize(12).text("FERRESOFT S.A.", { align: "left" });
    doc.fontSize(10).text(`CUIT: ${process.env.AFIP_CUIT || "20461628312"}`);
    doc.text("Domicilio: Av. Siempre Viva 123 - CABA");
    doc.text(`Condición frente al IVA: Responsable inscripto`);
    doc.moveDown();

    // Información de la factura
    doc
      .fontSize(10)
      .text(
        `Punto de Venta: 00001 Comp. Nro: ${String(
          factura.afipComprobante || ""
        ).padStart(8, "0")}`
      );
    doc.text(`Fecha de Emisión: ${fechaEmision}`);
    doc.moveDown();

    // Información del cliente
    doc.fontSize(12).text("Información del Cliente", { underline: true });
    doc.fontSize(10).text(`CUIT: ${factura.cliente.cuitDni}`);
    doc.text(`Nombre/Razón Social: ${factura.cliente.nombre}`);
    doc.text(
      `Condición frente al IVA: ${
        factura.tipoComprobante === "FACTURA_A"
          ? "IVA Responsable Inscripto"
          : "Consumidor Final"
      }`
    );
    doc.text(`Domicilio: ${factura.cliente.direccion || "No especificado"}`);
    doc.moveDown();

    // Tabla de productos
    doc.fontSize(12).text("Detalle de Productos", { underline: true });

    // Encabezados de la tabla
    const tableTop = doc.y + 10;
    const tableHeaders = [
      "Código",
      "Descripción",
      "Cant.",
      "Precio Unit.",
      "Subtotal",
    ];
    const columnWidths = [60, 200, 50, 100, 100];

    let currentX = doc.x;

    // Dibujar encabezados
    tableHeaders.forEach((header, i) => {
      doc
        .fontSize(10)
        .text(header, currentX, tableTop, {
          width: columnWidths[i],
          align: "left",
        });
      currentX += columnWidths[i];
    });

    // Línea después de los encabezados
    doc
      .moveTo(doc.x, tableTop + 20)
      .lineTo(doc.x + 510, tableTop + 20)
      .stroke();

    // Contenido de la tabla
    let tableY = tableTop + 30;

    // Agregar filas de productos
    factura.detalles.forEach((detalle) => {
      currentX = doc.x;

      // Verificar si necesitamos una nueva página
      if (tableY > 700) {
        doc.addPage();
        tableY = doc.y + 10;
      }

      // Código
      doc
        .fontSize(9)
        .text(detalle.producto.codigo, currentX, tableY, {
          width: columnWidths[0],
          align: "left",
        });
      currentX += columnWidths[0];

      // Descripción
      doc
        .fontSize(9)
        .text(detalle.producto.descripcion, currentX, tableY, {
          width: columnWidths[1],
          align: "left",
        });
      currentX += columnWidths[1];

      // Cantidad
      doc
        .fontSize(9)
        .text(detalle.cantidad.toFixed(2), currentX, tableY, {
          width: columnWidths[2],
          align: "right",
        });
      currentX += columnWidths[2];

      // Precio unitario
      doc
        .fontSize(9)
        .text(detalle.precioUnitario.toFixed(2), currentX, tableY, {
          width: columnWidths[3],
          align: "right",
        });
      currentX += columnWidths[3];

      // Subtotal
      doc
        .fontSize(9)
        .text(detalle.subtotal.toFixed(2), currentX, tableY, {
          width: columnWidths[4],
          align: "right",
        });

      tableY += 20;
    });

    // Línea después de los productos
    doc
      .moveTo(doc.x, tableY)
      .lineTo(doc.x + 510, tableY)
      .stroke();
    tableY += 20;

    // Totales
    doc
      .fontSize(10)
      .text(
        `Importe Neto Gravado: $${factura.total.toFixed(2)}`,
        doc.x + 310,
        tableY,
        { width: 200, align: "right" }
      );
    tableY += 20;
    doc
      .fontSize(10)
      .text(
        `Importe Total: $${factura.total.toFixed(2)}`,
        doc.x + 310,
        tableY,
        { width: 200, align: "right" }
      );

    // Mover a la parte inferior para la información de CAE
    doc.fontSize(10).text(`CAE N°: ${factura.cae}`, 50, 750);
    doc.text(`Fecha de Vto. de CAE: ${fechaVencimientoCae}`);

    // Agregar código QR
    doc.image(qrDataUrl, 400, 730, { width: 80 });

    // Finalizar el PDF
    doc.end();
  } catch (error) {
    console.error("Error en el endpoint de PDF simple:", error);
    return res.status(500).json({
      error: "Error interno del servidor",
      details: error instanceof Error ? error.message : "Error desconocido",
    });
  }
}
