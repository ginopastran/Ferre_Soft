import { prisma } from "@/lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  const { codigo } = req.query;

  try {
    const cliente = await prisma.cliente.findUnique({
      where: { codigo: String(codigo) },
      select: { id: true },
    });

    if (!cliente) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }

    const facturas = await prisma.factura.findMany({
      where: { clienteId: cliente.id },
      orderBy: { fecha: "desc" },
      include: {
        cliente: {
          select: {
            nombre: true,
          },
        },
      },
    });

    return res.status(200).json(facturas);
  } catch (error) {
    console.error("Error al obtener facturas:", error);
    return res.status(500).json({ error: "Error al obtener facturas" });
  }
}
