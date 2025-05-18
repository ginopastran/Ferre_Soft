import { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    const { includeVentas } = req.query;

    try {
      const usuarios = await prisma.usuario.findMany({
        where: {
          rol: {
            nombre: "VENDEDOR",
          },
        },
        include: {
          sucursal: true,
          Factura:
            includeVentas === "true"
              ? {
                  select: {
                    total: true,
                  },
                }
              : false,
          pagosRecibidos: true,
        },
      });

      const usuariosConVentas = usuarios.map((usuario) => {
        const totalVentas =
          usuario.Factura?.reduce((sum, factura) => sum + factura.total, 0) ||
          0;
        const totalPagado =
          usuario.pagosRecibidos?.reduce((sum, pago) => sum + pago.monto, 0) ||
          0;
        const comisionTotal = (totalVentas * usuario.comision) / 100;

        return {
          ...usuario,
          totalVentas,
          totalPagado,
          montoPendiente: comisionTotal - totalPagado,
          Factura: undefined,
          pagosRecibidos: undefined,
        };
      });

      return res.status(200).json(usuariosConVentas);
    } catch (error) {
      console.error("Error al obtener usuarios:", error);
      return res.status(500).json({ error: "Error al obtener usuarios" });
    }
  }

  if (req.method === "POST") {
    try {
      const { nombre, dni, telefono, email, password, sucursalId, comision } =
        req.body;

      // Verificar si ya existe un usuario con ese email o dni
      const existingUser = await prisma.usuario.findFirst({
        where: {
          OR: [{ email }, ...(dni ? [{ dni }] : [])],
        },
      });

      if (existingUser) {
        return res.status(400).json({
          error: dni
            ? "Ya existe un usuario con ese email o DNI"
            : "Ya existe un usuario con ese email",
        });
      }

      // Obtener el ID del rol VENDEDOR
      const rolVendedor = await prisma.rol.findUnique({
        where: { nombre: "VENDEDOR" },
      });

      if (!rolVendedor) {
        return res.status(400).json({
          error: "No se encontró el rol de vendedor",
        });
      }

      // Encriptar contraseña
      const hashedPassword = await bcrypt.hash(password, 10);

      // Crear usuario
      const nuevoUsuario = await prisma.usuario.create({
        data: {
          nombre,
          dni: dni?.trim() || null,
          telefono,
          email,
          password: hashedPassword,
          sucursalId: sucursalId ? Number(sucursalId) : null,
          rolId: rolVendedor.id,
          comision: Number(comision),
        },
        include: {
          sucursal: true,
        },
      });

      // Removemos la contraseña de la respuesta
      const { password: _, ...usuarioSinPassword } = nuevoUsuario;
      return res.status(201).json(usuarioSinPassword);
    } catch (error) {
      console.error("Error al crear usuario:", error);
      return res.status(500).json({ error: "Error al crear usuario" });
    }
  }

  return res.status(405).json({ message: "Método no permitido" });
}
