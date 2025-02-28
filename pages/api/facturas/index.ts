import { prisma } from "@/lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    try {
      const { userId, role, startDate, endDate } = req.query;

      if (!userId || !role) {
        return res.status(400).json({ error: "Usuario no autenticado" });
      }

      const whereClause: any =
        role === "VENDEDOR" ? { vendedorId: Number(userId) } : {};

      // Añadir filtro de fechas si están presentes
      if (startDate && endDate) {
        console.log("Fechas recibidas:", { startDate, endDate });
        const start = new Date(startDate as string);
        const end = new Date(endDate as string);

        console.log("Fechas parseadas:", {
          start: start.toISOString(),
          end: end.toISOString(),
        });

        whereClause.fecha = {
          gte: start,
          lte: end,
        };
      }

      console.log("Where clause:", JSON.stringify(whereClause, null, 2));

      const facturas = await prisma.factura.findMany({
        where: whereClause,
        orderBy: {
          fecha: "desc",
        },
        include: {
          cliente: {
            select: {
              nombre: true,
            },
          },
          vendedor: {
            select: {
              nombre: true,
            },
          },
          detalles: {
            include: {
              producto: true,
            },
          },
        },
      });

      console.log(`Facturas encontradas: ${facturas.length}`);

      return res.status(200).json(facturas);
    } catch (error) {
      console.error("Error al obtener facturas:", error);
      return res
        .status(500)
        .json({
          error: "Error al obtener facturas",
          details: error instanceof Error ? error.message : "Unknown error",
        });
    }
  }

  if (req.method === "POST") {
    try {
      // Log inicial de la petición
      console.log("Datos recibidos:", {
        body: req.body,
        headers: req.headers,
      });

      const { clienteId, tipoComprobante, detalles, vendedorId } = req.body;

      // Log de los datos extraídos
      console.log("Datos extraídos:", {
        clienteId,
        tipoComprobante,
        detallesLength: detalles?.length,
        vendedorId,
      });

      // Validaciones mejoradas
      if (!clienteId || !tipoComprobante || !detalles || !vendedorId) {
        console.log("Faltan datos:", {
          clienteId: !clienteId,
          tipoComprobante: !tipoComprobante,
          detalles: !detalles,
          vendedorId: !vendedorId,
        });
        return res.status(400).json({
          error: "Faltan datos requeridos",
          details: {
            clienteId: !clienteId,
            tipoComprobante: !tipoComprobante,
            detalles: !detalles,
            vendedorId: !vendedorId,
          },
        });
      }

      // Validar que detalles sea un array y tenga elementos
      if (!Array.isArray(detalles) || detalles.length === 0) {
        console.log("Error en detalles:", {
          esArray: Array.isArray(detalles),
          longitud: detalles?.length,
          detalles,
        });
        return res.status(400).json({
          error: "Los detalles de la factura son inválidos",
          details: "Se requiere al menos un producto",
        });
      }

      // Log de los detalles
      console.log("Detalles de la factura:", detalles);

      // Calcular total
      const total = detalles.reduce(
        (sum, detalle) => sum + detalle.cantidad * detalle.precioUnitario,
        0
      );
      console.log("Total calculado:", total);

      // Generar número de factura
      let numeroFactura = "F00000001";
      const ultimaFactura = await prisma.factura.findFirst({
        orderBy: {
          numero: "desc",
        },
        select: {
          numero: true,
        },
      });

      console.log("Última factura encontrada:", ultimaFactura);

      if (ultimaFactura?.numero) {
        const ultimoNumero = parseInt(ultimaFactura.numero.substring(1));
        console.log("Último número extraído:", ultimoNumero);
        if (!isNaN(ultimoNumero)) {
          numeroFactura = `F${String(ultimoNumero + 1).padStart(8, "0")}`;
        }
      }
      console.log("Nuevo número de factura:", numeroFactura);

      // Crear factura y actualizar stock en una transacción
      const nuevaFactura = await prisma.$transaction(async (tx) => {
        // Verificar stock
        for (const detalle of detalles) {
          const producto = await tx.producto.findUnique({
            where: { id: Number(detalle.productoId) },
            select: { id: true, stock: true, descripcion: true },
          });

          console.log("Verificando stock del producto:", {
            productoId: detalle.productoId,
            stockActual: producto?.stock,
            cantidadRequerida: detalle.cantidad,
            producto,
          });

          if (!producto || producto.stock < detalle.cantidad) {
            throw new Error(
              `Stock insuficiente para el producto ${
                producto?.descripcion || detalle.productoId
              }`
            );
          }
        }

        console.log("Intentando crear factura con datos:", {
          numero: numeroFactura,
          clienteId: Number(clienteId),
          vendedorId: Number(vendedorId),
          tipoComprobante,
          total,
          detalles: detalles.map((detalle) => ({
            productoId: Number(detalle.productoId),
            cantidad: Number(detalle.cantidad),
            precioUnitario: Number(detalle.precioUnitario),
            subtotal: Number(detalle.cantidad * detalle.precioUnitario),
          })),
        });

        const factura = await tx.factura.create({
          data: {
            numero: numeroFactura,
            clienteId: Number(clienteId),
            vendedorId: Number(vendedorId),
            tipoComprobante,
            total,
            pagado: 0,
            estado: "PENDIENTE",
            detalles: {
              create: detalles.map((detalle) => ({
                productoId: Number(detalle.productoId),
                cantidad: Number(detalle.cantidad),
                precioUnitario: Number(detalle.precioUnitario),
                subtotal: Number(detalle.cantidad * detalle.precioUnitario),
              })),
            },
          },
          include: {
            cliente: {
              select: {
                nombre: true,
              },
            },
            detalles: {
              include: {
                producto: true,
              },
            },
          },
        });

        console.log("Factura creada exitosamente:", factura);

        // Actualizar stock
        for (const detalle of detalles) {
          await tx.producto.update({
            where: { id: Number(detalle.productoId) },
            data: {
              stock: {
                decrement: Number(detalle.cantidad),
              },
            },
          });
        }

        return factura;
      });

      return res.status(201).json(nuevaFactura);
    } catch (error) {
      console.error("Error en la creación de factura:", error);

      let errorMessage = "Error desconocido";
      if (error instanceof Error) {
        console.error("Detalles del error:", {
          mensaje: error.message,
          stack: error.stack,
        });
        errorMessage = error.message;
      }

      return res.status(500).json({
        error: "Error al crear factura",
        details: errorMessage,
      });
    }
  }

  return res.status(405).json({ message: "Método no permitido" });
}
