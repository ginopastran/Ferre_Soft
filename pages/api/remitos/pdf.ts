import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";
import React from "react";
import ReactDOMServer from "react-dom/server";
import { RemitoTemplate } from "../../../components/RemitoTemplate";
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
      path.join(process.cwd(), "styles/remito.css"),
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

// Función para generar un PDF utilizando las diferentes estrategias según el entorno
async function generatePdf(html: string, options: any): Promise<Buffer> {
  // En entorno de desarrollo, usamos html-pdf-node
  if (process.env.NODE_ENV !== "production") {
    console.log("[PDF] Generando PDF con html-pdf-node (desarrollo)");
    return new Promise<Buffer>((resolve, reject) => {
      try {
        if (!htmlPdf || !htmlPdf.generatePdf) {
          console.error(
            "[PDF] Error: html-pdf-node no está cargado correctamente",
            { htmlPdf }
          );

          // Intentar cargar de nuevo
          try {
            // @ts-ignore
            const htmlPdfModule = require("html-pdf-node");
            console.log("[PDF] Reintento de carga de html-pdf-node:", {
              loaded: !!htmlPdfModule,
              hasGeneratePdf: !!htmlPdfModule.generatePdf,
            });

            htmlPdfModule
              .generatePdf({ content: html }, options)
              .then((buffer: Buffer) => {
                console.log(
                  "[PDF] PDF generado exitosamente con html-pdf-node en desarrollo"
                );
                resolve(buffer);
              })
              .catch((innerErr: any) => {
                console.error(
                  "[PDF] Error interno al generar PDF con html-pdf-node:",
                  innerErr
                );
                console.log(
                  "[PDF] Usando Puppeteer como fallback en desarrollo"
                );
                generatePdfWithJSPDF(html, options).then(resolve).catch(reject);
              });
          } catch (moduleErr) {
            console.error("[PDF] Error al recargar html-pdf-node:", moduleErr);

            // Fallback a Puppeteer en desarrollo
            console.log("[PDF] Usando Puppeteer como fallback en desarrollo");
            generatePdfWithJSPDF(html, options).then(resolve).catch(reject);
          }
        } else {
          htmlPdf
            .generatePdf({ content: html }, options)
            .then((buffer: Buffer) => {
              console.log("[PDF] PDF generado exitosamente con html-pdf-node");
              resolve(buffer);
            })
            .catch((err: any) => {
              console.error(
                "[PDF] Error al generar PDF con html-pdf-node:",
                err
              );
              console.log("[PDF] Usando Puppeteer como fallback en desarrollo");
              generatePdfWithJSPDF(html, options).then(resolve).catch(reject);
            });
        }
      } catch (outerErr) {
        console.error(
          "[PDF] Error general en generación de PDF en desarrollo:",
          outerErr
        );
        console.log("[PDF] Usando Puppeteer como última opción");
        generatePdfWithJSPDF(html, options).then(resolve).catch(reject);
      }
    });
  }

  // En producción, usamos Puppeteer directamente
  console.log("[PDF] Generando PDF con Puppeteer (producción)");
  return generatePdfWithJSPDF(html, options);
}

// Función auxiliar para generar PDF con Puppeteer
async function generatePdfWithJSPDF(
  html: string,
  options: any
): Promise<Buffer> {
  return new Promise<Buffer>(async (resolve, reject) => {
    try {
      console.log("[PDF] Configurando Puppeteer para la generación de PDF");

      // Importamos los módulos necesarios
      const chromium = (await import("@sparticuz/chromium")).default;
      const puppeteer = (await import("puppeteer-core")).default;

      let browser = null;

      try {
        // Inicializar el navegador con Puppeteer
        browser = await puppeteer.launch({
          args: chromium.args,
          defaultViewport: chromium.defaultViewport,
          executablePath: await chromium.executablePath(),
          headless: true,
          ignoreHTTPSErrors: true,
        });

        console.log("[PDF] Navegador iniciado correctamente");

        // Crear una nueva página
        const page = await browser.newPage();

        // Configurar la página para tamaño A4
        await page.setViewport({
          width: 794, // A4 a 96dpi
          height: 1123,
          deviceScaleFactor: 2, // Para mejor calidad
        });

        console.log("[PDF] Cargando HTML en la página");

        // Cargar el HTML en la página
        await page.setContent(html, {
          waitUntil: "networkidle0",
          timeout: 30000,
        });

        console.log("[PDF] HTML cargado, generando PDF");

        // Generar el PDF
        const pdfBuffer = await page.pdf({
          format: "a4",
          printBackground: true,
          margin: {
            top: "0mm",
            right: "0mm",
            bottom: "0mm",
            left: "0mm",
          },
        });

        console.log("[PDF] PDF generado correctamente con Puppeteer");

        // Cerrar el navegador
        if (browser) {
          await browser.close();
        }

        resolve(pdfBuffer);
      } catch (error) {
        console.error("[PDF] Error al generar PDF con Puppeteer:", error);

        // Asegurarse de cerrar el navegador en caso de error
        if (browser) {
          try {
            await browser.close();
          } catch (closeError) {
            console.error("[PDF] Error al cerrar el navegador:", closeError);
          }
        }

        reject(error);
      }
    } catch (error) {
      console.error("[PDF] Error en la configuración de Puppeteer:", error);
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
            .page {
              width: 21cm;
              min-height: 29.7cm;
              padding: 2cm;
              margin: 0;
              background: white;
            }
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
              left: 50%;
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
            ${getStyles()}
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
