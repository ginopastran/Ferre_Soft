import { NextApiRequest, NextApiResponse } from "next";
import { exec } from "child_process";
import path from "path";
import fs from "fs/promises";
import os from "os";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  try {
    const orderData = req.body;

    if (process.env.NODE_ENV === "production") {
      try {
        // Intentar imprimir localmente primero
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const printResponse = await fetch("http://localhost:3001/print", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(orderData),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (printResponse.ok) {
          return res
            .status(200)
            .json({ message: "Ticket impreso correctamente" });
        }
        throw new Error("Impresión local no disponible");
      } catch (error) {
        // Si falla la impresión local, guardar en base de datos
        const ticketPendiente = await prisma.ticketPendiente.create({
          data: {
            orderData,
            estado: "PENDIENTE",
            createdAt: new Date(),
          },
        });

        return res.status(200).json({
          message: "Ticket en cola de impresión",
          ticketId: ticketPendiente.id,
        });
      }
    } else {
      // En desarrollo, usar la impresión directa
      // Usar el directorio temporal del sistema
      const tempDir = os.tmpdir();
      const tempDataPath = path.join(tempDir, `order-data-${Date.now()}.json`);

      await fs.writeFile(tempDataPath, JSON.stringify(orderData));

      return new Promise((resolve, reject) => {
        const phpScriptPath = path.join(process.cwd(), "ticket_printer.php");

        exec(
          `php "${phpScriptPath}" "${tempDataPath}"`,
          async (error, stdout, stderr) => {
            try {
              // Limpiar archivo temporal
              await fs.unlink(tempDataPath);

              if (error) {
                console.error(`Error al ejecutar PHP:`, error);
                console.error(`stderr:`, stderr);
                resolve(
                  res.status(500).json({
                    message: "Error al imprimir ticket",
                    error: stderr,
                  })
                );
                return;
              }

              resolve(
                res.status(200).json({
                  message: "Ticket impreso correctamente",
                  output: stdout,
                })
              );
            } catch (err) {
              resolve(
                res.status(500).json({
                  message: "Error en el proceso de impresión",
                  error: err,
                })
              );
            }
          }
        );
      });
    }
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      message: "Error al procesar la impresión",
      error: error,
    });
  }
}
