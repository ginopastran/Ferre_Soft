import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";
// @ts-ignore
import QRCode from "qrcode";
import React from "react";
import ReactDOMServer from "react-dom/server";
import { FacturaTemplate } from "../../../components/FacturaTemplate";
import { DateTime } from "luxon";
// @ts-ignore
import { jsPDF } from "jspdf";

// Importaciones condicionales según el entorno
let htmlPdf: any = null;

// En desarrollo, cargamos html-pdf-node directamente
if (process.env.NODE_ENV !== "production") {
  try {
    // @ts-ignore
    htmlPdf = require("html-pdf-node");
  } catch (error) {
    console.error("Error al cargar html-pdf-node:", error);
  }
}

// Cargar estilos CSS de manera optimizada
const getStyles = () => {
  try {
    return fs.readFileSync(
      path.join(process.cwd(), "styles/factura.css"),
      "utf8"
    );
  } catch (error) {
    console.warn(
      "No se pudo cargar el archivo CSS, usando estilos por defecto"
    );
    return `
      .wrapper { border: 1px solid #000; padding: 10px; margin-bottom: 2px; box-sizing: border-box; }
      .flex { display: flex; flex-wrap: wrap; }
      .space-between { justify-content: space-between; }
      .space-around { justify-content: space-around; }
      .text-center { text-align: center; }
      .text-left { text-align: left; }
      .text-right { text-align: right; }
      .bold { font-weight: bold; }
      .italic { font-style: italic; }
      .text-20 { font-size: 20px; }
      .no-margin { margin: 0; }
      .inline-block { display: inline-block; vertical-align: top; }
      .w50 { width: 50%; }
      .relative { position: relative; }
      .floating-mid { position: absolute; left: 45%; top: -30px; background: white; border: 1px solid black; padding: 5px 15px; transform: translateX(-50%); }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      table, th, td { border: 1px solid #000; }
      th, td { padding: 5px; }
      .small { font-size: 10px; }
      .footer { page-break-inside: avoid; margin-top: 20px; }
      @page { size: A4; margin: 0; }
      body { margin: 10mm; padding: 0; font-family: Arial, sans-serif; }
    `;
  }
};

// Timeout para evitar que se quede cargando indefinidamente
const TIMEOUT_MS = 30000; // 30 segundos

// Función para generar un PDF utilizando jsPDF en lugar de puppeteer
async function generatePdf(html: string, options: any): Promise<Buffer> {
  // En entorno de desarrollo, usamos html-pdf-node
  if (process.env.NODE_ENV !== "production") {
    console.log("[PDF] Generando PDF con html-pdf-node (desarrollo)");
    return new Promise<Buffer>((resolve, reject) => {
      htmlPdf
        .generatePdf({ content: html }, options)
        .then((buffer: Buffer) => resolve(buffer))
        .catch((err: any) => reject(err));
    });
  }

  // En producción, usamos jsPDF directamente
  console.log("[PDF] Generando PDF con jsPDF (producción)");

  return new Promise<Buffer>(async (resolve, reject) => {
    try {
      // Importar bibliotecas necesarias
      const { JSDOM } = await import("jsdom");
      // Crear un DOM en memoria con el HTML
      const dom = new JSDOM(html);
      const document = dom.window.document;

      // Crear un nuevo documento PDF con jsPDF
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      // Configurar las dimensiones
      const pageWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const margin = {
        top: parseFloat(options.margin?.top || "20") || 20,
        right: parseFloat(options.margin?.right || "20") || 20,
        bottom: parseFloat(options.margin?.bottom || "20") || 20,
        left: parseFloat(options.margin?.left || "20") || 20,
      };

      // Extraer los datos del documento
      const title = document.querySelector("title")?.textContent || "Factura";
      pdf.setProperties({ title });

      // Añadir contenido al PDF - método simple dividido en secciones
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(16);
      pdf.text("ORIGINAL", pageWidth / 2, margin.top, { align: "center" });

      // Información de la empresa
      pdf.setFontSize(14);
      pdf.text("FACTURA", pageWidth / 2, margin.top + 10, { align: "center" });

      // Datos básicos de la factura
      pdf.setFontSize(12);

      // Extraer texto de nodos principales
      const razonSocial =
        document.querySelector(".wrapper h3")?.textContent || "";
      pdf.text(razonSocial, margin.left, margin.top + 20);

      // Cabecera de factura
      const cabecera =
        document.querySelector(".floating-mid h3")?.textContent || "";
      pdf.setFontSize(18);
      pdf.text(cabecera, pageWidth - margin.right - 10, margin.top + 10, {
        align: "right",
      });

      // Información del cliente
      pdf.setFontSize(10);
      const clienteInfo = document.querySelectorAll(".wrapper b");
      let yPos = margin.top + 40;
      clienteInfo.forEach((node, index) => {
        if (index < 10) {
          // Limitar la cantidad de datos que extraemos
          const text =
            node.textContent + ": " + (node.nextSibling?.textContent || "");
          pdf.text(text, margin.left, yPos);
          yPos += 5;
        }
      });

      // Buscar datos importantes como el total
      let importeTotal = "";
      // Intentar encontrar el importe total con diferentes selectores
      const totalElementStrong = document.querySelector("span strong");
      const totalElementB = document.querySelector("span b");
      const importeTotalElement = document.querySelector(
        ".footer span:last-child"
      );

      if (totalElementStrong) {
        importeTotal = totalElementStrong.textContent || "";
      } else if (totalElementB) {
        importeTotal = totalElementB.textContent || "";
      } else if (importeTotalElement) {
        importeTotal = importeTotalElement.textContent || "";
      } else {
        // Búsqueda más general por texto que contenga "total"
        const allSpans = document.querySelectorAll("span");
        for (let i = 0; i < allSpans.length; i++) {
          const span = allSpans[i];
          if (
            span.textContent &&
            span.textContent.toLowerCase().includes("total")
          ) {
            importeTotal = span.textContent;
            break;
          }
        }
      }

      pdf.setFontSize(12);
      pdf.text(
        "Importe Total: " + importeTotal,
        pageWidth - margin.right,
        yPos + 60,
        { align: "right" }
      );

      // Añadir el código QR si está disponible
      const qrImage = document.querySelector("img[src^='data:image/']");
      if (qrImage && qrImage.getAttribute("src")) {
        pdf.addImage(
          qrImage.getAttribute("src") || "",
          "PNG",
          margin.left,
          pageHeight - margin.bottom - 30,
          30,
          30
        );
      }

      // Añadir información del CAE
      const caeInfo =
        document.querySelector(".footer")?.textContent?.trim() || "";
      pdf.setFontSize(9);
      pdf.text(
        "CAE: " + caeInfo.substring(0, 40),
        pageWidth - margin.right,
        pageHeight - margin.bottom - 10,
        { align: "right" }
      );

      // Finalizar y obtener el PDF como Buffer
      const pdfOutput = pdf.output("arraybuffer");
      resolve(Buffer.from(pdfOutput));
    } catch (error) {
      console.error("[PDF] Error al generar PDF con jsPDF:", error);
      reject(error);
    }
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const { facturaId } = req.query;

    if (!facturaId || typeof facturaId !== "string") {
      return res.status(400).json({ error: "ID de factura requerido" });
    }

    console.log(`[PDF] Iniciando generación de PDF para factura ${facturaId}`);

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

    if (
      !factura.cae &&
      factura.tipoComprobante !== "REMITO" &&
      !factura.tipoComprobante.includes("REMITO")
    ) {
      return res
        .status(400)
        .json({ error: "La factura no tiene un CAE válido" });
    }

    console.log(`[PDF] Factura encontrada, preparando datos para el template`);

    // Mapear tipo de comprobante
    const tipoComprobante =
      factura.tipoComprobante === "FACTURA_A"
        ? "A"
        : factura.tipoComprobante === "FACTURA_B"
        ? "B"
        : "C";

    // Código de comprobante
    const codigoComprobante =
      factura.tipoComprobante === "FACTURA_A"
        ? "01"
        : factura.tipoComprobante === "FACTURA_B"
        ? "06"
        : factura.tipoComprobante === "NOTA_CREDITO_A"
        ? "03"
        : factura.tipoComprobante === "NOTA_CREDITO_B"
        ? "08"
        : "11";

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
        ptoVta: 3,
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
      codigoComprobante: codigoComprobante,
      razonSocial: "FERRESOFT S.A.",
      domicilioComercial: "Av. Siempre Viva 123 - CABA",
      condicionIVA: "Responsable inscripto",
      puntoVenta: "00003",
      compNro: factura.afipComprobante
        ? String(factura.afipComprobante).padStart(8, "0")
        : factura.numero,
      fechaEmision: fechaEmision,
      cuit: process.env.AFIP_CUIT || "20461628312",
      ingresosBrutos: "12345432",
      fechaInicioActividades: "01/01/2023",
      periodoFacturadoDesde: fechaEmision,
      periodoFacturadoHasta: fechaEmision,
      fechaVtoPago: fechaVencimientoCae || fechaEmision,
      clienteCuit: factura.cliente.cuitDni || "No especificado",
      clienteNombre: factura.cliente.nombre,
      clienteCondicionIVA:
        factura.tipoComprobante === "FACTURA_A"
          ? "IVA Responsable Inscripto"
          : "Consumidor Final",
      clienteDomicilio: factura.cliente.direccion || "No especificado",
      condicionVenta: "Contado",
      detalles: factura.detalles.map((detalle) => ({
        codigo: detalle.producto.codigo || "",
        descripcion: detalle.producto.descripcion || "",
        cantidad: detalle.cantidad.toString(),
        unidadMedida: "UN",
        precioUnitario: detalle.precioUnitario.toFixed(2),
        bonificacion: "0.00",
        subtotal: (detalle.cantidad * detalle.precioUnitario).toFixed(2),
        alicuotaIVA: "21%",
        subtotalConIVA: detalle.subtotal.toFixed(2),
      })),
      importeNetoGravado: (factura.total / 1.21).toFixed(2),
      importeTotal: factura.total.toFixed(2),
      qrDataUrl: qrDataUrl,
      cae: factura.cae || "",
      fechaVencimientoCae: fechaVencimientoCae,
    };

    console.log(`[PDF] Datos preparados, renderizando componente React`);

    // Cargar estilos (optimizado)
    const facturaStyles = getStyles();

    // Renderizar el componente React a HTML
    const component = React.createElement(FacturaTemplate, facturaData);
    const html = ReactDOMServer.renderToString(component);

    // Envolver el HTML en un documento simplificado para menor uso de memoria
    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Factura ${factura.numero}</title>
          <style>
            * {box-sizing: border-box; font-family: Arial, sans-serif;}
            body {width: 21cm; min-height: 29.7cm; font-size: 13px; margin: 0; padding: 0;}
            ${facturaStyles}
          </style>
        </head>
        <body>
          <div class="page">${html}</div>
        </body>
      </html>
    `;

    console.log(`[PDF] HTML generado, creando PDF con jsPDF`);

    // Preparar opciones para la generación del PDF (optimizado)
    const options = {
      format: "a4",
      margin: { top: "20px", right: "20px", bottom: "20px", left: "20px" },
      printBackground: true,
      timeout: TIMEOUT_MS,
    };

    // Generar el PDF directamente con manejo de errores apropiado
    const pdfBuffer = await generatePdf(fullHtml, options);

    console.log(`[PDF] PDF generado, tamaño: ${pdfBuffer.length} bytes`);

    // Determinar si es nota de crédito
    const isNotaCredito = factura.tipoComprobante.includes("NOTA_CREDITO");
    const tipoFactura = factura.tipoComprobante.split("_")[1] || ""; // Extrae "A", "B", etc.

    // Crear un nombre de archivo para la descarga
    const filename = isNotaCredito
      ? `notacredito${tipoFactura.toLowerCase()}-${factura.numero}.pdf`
      : `factura${tipoFactura.toLowerCase()}-${factura.numero}.pdf`;

    // Configurar las cabeceras para descargar el PDF en lugar de visualizarlo
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", pdfBuffer.length);
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");

    // Enviar el PDF directamente como respuesta
    res.status(200).send(pdfBuffer);
  } catch (error) {
    console.error("Error al generar el PDF de la factura:", error);

    // Responder con error
    if (!res.headersSent) {
      res.status(500).json({
        error: "Error al generar el PDF de la factura",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
