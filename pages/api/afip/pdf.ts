import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";
import QRCode from "qrcode";
import React from "react";
import ReactDOMServer from "react-dom/server";
import { FacturaTemplate } from "../../../components/FacturaTemplate";
import htmlPdf from "html-pdf-node";

// Leer los estilos CSS
const facturaStyles = fs.readFileSync(
  path.join(process.cwd(), "styles/factura.css"),
  "utf8"
);

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

    // Preparar los datos para el componente
    const facturaData = {
      tipoComprobante: tipoComprobante,
      codigoComprobante:
        tipoComprobante === "A" ? "01" : tipoComprobante === "B" ? "06" : "11",
      razonSocial: "FERRESOFT S.A.",
      domicilioComercial: "Av. Siempre Viva 123 - CABA",
      condicionIVA: "Responsable inscripto",
      puntoVenta: "00001",
      compNro: String(factura.afipComprobante || "").padStart(8, "0"),
      fechaEmision: fechaEmision,
      cuit: process.env.AFIP_CUIT || "20461628312",
      ingresosBrutos: "12345432",
      fechaInicioActividades: fechaEmision,
      periodoFacturadoDesde: fechaEmision,
      periodoFacturadoHasta: fechaEmision,
      fechaVtoPago: fechaEmision,
      clienteCuit: factura.cliente.cuitDni,
      clienteNombre: factura.cliente.nombre,
      clienteCondicionIVA:
        factura.tipoComprobante === "FACTURA_A"
          ? "IVA Responsable Inscripto"
          : "Consumidor Final",
      clienteDomicilio: factura.cliente.direccion || "No especificado",
      condicionVenta: "Efectivo",
      detalles: factura.detalles.map((detalle) => ({
        codigo: detalle.producto.codigo,
        descripcion: detalle.producto.descripcion,
        cantidad: detalle.cantidad.toFixed(2),
        unidadMedida: "Unidad",
        precioUnitario: detalle.precioUnitario.toFixed(2),
        bonificacion: "0,00",
        subtotal: detalle.subtotal.toFixed(2),
        alicuotaIVA: "21%",
        subtotalConIVA: (detalle.subtotal * 1.21).toFixed(2),
      })),
      importeNetoGravado: factura.total.toFixed(2),
      importeTotal: factura.total.toFixed(2),
      qrDataUrl: qrDataUrl,
      cae: factura.cae,
      fechaVencimientoCae: fechaVencimientoCae,
    };

    // Renderizar el componente React a HTML
    const html = ReactDOMServer.renderToString(
      React.createElement(FacturaTemplate, facturaData)
    );

    // Envolver el HTML en un documento completo
    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Factura</title>
          <style>
            * {
              box-sizing: border-box;
              font-family: Arial, sans-serif;
            }
            body {
              width: 21cm;
              min-height: 29.7cm;
              font-size: 13px;
              margin: 0;
              padding: 0;
            }
            ${facturaStyles}
          </style>
        </head>
        <body>
          <div class="page">
            ${html}
          </div>
        </body>
      </html>
    `;

    // Configuración para html-pdf-node
    const options = {
      format: "A4",
      printBackground: true,
      margin: { top: "10mm", right: "10mm", bottom: "10mm", left: "10mm" },
    };

    // Crear el archivo PDF
    const file = { content: fullHtml };

    // Generar el PDF
    const pdfBuffer = await htmlPdf.generatePdf(file, options);

    // Configurar headers para descarga
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Length", pdfBuffer.length);
    res.setHeader(
      "Content-Disposition",
      `inline; filename=factura_afip_${factura.numero || facturaId}.pdf`
    );

    // Enviar el PDF
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Error en el endpoint de PDF de AFIP:", error);
    return res.status(500).json({
      error: "Error interno del servidor",
      details: error instanceof Error ? error.message : "Error desconocido",
    });
  }
}
