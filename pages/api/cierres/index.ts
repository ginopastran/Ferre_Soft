import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import cors from "cors";

const corsMiddleware = cors({
  origin: process.env.ALLOWED_ORIGIN || "http://localhost:5173",
  methods: ["GET", "POST", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
});

const runMiddleware = (req: NextApiRequest, res: NextApiResponse, fn: any) => {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Aplicar CORS
  await runMiddleware(req, res, corsMiddleware);

  if (req.method === "GET") {
    try {
      const { vendedorId, last } = req.query;

      if (last === "true" && vendedorId) {
        // Obtener el último cierre para el vendedor
        const ultimoCierre = await prisma.cierreCaja.findFirst({
          where: {
            vendedorId: Number(vendedorId),
          },
          orderBy: {
            fechaCierre: "desc",
          },
        });

        return res.status(200).json(ultimoCierre);
      }

      // Obtener todos los cierres
      const cierres = await prisma.cierreCaja.findMany({
        include: {
          vendedor: {
            select: {
              id: true,
              nombre: true,
            },
          },
          sucursal: true,
        },
        orderBy: {
          fechaCierre: "desc",
        },
      });

      return res.status(200).json(cierres);
    } catch (error) {
      console.error("Error al obtener cierres:", error);
      return res.status(500).json({ message: "Error al obtener cierres" });
    }
  }

  if (req.method === "POST") {
    try {
      const {
        vendedorId,
        sucursalId,
        fechaInicio,
        fechaCierre,
        periodo,
        totalVentas,
        cantidadVentas,
        ventasPorMetodo,
      } = req.body;

      const nuevoCierre = await prisma.cierreCaja.create({
        data: {
          vendedorId,
          sucursalId,
          fechaInicio: new Date(fechaInicio),
          fechaCierre: new Date(fechaCierre),
          periodo,
          totalVentas,
          cantidadVentas,
          ventasPorMetodo,
        },
      });

      return res.status(201).json(nuevoCierre);
    } catch (error) {
      console.error("Error al crear cierre:", error);
      return res.status(500).json({ message: "Error al crear cierre" });
    }
  }

  return res.status(405).json({ message: "Método no permitido" });
}
