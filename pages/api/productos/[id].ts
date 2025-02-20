import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { uploadImage } from "@/lib/cloudinary";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (req.method === "GET") {
    const producto = await prisma.producto.findUnique({
      where: { id: Number(id) },
    });
    if (!producto) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }
    return res.status(200).json(producto);
  }

  if (req.method === "PUT") {
    try {
      const data = req.body;
      let imagenUrl = data.imagenUrl;

      // Solo subimos a Cloudinary si es una imagen nueva en base64
      if (data.imagenUrl && data.imagenUrl.startsWith("data:image")) {
        imagenUrl = await uploadImage(data.imagenUrl);
      }

      const producto = await prisma.producto.update({
        where: { id: Number(id) },
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

      return res.status(200).json(producto);
    } catch (error) {
      console.error("Error al actualizar producto:", error);
      return res.status(500).json({ error: "Error al actualizar el producto" });
    }
  }

  if (req.method === "DELETE") {
    await prisma.producto.delete({
      where: { id: Number(id) },
    });
    return res.status(204).end();
  }

  return res.status(405).json({ message: "Método no permitido" });
}
