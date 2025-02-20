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
      const { search, vendedor, sucursal } = req.query;

      const where: any = {};

      if (search) {
        where.OR = [
          { id: parseInt(search as string) || undefined },
          { total: parseFloat(search as string) || undefined },
          {
            vendedor: {
              nombre: {
                contains: search as string,
                mode: "insensitive",
              },
            },
          },
          {
            sucursal: {
              nombre: {
                contains: search as string,
                mode: "insensitive",
              },
            },
          },
        ];
      }

      if (vendedor && vendedor !== "all") {
        where.vendedorId = parseInt(vendedor as string);
      }

      if (sucursal && sucursal !== "all") {
        where.sucursalId = parseInt(sucursal as string);
      }

      const ordenes = await prisma.ordenCompra.findMany({
        where,
        include: {
          vendedor: {
            select: {
              id: true,
              nombre: true,
            },
          },
          sucursal: true,
          detalles: {
            select: {
              id: true,
              cantidad: true,
              subtotal: true,
              costo: true,
              precioHistorico: true,
              producto: {
                select: {
                  id: true,
                  nombre: true,
                  precio: true,
                  tipoMedida: true,
                },
              },
            },
          },
        },
        orderBy: {
          fecha: "desc",
        },
      });
      return res.status(200).json(ordenes);
    } catch (error) {
      return res.status(500).json({ message: "Error al obtener órdenes" });
    }
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  try {
    console.log(req.body);

    const { metodoPago, total, items, vendedorId, sucursalId } = req.body;

    if (
      !metodoPago ||
      !total ||
      !items ||
      !Array.isArray(items) ||
      !sucursalId
    ) {
      return res.status(400).json({
        message:
          "Datos inválidos. Se requiere metodoPago, total, items y sucursalId",
      });
    }

    const nuevaOrden = await prisma.ordenCompra.create({
      data: {
        total: total,
        metodoPago,
        estado: "PENDIENTE",
        vendedorId,
        sucursalId,
        detalles: {
          create: items.map((item) => ({
            productoId: item.productoId,
            cantidad: item.cantidad,
            subtotal: item.subtotal,
            costo: item.costo,
            precioHistorico: item.precioHistorico,
          })),
        },
      },
      include: {
        detalles: {
          include: {
            producto: true,
          },
        },
      },
    });

    return res.status(201).json(nuevaOrden);
  } catch (error) {
    console.error("Error al crear la orden:", error);
    if (error instanceof Error) {
      return res.status(500).json({ message: error.message });
    }
    return res.status(500).json({ message: "Error al crear la orden" });
  }
}
