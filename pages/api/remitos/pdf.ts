import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";
import React from "react";
import ReactDOMServer from "react-dom/server";
import { RemitoTemplate } from "../../../components/RemitoTemplate";

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
let remitoStyles: string;
try {
  remitoStyles = fs.readFileSync(
    path.join(process.cwd(), "styles/remito.css"),
    "utf8"
  );
} catch (error) {
  console.warn("No se pudo cargar el archivo CSS, usando estilos por defecto");
  remitoStyles = `
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
  if (!chromium || !puppeteer) {
    throw new Error(
      "No se pudieron cargar las dependencias para generar PDF en producción"
    );
  }

  let browser = null;
  try {
    // Inicializar el navegador
    console.log("[PDF] Iniciando navegador para generar PDF");
    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath,
      headless: true,
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

  // Configurar un timeout para evitar que se quede cargando indefinidamente
  const timeoutPromise = new Promise<Buffer>((_, reject) => {
    setTimeout(() => reject(new Error("Timeout generando PDF")), TIMEOUT_MS);
  });

  try {
    const { remitoId } = req.query;

    if (!remitoId || typeof remitoId !== "string") {
      return res.status(400).json({ error: "ID de remito requerido" });
    }

    console.log(`[PDF] Iniciando generación de PDF para remito ${remitoId}`);

    // Obtener datos del remito
    const remito = await prisma.factura.findUnique({
      where: {
        id: remitoId,
        tipoComprobante: "REMITO",
      },
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

    console.log(`[PDF] Remito encontrado, preparando datos para el template`);

    // Formatear fecha
    const fechaEmision = new Date(remito.fecha).toLocaleDateString();

    // Preparar los datos para el componente
    const remitoData = {
      numero: remito.numero,
      fecha: fechaEmision,
      razonSocial: "FERRESOFT S.A.",
      domicilioComercial: "Av. Siempre Viva 123 - CABA",
      clienteNombre: remito.cliente.nombre,
      clienteCuit: remito.cliente.cuitDni || "No especificado",
      clienteDomicilio: remito.cliente.direccion || "No especificado",
      detalles: remito.detalles.map((detalle) => ({
        codigo: detalle.producto.codigo || "",
        descripcion: detalle.producto.descripcion || "",
        cantidad: detalle.cantidad.toString(),
      })),
    };

    console.log(`[PDF] Datos preparados, renderizando componente React`);

    // Renderizar el componente React a HTML
    const component = React.createElement(RemitoTemplate, remitoData);
    const html = ReactDOMServer.renderToString(component);

    // Envolver el HTML en un documento completo
    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Remito ${remito.numero}</title>
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
            ${remitoStyles}
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

    // Configuración para html-pdf-node
    const options = {
      format: "A4",
      printBackground: true,
      margin: {
        top: "20px",
        right: "20px",
        bottom: "20px",
        left: "20px",
      },
      timeout: TIMEOUT_MS,
    };

    // Crear una promesa para la generación del PDF
    const pdfPromise = generatePdf(fullHtml, options);

    // Race entre la generación del PDF y el timeout
    const pdfBuffer = (await Promise.race([
      pdfPromise,
      timeoutPromise,
    ])) as Buffer;

    console.log(`[PDF] PDF generado, tamaño: ${pdfBuffer.length} bytes`);

    // Crear un nombre de archivo para la descarga
    const filename = `remito-${remito.numero}.pdf`;

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
    console.error("Error al generar el PDF del remito:", error);

    // Responder con error
    if (!res.headersSent) {
      res.status(500).json({
        error: "Error al generar el PDF del remito",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
