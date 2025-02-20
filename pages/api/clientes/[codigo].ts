import { prisma } from "@/lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { codigo } = req.query;

  if (typeof codigo !== "string") {
    return res.status(400).json({ error: "Código inválido" });
  }

  if (req.method === "PUT") {
    try {
      const data = req.body;

      const updatedClient = await prisma.cliente.update({
        where: { codigo },
        data: {
          nombre: data.nombre,
          direccion: data.direccion,
          pais: data.pais,
          provincia: data.provincia,
          localidad: data.localidad,
          situacionIVA: data.situacionIVA,
          cuitDni: data.cuitDni,
          telefono: data.telefono,
          email: data.email,
        },
      });

      return res.json(updatedClient);
    } catch (error) {
      return res.status(500).json({ error: "Error al actualizar el cliente" });
    }
  }

  if (req.method === "GET") {
    try {
      const client = await prisma.cliente.findUnique({
        where: { codigo },
      });

      if (!client) {
        return res.status(404).json({ error: "Cliente no encontrado" });
      }

      return res.json(client);
    } catch (error) {
      return res.status(500).json({ error: "Error al obtener el cliente" });
    }
  }

  return res.status(405).json({ error: "Método no permitido" });
}
