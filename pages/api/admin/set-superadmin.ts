import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { verify } from "jsonwebtoken";

// Middleware para verificar si el usuario actual es SUPERADMIN
const verifySuperAdmin = async (req: NextApiRequest): Promise<boolean> => {
  try {
    // Obtener token de las cookies
    const token = req.cookies.token;
    if (!token) return false;

    // Verificar token
    const decoded: any = verify(token, process.env.JWT_SECRET || "");
    if (!decoded || !decoded.userId) return false;

    // Buscar usuario y verificar rol
    const usuario = await prisma.usuario.findUnique({
      where: { id: decoded.userId },
      include: { rol: true },
    });

    return usuario?.rol?.nombre === "SUPERADMIN";
  } catch (error) {
    console.error("Error al verificar autorización:", error);
    return false;
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Solo permitir método POST
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  // Verificar si el usuario que hace la petición es SUPERADMIN
  const isSuperAdmin = await verifySuperAdmin(req);
  if (!isSuperAdmin) {
    return res
      .status(403)
      .json({
        error:
          "No autorizado para realizar esta acción. Se requiere rol SUPERADMIN.",
      });
  }

  try {
    const { userId, email } = req.body;

    if (!userId && !email) {
      return res
        .status(400)
        .json({ message: "Se requiere ID o email del usuario" });
    }

    // Buscar el rol SUPERADMIN
    let superAdminRole = await prisma.rol.findUnique({
      where: { nombre: "SUPERADMIN" },
    });

    if (!superAdminRole) {
      // Si no existe, crearlo
      superAdminRole = await prisma.rol.create({
        data: { nombre: "SUPERADMIN" },
      });
    }

    // Buscar el usuario por ID o email
    let usuario;
    if (userId) {
      usuario = await prisma.usuario.findUnique({
        where: { id: Number(userId) },
      });
    } else if (email) {
      usuario = await prisma.usuario.findUnique({
        where: { email },
      });
    }

    if (!usuario) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Actualizar el rol del usuario a SUPERADMIN
    const updatedUser = await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        rolId: superAdminRole.id,
      },
      include: {
        rol: true,
      },
    });

    // Eliminar password de la respuesta
    const { password, ...userWithoutPassword } = updatedUser;

    return res.status(200).json({
      message: "Usuario actualizado correctamente a SUPERADMIN",
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Error al establecer SUPERADMIN:", error);
    return res.status(500).json({ message: "Error en el servidor" });
  }
}
