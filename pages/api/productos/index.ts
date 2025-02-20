import { prisma } from "@/lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";
import cors from "cors";
import { uploadImage } from "@/lib/cloudinary";

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
  // Aplicar CORS
  await runMiddleware(req, res, corsMiddleware);

  if (req.method === "GET") {
    const productos = await prisma.producto.findMany({
      orderBy: {
        creadoEn: "desc",
      },
    });
    return res.status(200).json(productos);
  }

  if (req.method === "POST") {
    try {
      const data = req.body;
      let imagenUrl = null;

      if (data.imagenUrl) {
        try {
          imagenUrl = await uploadImage(data.imagenUrl);
          if (!imagenUrl) {
            return res.status(400).json({
              error: "Error al subir la imagen a Cloudinary",
            });
          }
        } catch (error) {
          console.error("Error de Cloudinary:", error);
          return res.status(400).json({
            error: "Error al procesar la imagen",
          });
        }
      }

      const producto = await prisma.producto.create({
        data: {
          codigo: data.codigo,
          codigoProveedor: data.codigoProveedor,
          rubro: data.rubro,
          descripcion: data.descripcion,
          proveedor: data.proveedor,
          precioCosto: Number(data.precioCosto),
          iva: Number(data.iva),
          margenGanancia1: Number(data.margenGanancia1),
          precioFinal1: Number(data.precioFinal1),
          margenGanancia2: Number(data.margenGanancia2),
          precioFinal2: Number(data.precioFinal2),
          imagenUrl,
          stock: Number(data.stock),
        },
      });

      return res.status(201).json(producto);
    } catch (error) {
      console.error("Error al crear producto:", error);
      return res.status(500).json({ error: "Error al crear el producto" });
    }
  }

  return res.status(405).json({ message: "Método no permitido" });
}
