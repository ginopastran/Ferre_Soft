import { prisma } from "@/lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";

// Definir interfaces para los tipos de datos
interface AfipResponse {
  cae: string;
  vencimientoCae: string;
  numeroComprobante: number;
}

interface DetalleFactura {
  productoId: number;
  cantidad: number;
  precioUnitario: number;
}

// Cache simple en memoria (en producción usar Redis)
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

function getCacheKey(
  userId: string,
  role: string,
  startDate?: string,
  endDate?: string,
  page?: string,
  limit?: string
) {
  return `facturas_${userId}_${role}_${startDate || "all"}_${
    endDate || "all"
  }_${page || "1"}_${limit || "20"}`;
}

function setCache(key: string, data: any) {
  cache.set(key, {
    data,
    timestamp: Date.now(),
  });
}

function getCache(key: string) {
  const cached = cache.get(key);
  if (!cached) return null;

  if (Date.now() - cached.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }

  return cached.data;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    try {
      const {
        userId,
        role,
        startDate,
        endDate,
        page = "1",
        limit = "20",
        includeDetails = "false",
      } = req.query;

      if (!userId || !role) {
        return res.status(400).json({ error: "Usuario no autenticado" });
      }

      // Convertir parámetros de paginación
      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const offset = (pageNum - 1) * limitNum;

      // Verificar caché primero
      const cacheKey = getCacheKey(
        userId as string,
        role as string,
        startDate as string,
        endDate as string,
        page as string,
        limit as string
      );

      const cachedData = getCache(cacheKey);
      if (cachedData) {
        console.log(`Cache hit for: ${cacheKey}`);
        return res.status(200).json(cachedData);
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

      try {
        // Query optimizada sin includes masivos
        const baseInclude = {
          cliente: {
            select: {
              id: true,
              nombre: true,
              codigo: true,
            },
          },
          vendedor: {
            select: {
              id: true,
              nombre: true,
            },
          },
        };

        // Solo incluir detalles cuando sea necesario
        const include =
          includeDetails === "true"
            ? {
                ...baseInclude,
                detalles: {
                  select: {
                    id: true,
                    cantidad: true,
                    precioUnitario: true,
                    subtotal: true,
                    producto: {
                      select: {
                        id: true,
                        codigo: true,
                        descripcion: true,
                        precioCosto: true,
                      },
                    },
                  },
                },
              }
            : baseInclude;

        // Obtener facturas con paginación y conteo total en paralelo
        const [facturas, totalCount] = await Promise.all([
          prisma.factura.findMany({
            where: whereClause,
            orderBy: {
              fecha: "desc",
            },
            include,
            take: limitNum,
            skip: offset,
          }),
          prisma.factura.count({
            where: whereClause,
          }),
        ]);

        console.log(
          `Facturas encontradas: ${facturas.length} de ${totalCount} total`
        );

        const response = {
          facturas,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total: totalCount,
            pages: Math.ceil(totalCount / limitNum),
            hasNext: pageNum * limitNum < totalCount,
            hasPrev: pageNum > 1,
          },
        };

        // Guardar en caché
        setCache(cacheKey, response);

        return res.status(200).json(response);
      } catch (dbError) {
        console.error("Error al consultar la base de datos:", dbError);
        return res.status(500).json({
          error: "Error al consultar la base de datos",
          details:
            dbError instanceof Error
              ? dbError.message
              : "Unknown database error",
        });
      }
    } catch (error) {
      console.error("Error en el handler GET de facturas:", error);
      return res.status(500).json({
        error: "Error al obtener facturas",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  if (req.method === "POST") {
    try {
      const {
        clienteId,
        vendedorId,
        tipoComprobante,
        detalles,
        descuento,
        aumentaStock = false,
      } = req.body;

      if (!clienteId || !vendedorId || !detalles || detalles.length === 0) {
        return res.status(400).json({
          error: "Faltan datos requeridos",
        });
      }

      // Invalidar caché relacionado cuando se crea una nueva factura
      const keysToDelete = Array.from(cache.keys()).filter(
        (key) =>
          key.includes("facturas_") && key.includes(vendedorId.toString())
      );
      keysToDelete.forEach((key) => cache.delete(key));

      console.log("Creando factura con datos:", {
        clienteId,
        vendedorId,
        tipoComprobante,
        cantidadDetalles: detalles.length,
        descuento,
        aumentaStock,
      });

      // Calcular totales
      let subtotal = 0;
      for (const detalle of detalles as DetalleFactura[]) {
        subtotal += Number(detalle.cantidad) * Number(detalle.precioUnitario);
      }

      // Aplicar descuento si existe
      const descuentoValor = descuento
        ? subtotal * (Number(descuento) / 100)
        : 0;
      const total = Number((subtotal - descuentoValor).toFixed(2));

      console.log("Total calculado:", {
        subtotal,
        descuento: descuento || 0,
        descuentoValor,
        total,
      });

      // Generar número de factura
      let numeroFactura = "";
      let datosAfip: AfipResponse | null = null;

      // Si es un remito, generar un número de remito
      if (tipoComprobante === "REMITO") {
        const ultimoRemito = await prisma.factura.findFirst({
          where: {
            tipoComprobante: "REMITO",
          },
          orderBy: {
            numero: "desc",
          },
        });

        // Generar un nuevo número de remito
        let nuevoNumero = 1;
        if (ultimoRemito && ultimoRemito.numero.startsWith("R-")) {
          nuevoNumero = parseInt(ultimoRemito.numero.substring(2)) + 1;
        }
        numeroFactura = `R-${nuevoNumero.toString().padStart(8, "0")}`;
      } else {
        // Para facturas A o B
        const ultimaFactura = await prisma.factura.findFirst({
          where: {
            tipoComprobante,
          },
          orderBy: {
            numero: "desc",
          },
        });

        // Generar un nuevo número de factura
        let nuevoNumero = 1;
        const prefijo = tipoComprobante === "FACTURA_A" ? "FA-" : "FB-";
        if (ultimaFactura && ultimaFactura.numero.startsWith(prefijo)) {
          nuevoNumero = parseInt(ultimaFactura.numero.substring(3)) + 1;
        }
        numeroFactura = `${prefijo}${nuevoNumero.toString().padStart(8, "0")}`;
      }

      // Verificar conexión con AFIP (código comentado para evitar errores)
      let afipConectado = false;
      try {
        // Verificar si el bypass está activado
        const shouldBypassAfip =
          process.env.NODE_ENV === "production" &&
          process.env.BYPASS_AFIP_IN_PRODUCTION === "true";

        if (!shouldBypassAfip) {
          // En futuras versiones se puede implementar AFIP
          console.log("AFIP no implementado actualmente");
          afipConectado = false;
        }
      } catch (afipError) {
        console.error("Error al verificar conexión con AFIP:", afipError);
      }

      // Obtener datos del cliente
      const cliente = await prisma.cliente.findUnique({
        where: { id: Number(clienteId) },
      });

      if (!cliente) {
        return res.status(400).json({ error: "Cliente no encontrado" });
      }

      // Validar CUIT para facturas tipo A
      if (tipoComprobante === "FACTURA_A") {
        const cuitRegex = /^\d{2}-\d{8}-\d$/;
        if (!cliente.cuitDni || !cuitRegex.test(cliente.cuitDni)) {
          return res.status(400).json({
            error:
              "Para emitir factura tipo A, el cliente debe tener un CUIT válido (formato: XX-XXXXXXXX-X)",
          });
        }
      }

      // Obtener datos de AFIP para facturas A y B (comentado para evitar errores)
      if (
        (tipoComprobante === "FACTURA_A" || tipoComprobante === "FACTURA_B") &&
        afipConectado
      ) {
        try {
          console.log("Obteniendo datos de AFIP para factura:", {
            tipoComprobante,
            numeroFactura,
            clienteId,
          });

          const detallesCompletos = (detalles as DetalleFactura[]).map(
            (detalle: DetalleFactura) => ({
              ...detalle,
              subtotal:
                Number(detalle.cantidad) * Number(detalle.precioUnitario),
            })
          );

          const facturaParaAfip = {
            numero: numeroFactura,
            tipoComprobante,
            total,
          };

          // En futuras versiones se puede implementar AFIP real
          console.log("AFIP no implementado actualmente");
        } catch (afipError) {
          console.error("Error al obtener datos de AFIP:", afipError);
          if (afipError instanceof Error) {
            return res.status(500).json({
              error: "Error al comunicarse con AFIP",
              details: afipError.message,
            });
          }
        }
      }

      // Crear la factura en la base de datos
      try {
        const nuevaFactura = await prisma.$transaction(async (tx) => {
          // Verificar que los productos existen y optimizar stock updates
          const productIds = (detalles as DetalleFactura[]).map(
            (d: DetalleFactura) => Number(d.productoId)
          );
          const productos = await tx.producto.findMany({
            where: { id: { in: productIds } },
            select: { id: true, stock: true },
          });

          if (productos.length !== productIds.length) {
            throw new Error("Algunos productos no fueron encontrados");
          }

          // Datos adicionales de AFIP
          const datosAdicionalesAfip: {
            cae?: string;
            vencimientoCae?: string;
            afipComprobante?: number;
          } = datosAfip
            ? {
                cae: (datosAfip as AfipResponse).cae,
                vencimientoCae: (datosAfip as AfipResponse).vencimientoCae,
                afipComprobante: (datosAfip as AfipResponse).numeroComprobante,
              }
            : {};

          // Crear la factura
          const factura = await tx.factura.create({
            data: {
              numero: numeroFactura,
              fecha: new Date(),
              clienteId: Number(clienteId),
              vendedorId: Number(vendedorId),
              tipoComprobante,
              total,
              pagado: 0,
              estado: "PENDIENTE",
              descuento: descuento ? Number(descuento) : 0,
              ...datosAdicionalesAfip,
              detalles: {
                create: (detalles as DetalleFactura[]).map(
                  (detalle: DetalleFactura) => ({
                    productoId: Number(detalle.productoId),
                    cantidad: Number(detalle.cantidad),
                    precioUnitario: Number(
                      Number(detalle.precioUnitario).toFixed(2)
                    ),
                    subtotal: Number(
                      (
                        Number(detalle.cantidad) *
                        Number(detalle.precioUnitario)
                      ).toFixed(2)
                    ),
                  })
                ),
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
                  producto: {
                    select: {
                      id: true,
                      codigo: true,
                      descripcion: true,
                    },
                  },
                },
              },
            },
          });

          // Actualizar stock en batch para mejor performance
          const stockUpdates = [];

          for (const detalle of detalles as DetalleFactura[]) {
            const producto = productos.find(
              (p) => p.id === Number(detalle.productoId)
            );
            if (!producto) continue;

            let nuevoStock: number;
            if (!aumentaStock) {
              // Venta normal: decrementar stock (nunca por debajo de 0)
              nuevoStock = Math.max(
                0,
                producto.stock - Number(detalle.cantidad)
              );
            } else {
              // Nota de crédito o devolución: incrementar stock
              nuevoStock = producto.stock + Number(detalle.cantidad);
            }

            stockUpdates.push({
              id: producto.id,
              stock: nuevoStock,
            });
          }

          // Ejecutar updates de stock en paralelo
          if (stockUpdates.length > 0) {
            await Promise.all(
              stockUpdates.map((update) =>
                tx.producto.update({
                  where: { id: update.id },
                  data: { stock: update.stock },
                })
              )
            );
          }

          return factura;
        });

        return res.status(201).json({
          ...nuevaFactura,
          afip: datosAfip
            ? {
                cae: (datosAfip as AfipResponse).cae,
                vencimientoCae: (datosAfip as AfipResponse).vencimientoCae,
                numeroComprobante: (datosAfip as AfipResponse)
                  .numeroComprobante,
              }
            : null,
        });
      } catch (transactionError) {
        console.error("Error en la transacción:", transactionError);
        return res.status(500).json({
          error: "Error al crear la factura",
          details:
            transactionError instanceof Error
              ? transactionError.message
              : "Error desconocido en la transacción",
        });
      }
    } catch (error) {
      console.error("Error en el POST de facturas:", error);
      return res.status(500).json({
        error: "Error al crear factura",
        details: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  return res.status(405).json({ message: "Método no permitido" });
}
