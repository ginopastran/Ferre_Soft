import { prisma } from "@/lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";
import cors from "cors";
import { uploadImage } from "@/lib/cloudinary";
import { Prisma } from "@prisma/client";

// Configurar el límite del body parser
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "3mb",
    },
  },
};

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
    try {
      const {
        page = "1",
        limit = "20",
        search,
        rubro,
        proveedor,
        sort = "creadoEn",
        order = "desc",
      } = req.query;

      // Convertir parámetros de paginación
      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const offset = (pageNum - 1) * limitNum;

      // Validar parámetros
      if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
        return res.status(400).json({
          error: "Parámetros de paginación inválidos",
        });
      }

      // Construir filtros de búsqueda
      const where: Prisma.ProductoWhereInput = {};

      if (search) {
        where.OR = [
          {
            codigo: {
              contains: search as string,
              mode: "insensitive",
            },
          },
          {
            descripcion: {
              contains: search as string,
              mode: "insensitive",
            },
          },
          {
            codigoProveedor: {
              contains: search as string,
              mode: "insensitive",
            },
          },
          {
            codigoBarras: {
              contains: search as string,
              mode: "insensitive",
            },
          },
        ];
      }

      if (rubro && rubro !== "all") {
        where.rubro = rubro as string;
      }

      if (proveedor && proveedor !== "all") {
        where.proveedor = proveedor as string;
      }

      // Construir ordenamiento
      const orderBy: Prisma.ProductoOrderByWithRelationInput = {};
      const sortField = sort as string;
      const sortOrder = (order as string) === "asc" ? "asc" : "desc";

      if (sortField === "creadoEn") {
        orderBy.creadoEn = sortOrder;
      } else if (sortField === "codigo") {
        orderBy.codigo = sortOrder;
      } else if (sortField === "descripcion") {
        orderBy.descripcion = sortOrder;
      } else if (sortField === "precioCosto") {
        orderBy.precioCosto = sortOrder;
      } else if (sortField === "stock") {
        orderBy.stock = sortOrder;
      } else {
        orderBy.creadoEn = "desc";
      }

      // Obtener productos con paginación y conteo total en paralelo
      const [productos, totalCount] = await Promise.all([
        prisma.producto.findMany({
          where,
          orderBy,
          take: limitNum,
          skip: offset,
          select: {
            id: true,
            codigo: true,
            codigoProveedor: true,
            codigoBarras: true,
            rubro: true,
            descripcion: true,
            proveedor: true,
            precioCosto: true,
            iva: true,
            margenGanancia1: true,
            precioFinal1: true,
            margenGanancia2: true,
            precioFinal2: true,
            imagenUrl: true,
            stock: true,
            creadoEn: true,
            actualizadoEn: true,
          },
        }),
        prisma.producto.count({
          where,
        }),
      ]);

      const response = {
        productos,
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
      console.error("Error al obtener productos:", error);
      return res.status(500).json({ error: "Error al obtener productos" });
    }
  }

  if (req.method === "POST") {
    try {
      const data = req.body;
      let imagenUrl = data.imagenUrl;

      if (data.imagenUrl && data.imagenUrl.startsWith("data:image")) {
        imagenUrl = await uploadImage(data.imagenUrl);
      }

      const producto = await prisma.producto.create({
        data: {
          codigo: data.codigo,
          codigoProveedor: data.codigoProveedor,
          codigoBarras: data.codigoBarras || null,
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
