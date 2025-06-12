import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import cors from "cors";
import { Prisma } from "@prisma/client";

const corsMiddleware = cors({
  origin: process.env.ALLOWED_ORIGIN || "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
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
  await runMiddleware(req, res, corsMiddleware);

  if (req.method === "GET") {
    try {
      const {
        search,
        page = "1",
        limit = "10",
        includeFacturas = "false",
      } = req.query;

      // Convertir parámetros de paginación
      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const offset = (pageNum - 1) * limitNum;

      // Validar parámetros
      if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
        return res.status(400).json({
          message: "Parámetros de paginación inválidos",
        });
      }

      const where = search
        ? {
            OR: [
              {
                codigo: {
                  contains: search as string,
                  mode: Prisma.QueryMode.insensitive,
                },
              },
              {
                nombre: {
                  contains: search as string,
                  mode: Prisma.QueryMode.insensitive,
                },
              },
              {
                cuitDni: {
                  contains: search as string,
                  mode: Prisma.QueryMode.insensitive,
                },
              },
            ],
          }
        : {};

      // Include condicional para optimizar queries
      const include =
        includeFacturas === "true"
          ? {
              Factura: {
                select: {
                  id: true,
                  numero: true,
                  fecha: true,
                  total: true,
                  estado: true,
                },
                orderBy: {
                  fecha: "desc" as const,
                },
                take: 5, // Solo las últimas 5 facturas
              },
            }
          : undefined;

      // Obtener clientes con paginación y conteo total en paralelo
      const [clientes, totalCount] = await Promise.all([
        prisma.cliente.findMany({
          where,
          include,
          orderBy: {
            creadoEn: "desc",
          },
          take: limitNum,
          skip: offset,
        }),
        prisma.cliente.count({
          where,
        }),
      ]);

      const response = {
        clientes,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalCount,
          pages: Math.ceil(totalCount / limitNum),
          hasNext: pageNum * limitNum < totalCount,
          hasPrev: pageNum > 1,
        },
      };

      return res.status(200).json(response);
    } catch (error) {
      console.error("Error al obtener clientes:", error);
      return res.status(500).json({ message: "Error al obtener clientes" });
    }
  }

  if (req.method === "POST") {
    try {
      const {
        codigo,
        nombre,
        direccion,
        pais,
        provincia,
        localidad,
        situacionIVA,
        cuitDni,
        telefono,
        email,
      } = req.body;

      // Validaciones
      if (!codigo || !nombre || !cuitDni || !situacionIVA) {
        return res.status(400).json({
          message: "Faltan campos requeridos",
        });
      }

      const nuevoCliente = await prisma.cliente.create({
        data: {
          codigo,
          nombre,
          direccion,
          pais,
          provincia,
          localidad,
          situacionIVA,
          cuitDni,
          telefono,
          email,
        },
      });

      return res.status(201).json(nuevoCliente);
    } catch (error: any) {
      console.error("Error al crear cliente:", error);
      if (error.code === "P2002") {
        return res.status(400).json({
          message: "Ya existe un cliente con ese código o CUIT/DNI",
        });
      }
      return res.status(500).json({ message: "Error al crear el cliente" });
    }
  }

  return res.status(405).json({ message: "Método no permitido" });
}
