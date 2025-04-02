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

// Función para generar un PDF utilizando jsPDF en lugar de puppeteer
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
                reject(innerErr);
              });
          } catch (moduleErr) {
            console.error("[PDF] Error al recargar html-pdf-node:", moduleErr);

            // Fallback a jsPDF en desarrollo
            console.log("[PDF] Usando jsPDF como fallback en desarrollo");
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
              reject(err);
            });
        }
      } catch (outerErr) {
        console.error(
          "[PDF] Error general en generación de PDF en desarrollo:",
          outerErr
        );
        reject(outerErr);
      }
    });
  }

  // En producción, usamos jsPDF directamente
  console.log("[PDF] Generando PDF con jsPDF (producción)");
  return generatePdfWithJSPDF(html, options);
}

// Función auxiliar para generar PDF con jsPDF
async function generatePdfWithJSPDF(
  html: string,
  options: any
): Promise<Buffer> {
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
      const title = document.querySelector("title")?.textContent || "Remito";
      pdf.setProperties({ title });

      // Añadir contenido al PDF - método simple dividido en secciones
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(18);
      pdf.text("REMITO", pageWidth / 2, margin.top, { align: "center" });

      // Datos del remitente
      pdf.setFontSize(14);
      const razonSocial =
        document.querySelector(".wrapper h3")?.textContent || "FERRESOFT S.A.";
      pdf.text(razonSocial, margin.left, margin.top + 15);

      // Información del remito
      pdf.setFontSize(12);
      pdf.text(
        `Remito N°: ${title.replace("Remito ", "")}`,
        pageWidth - margin.right,
        margin.top + 10,
        { align: "right" }
      );

      // Fecha
      const fechaElement =
        document.querySelector(".wrapper .text-right")?.textContent || "";
      pdf.text(
        `Fecha: ${fechaElement.replace("Fecha: ", "")}`,
        pageWidth - margin.right,
        margin.top + 15,
        { align: "right" }
      );

      // Información del cliente
      pdf.setFontSize(10);
      let yPos = margin.top + 30;

      // Cliente info
      const clienteInfoElements = document.querySelectorAll(
        ".wrapper .text-left b"
      );
      clienteInfoElements.forEach((element, index) => {
        if (index < 5) {
          // Limitamos para no sobrecargarlo
          const label = element.textContent || "";
          const value = element.nextSibling?.textContent || "";
          pdf.text(`${label} ${value}`, margin.left, yPos);
          yPos += 5;
        }
      });

      // Tabla de productos
      yPos += 10;
      pdf.setFontSize(11);
      pdf.text("Detalle de productos", margin.left, yPos);
      yPos += 5;

      // Encabezados de la tabla
      const headers = ["Código", "Descripción", "Cantidad"];
      let columnWidths = [20, pageWidth - margin.left - margin.right - 40, 20];

      // Dibujar encabezados
      pdf.setFillColor(240, 240, 240);
      pdf.rect(
        margin.left,
        yPos,
        pageWidth - margin.left - margin.right,
        8,
        "F"
      );
      pdf.setFont("helvetica", "bold");

      let xPos = margin.left;
      headers.forEach((header, i) => {
        pdf.text(header, xPos + 2, yPos + 5);
        xPos += columnWidths[i];
      });

      // Filas de productos
      yPos += 8;
      pdf.setFont("helvetica", "normal");

      // Obtener filas de la tabla
      const rows = document.querySelectorAll("table tbody tr");
      rows.forEach((row) => {
        if (yPos > pageHeight - margin.bottom - 15) {
          // Nueva página
          pdf.addPage();
          yPos = margin.top;
        }

        const cells = row.querySelectorAll("td");
        xPos = margin.left;

        // Dibujar celdas
        for (let i = 0; i < 3; i++) {
          // Solo las 3 columnas que nos interesan
          const text = cells[i]?.textContent || "";
          pdf.text(text.substring(0, 35), xPos + 2, yPos + 5); // Limitar longitud del texto
          xPos += columnWidths[i];
        }

        // Línea horizontal
        pdf.setDrawColor(200, 200, 200);
        pdf.line(margin.left, yPos + 8, pageWidth - margin.right, yPos + 8);

        yPos += 8;
      });

      // Pie de página
      yPos = pageHeight - margin.bottom - 20;
      pdf.setFont("helvetica", "italic");
      pdf.setFontSize(8);
      pdf.text(
        "Este documento no tiene validez como factura",
        margin.left,
        yPos
      );
      pdf.text(
        new Date().toLocaleDateString(),
        pageWidth - margin.right,
        yPos,
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
