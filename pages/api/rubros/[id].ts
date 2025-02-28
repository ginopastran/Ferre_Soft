import { prisma } from "@/lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (req.method === "PUT") {
    try {
      const rubro = await prisma.rubro.update({
        where: { id: Number(id) },
        data: req.body,
      });
      return res.status(200).json(rubro);
    } catch (error) {
      console.error("Error al actualizar rubro:", error);
      return res.status(500).json({ error: "Error al actualizar rubro" });
    }
  }

  return res.status(405).json({ message: "Método no permitido" });
}
