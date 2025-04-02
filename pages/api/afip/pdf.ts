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

// En producción, intentamos usar chrome-aws-lambda, pero lo hacemos de manera dinámica
// para evitar errores en entorno local
let chromium: any = null;
let puppeteer: any = null;

// Solo cargar chrome-aws-lambda en producción
if (process.env.NODE_ENV === "production") {
  try {
    // Importaciones dinámicas para entorno de producción
    import("chrome-aws-lambda")
      .then((module) => {
        chromium = module.default;
      })
      .catch((err) => {
        console.error("Error al cargar chrome-aws-lambda:", err);
      });

    import("puppeteer-core")
      .then((module) => {
        puppeteer = module.default;
      })
      .catch((err) => {
        console.error("Error al cargar puppeteer-core:", err);
      });
  } catch (error) {
    console.error(
      "Error al intentar importar dependencias de producción:",
      error
    );
  }
}

// Leer los estilos CSS
let facturaStyles: string;
try {
  facturaStyles = fs.readFileSync(
    path.join(process.cwd(), "styles/factura.css"),
    "utf8"
  );
} catch (error) {
  console.warn("No se pudo cargar el archivo CSS, usando estilos por defecto");
  facturaStyles = `
    .wrapper {
      border: 1px solid #000;
      padding: 10px;
      margin-bottom: 2px;
      box-sizing: border-box;
    }
    
    .flex {
      display: flex;
      flex-wrap: wrap;
    }
    
    .space-between {
      justify-content: space-between;
    }
    
    .space-around {
      justify-content: space-around;
    }
    
    .text-center {
      text-align: center;
    }
    
    .text-left {
      text-align: left;
    }
    
    .text-right {
      text-align: right;
    }
    
    .bold {
      font-weight: bold;
    }
    
    .italic {
      font-style: italic;
    }
    
    .text-20 {
      font-size: 20px;
    }
    
    .no-margin {
      margin: 0;
    }
    
    .inline-block {
      display: inline-block;
      vertical-align: top;
    }
    
    .w50 {
      width: 50%;
    }
    
    .relative {
      position: relative;
    }
    
    .floating-mid {
      position: absolute;
      left: 45%;
      top: -30px;
      background: white;
      border: 1px solid black;
      padding: 5px 15px;
      transform: translateX(-50%);
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    
    table, th, td {
      border: 1px solid #000;
    }
    
    th, td {
      padding: 5px;
    }
    
    .small {
      font-size: 10px;
    }
    
    .footer {
      page-break-inside: avoid;
      margin-top: 20px;
    }
    
    @page {
      size: A4;
      margin: 0;
    }
    
    body {
      margin: 10mm;
      padding: 0;
      font-family: Arial, sans-serif;
    }
  `;
}

// Timeout para evitar que se quede cargando indefinidamente
const TIMEOUT_MS = 30000; // 30 segundos

// Función para generar un PDF, con diferente implementación según el entorno
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

  // En producción, usamos chrome-aws-lambda y puppeteer-core
  console.log("[PDF] Generando PDF con chrome-aws-lambda (producción)");

  // Importar las dependencias de manera sincrónica para asegurar que están disponibles
  try {
    if (!chromium) chromium = require("chrome-aws-lambda");
    if (!puppeteer) puppeteer = require("puppeteer-core");
  } catch (error) {
    console.error("[PDF] Error al importar dependencias:", error);
  }

  if (!chromium || !puppeteer) {
    throw new Error(
      "No se pudieron cargar las dependencias para generar PDF en producción"
    );
  }

  let browser = null;
  try {
    // Inicializar el navegador con configuración para entorno serverless
    console.log("[PDF] Iniciando navegador para generar PDF");
    browser = await puppeteer.launch({
      args: [
        ...chromium.args,
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
      executablePath: process.env.CHROME_BIN || (await chromium.executablePath),
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    // Crear una nueva página
    const page = await browser.newPage();

    // Configurar el tiempo de espera
    await page.setDefaultNavigationTimeout(TIMEOUT_MS);

    // Establecer el contenido HTML
    await page.setContent(html, { waitUntil: "networkidle0" });

    // Configurar el tamaño de la página (A4)
    await page.setViewport({ width: 794, height: 1123 });

    // Generar el PDF
    const pdfBuffer = await page.pdf({
      format: "a4",
      printBackground: true,
      margin: {
        top: "20px",
        right: "20px",
        bottom: "20px",
        left: "20px",
      },
    });

    return pdfBuffer;
  } catch (error) {
    console.error("[PDF] Error al generar PDF con puppeteer:", error);
    throw error;
  } finally {
    // Cerrar el navegador para liberar recursos
    if (browser) {
      await browser.close();
    }
  }
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

    // Renderizar el componente React a HTML
    const component = React.createElement(FacturaTemplate, facturaData);
    const html = ReactDOMServer.renderToString(component);

    // Envolver el HTML en un documento completo
    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Factura ${factura.numero}</title>
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

    console.log(`[PDF] HTML generado, creando PDF`);

    // Preparar opciones para la generación del PDF
    const options = {
      format: "a4",
      margin: { top: "20px", right: "20px", bottom: "20px", left: "20px" },
      printBackground: true,
      timeout: TIMEOUT_MS,
    };

    // Crear una promesa para la generación del PDF
    const pdfPromise = generatePdf(fullHtml, options);

    // Race entre la generación del PDF y el timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Timeout después de ${TIMEOUT_MS}ms`));
      }, TIMEOUT_MS);
    });

    const pdfBuffer = (await Promise.race([
      pdfPromise,
      timeoutPromise,
    ])) as Buffer;

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
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

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
