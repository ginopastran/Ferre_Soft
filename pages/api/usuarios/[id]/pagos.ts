import { prisma } from "@/lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    try {
      const { id } = req.query;
      const { monto, metodoPago, observaciones } = req.body;

      const pago = await prisma.pagoVendedor.create({
        data: {
          vendedorId: Number(id),
          monto: Number(monto),
          metodoPago,
          observaciones,
        },
      });

      return res.status(201).json(pago);
    } catch (error) {
      console.error("Error al registrar pago:", error);
      return res.status(500).json({ error: "Error al registrar el pago" });
    }
  }

  return res.status(405).json({ message: "Método no permitido" });
}
