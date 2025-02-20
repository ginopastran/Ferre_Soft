import { prisma } from "@/lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    try {
      const rubros = await prisma.rubro.findMany({
        orderBy: {
          nombre: "asc",
        },
      });
      return res.status(200).json(rubros);
    } catch (error) {
      console.error("Error al obtener rubros:", error);
      return res.status(500).json({ error: "Error al obtener rubros" });
    }
  }

  if (req.method === "POST") {
    try {
      const rubro = await prisma.rubro.create({
        data: req.body,
      });
      return res.status(201).json(rubro);
    } catch (error) {
      console.error("Error al crear rubro:", error);
      return res.status(500).json({ error: "Error al crear rubro" });
    }
  }

  return res.status(405).json({ message: "Método no permitido" });
}
