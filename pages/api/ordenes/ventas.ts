import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import cors from "cors";

const corsMiddleware = cors({
  origin: process.env.ALLOWED_ORIGIN || "http://localhost:5173",
  methods: ["POST", "OPTIONS"],
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

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  try {
    const { vendedorId, sucursalId, fechaInicio, fechaCierre } = req.body;

    const ventas = await prisma.ordenCompra.findMany({
      where: {
        vendedorId: Number(vendedorId),
        sucursalId: Number(sucursalId),
        fecha: {
          gte: new Date(fechaInicio),
          lte: new Date(fechaCierre),
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

    // Calcular totales
    const total = ventas.reduce((acc, venta) => acc + venta.total, 0);
    const cantidad = ventas.length;

    // Detalles por método de pago
    const ventasPorMetodo = ventas.reduce((acc, venta) => {
      acc[venta.metodoPago] = (acc[venta.metodoPago] || 0) + venta.total;
      return acc;
    }, {} as Record<string, number>);

    // Productos más vendidos
    const productosMasVendidos = ventas.reduce((acc, venta) => {
      venta.detalles.forEach((detalle) => {
        const key = detalle.producto.nombre;
        acc[key] = (acc[key] || 0) + detalle.cantidad;
      });
      return acc;
    }, {} as Record<string, number>);

    return res.status(200).json({
      total,
      cantidad,
      ventas,
      ventasPorMetodo,
      productosMasVendidos,
    });
  } catch (error) {
    console.error("Error al obtener ventas:", error);
    return res.status(500).json({ message: "Error al obtener ventas" });
  }
}
