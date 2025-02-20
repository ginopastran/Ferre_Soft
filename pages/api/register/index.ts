import { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    const { nombre, email, password, telefono, dni } = req.body;

    if (!nombre || !email || !password || !dni) {
      return res.status(400).json({ message: "Faltan campos requeridos" });
    }

    try {
      // Verificar si es el primer usuario
      const userCount = await prisma.usuario.count();
      const isFirstUser = userCount === 0;

      if (isFirstUser) {
        // Crear roles y sucursal para el primer usuario
        const [roleAdmin, roleVendedor, sucursal] = await prisma.$transaction([
          prisma.rol.upsert({
            where: { nombre: "ADMIN" },
            update: {},
            create: { nombre: "ADMIN" },
          }),
          prisma.rol.upsert({
            where: { nombre: "VENDEDOR" },
            update: {},
            create: { nombre: "VENDEDOR" },
          }),
          prisma.sucursal.create({
            data: {
              nombre: "Sucursal Principal",
              ubicacion: "Dirección Principal",
            },
          }),
        ]);

        // Crear primer usuario como ADMIN
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await prisma.usuario.create({
          data: {
            nombre,
            email,
            password: hashedPassword,
            telefono,
            dni,
            rol: { connect: { id: roleAdmin.id } },
            sucursal: { connect: { id: sucursal.id } },
          },
        });

        return res.status(201).json({
          id: newUser.id,
          nombre: newUser.nombre,
          email: newUser.email,
          rol: "ADMIN",
        });
      } else {
        // Usuarios subsecuentes
        const [roleVendedor, sucursalPrincipal] = await Promise.all([
          prisma.rol.findUnique({ where: { nombre: "VENDEDOR" } }),
          prisma.sucursal.findUnique({ where: { id: 1 } }),
        ]);

        if (!roleVendedor || !sucursalPrincipal) {
          return res
            .status(500)
            .json({ message: "Configuración inicial faltante" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await prisma.usuario.create({
          data: {
            nombre,
            email,
            password: hashedPassword,
            telefono,
            dni,
            rolId: roleVendedor.id,
            sucursalId: sucursalPrincipal.id,
          },
        });

        return res.status(201).json({
          id: newUser.id,
          nombre: newUser.nombre,
          email: newUser.email,
          rol: "VENDEDOR",
        });
      }
    } catch (error) {
      console.error("Error en registro:", error);
      return res.status(500).json({ message: "Error en el servidor" });
    }
  } else {
    return res.status(405).json({ message: "Método no permitido" });
  }
}
