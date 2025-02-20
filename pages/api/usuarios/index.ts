import { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    try {
      const vendedores = await prisma.usuario.findMany({
        where: {
          rol: {
            nombre: "VENDEDOR",
          },
        },
        include: {
          sucursal: true,
          rol: true,
        },
      });
      return res.status(200).json(vendedores);
    } catch (error) {
      return res.status(500).json({ message: "Error al obtener vendedores" });
    }
  }

  if (req.method === "POST") {
    const { nombre, dni, telefono, email, password, sucursalId, rolId } =
      req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const nuevoUsuario = await prisma.usuario.create({
      data: {
        nombre,
        dni,
        telefono,
        email,
        password: hashedPassword,
        sucursalId,
        rolId,
      },
    });

    return res.status(201).json(nuevoUsuario);
  }

  return res.status(405).json({ message: "Método no permitido" });
}
