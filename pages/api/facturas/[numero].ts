import { prisma } from "@/lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { numero } = req.query;

  if (req.method === "GET") {
    try {
      const factura = await prisma.factura.findUnique({
        where: { numero: String(numero) },
        include: {
          cliente: true,
          vendedor: {
            select: {
              nombre: true,
            },
          },
          detalles: {
            include: {
              producto: true,
            },
          },
          pagos: true,
        },
      });

      if (!factura) {
        return res.status(404).json({ message: "Factura no encontrada" });
      }

      return res.status(200).json(factura);
    } catch (error) {
      console.error("Error al obtener factura:", error);
      return res.status(500).json({ error: "Error al obtener factura" });
    }
  }

  if (req.method === "PUT") {
    try {
      const { pagado, metodoPago, observaciones } = req.body;

      const factura = await prisma.factura.update({
        where: { numero: String(numero) },
        data: {
          pagado: Number(pagado),
          estado:
            Number(pagado) >= Number(req.body.total) ? "PAGADA" : "PENDIENTE",
          pagos: {
            create: {
              monto: Number(pagado) - Number(req.body.pagadoAnterior),
              metodoPago,
              observaciones,
            },
          },
        },
        include: {
          pagos: true,
        },
      });

      return res.status(200).json(factura);
    } catch (error) {
      console.error("Error al actualizar factura:", error);
      return res.status(500).json({ error: "Error al actualizar factura" });
    }
  }

  return res.status(405).json({ message: "Método no permitido" });
}
