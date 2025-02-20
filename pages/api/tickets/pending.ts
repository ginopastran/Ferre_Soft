import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  try {
    const tickets = await prisma.ticketPendiente.findMany({
      where: {
        estado: "PENDIENTE",
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return res.status(200).json(tickets);
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(500)
      .json({ message: "Error al obtener tickets pendientes" });
  }
}
