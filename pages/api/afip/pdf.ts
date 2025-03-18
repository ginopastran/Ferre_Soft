import { NextApiRequest, NextApiResponse } from "next";
import chromium from "chrome-aws-lambda";
import { prisma } from "@/lib/prisma";
import { generatePDFContent } from "@/lib/afip/pdf-template";
import { PaperFormat } from "puppeteer-core";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { facturaId } = req.query;

  if (!facturaId || typeof facturaId !== "string") {
    return res.status(400).json({ error: "ID de factura no válido" });
  }

  try {
    // Obtener la factura con sus detalles
    const factura = await prisma.factura.findUnique({
      where: { id: facturaId },
      include: {
        cliente: true,
        detalles: {
          include: {
            producto: {
              select: {
                codigo: true,
                descripcion: true,
              },
            },
          },
        },
      },
    });

    if (!factura) {
      return res.status(404).json({ error: "Factura no encontrada" });
    }

    // Generar el contenido HTML
    const html = await generatePDFContent(factura);

    // Inicializar el navegador
    const browser = await chromium.puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: true,
    });

    // Crear una nueva página
    const page = await browser.newPage();
    await page.setContent(html);

    // Generar el PDF
    const pdf = await page.pdf({
      format: "a4" as PaperFormat,
      printBackground: true,
      margin: {
        top: "20px",
        right: "20px",
        bottom: "20px",
        left: "20px",
      },
    });

    await browser.close();

    // Configurar los headers de la respuesta
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=factura-${factura.numero}.pdf`
    );

    // Enviar el PDF
    res.send(pdf);
  } catch (error) {
    console.error("Error al generar el PDF:", error);
    res.status(500).json({ error: "Error al generar el PDF" });
  }
}
