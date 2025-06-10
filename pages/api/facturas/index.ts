import { prisma } from "@/lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";

// Definir interfaces para los tipos de datos
interface AfipResponse {
  cae: string;
  vencimientoCae: string;
  numeroComprobante: number;
}

// Importar las funciones de AFIP solo cuando se necesiten
const getAfipUtils = async () => {
  try {
    // En producción, podemos decidir si importar o no
    if (
      process.env.NODE_ENV === "production" &&
      process.env.BYPASS_AFIP_IN_PRODUCTION === "true"
    ) {
      console.log("Modo bypass de AFIP en producción activado");
      return {
        verificarConexion: async () => false,
        generarFacturaElectronica: async () => ({
          cae: "bypass-cae",
          vencimientoCae: new Date().toISOString().slice(0, 10),
          numeroComprobante: 0,
        }),
      };
    }

    // Importar dinámicamente
    const { verificarConexion, generarFacturaElectronica } = await import(
      "@/lib/afip"
    );
    return { verificarConexion, generarFacturaElectronica };
  } catch (error) {
    console.error("Error al cargar funciones de AFIP:", error);
    // Devolver funciones mock en caso de error
    return {
      verificarConexion: async () => false,
      generarFacturaElectronica: async () => ({
        cae: "error-cae",
        vencimientoCae: new Date().toISOString().slice(0, 10),
        numeroComprobante: 0,
      }),
    };
  }
};

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

      try {
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
      // Log inicial de la petición
      console.log("Datos recibidos:", {
        body: req.body,
        headers: req.headers,
      });

      const { clienteId, tipoComprobante, detalles, vendedorId, descuento } =
        req.body;

      // Log de los datos extraídos
      console.log("Datos extraídos:", {
        clienteId,
        tipoComprobante,
        detallesLength: detalles?.length,
        vendedorId,
        descuento,
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
      const subtotal = Number(
        detalles
          .reduce(
            (sum, detalle) => sum + detalle.cantidad * detalle.precioUnitario,
            0
          )
          .toFixed(2)
      );

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

      // Verificar conexión con AFIP
      let afipConectado = false;
      try {
        const afipUtils = await getAfipUtils();
        const shouldBypassAfip =
          process.env.NODE_ENV === "production" &&
          process.env.BYPASS_AFIP_IN_PRODUCTION === "true";

        if (!shouldBypassAfip) {
          afipConectado = await afipUtils.verificarConexion();
          console.log("Estado de conexión con AFIP:", afipConectado);
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
        const cuitLimpio = cliente.cuitDni.replace(/[^0-9]/g, "");
        if (cuitLimpio.length !== 11) {
          return res.status(400).json({
            error: "CUIT inválido",
            details:
              "Para Factura A, el cliente debe tener un CUIT válido de 11 dígitos",
            cuit: cliente.cuitDni,
            cuitLimpio,
          });
        }

        // Validar situación IVA para Factura A
        const situacionesValidasParaFacturaA = [
          "RESPONSABLE_INSCRIPTO",
          "IVA Responsable Inscripto",
          "MONOTRIBUTISTA",
          "Monotributista",
          "Responsable Monotributo",
        ];
        if (!situacionesValidasParaFacturaA.includes(cliente.situacionIVA)) {
          console.log("Situación IVA inválida:", {
            situacionIVA: cliente.situacionIVA,
            situacionesValidas: situacionesValidasParaFacturaA,
          });
          return res.status(400).json({
            error: "Situación IVA inválida",
            details:
              "Para Factura A, el cliente debe ser Responsable Inscripto o Monotributista. " +
              `La situación actual del cliente es "${cliente.situacionIVA}"`,
            situacionIVA: cliente.situacionIVA,
            situacionesValidas: situacionesValidasParaFacturaA,
          });
        }
      }

      // Obtener datos de AFIP para facturas A y B
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

          const detallesCompletos = detalles.map((detalle) => ({
            ...detalle,
            subtotal: Number(detalle.cantidad) * Number(detalle.precioUnitario),
          }));

          const facturaParaAfip = {
            numero: numeroFactura,
            tipoComprobante,
            total,
          };

          const afipUtils = await getAfipUtils();
          datosAfip = await afipUtils.generarFacturaElectronica(
            facturaParaAfip,
            cliente,
            detallesCompletos
          );

          console.log("Datos obtenidos de AFIP:", datosAfip);
        } catch (afipError) {
          const errorMsg =
            afipError instanceof Error ? afipError.message : String(afipError);

          if (
            errorMsg.includes(
              "Debe emitir una factura de crédito electrónica (FCE)"
            )
          ) {
            return res.status(400).json({
              error: "Error de validación AFIP",
              message: "Este cliente requiere factura MiPyME",
              details: errorMsg,
            });
          } else if (errorMsg.includes("CUIT")) {
            return res.status(400).json({
              error: "Error de validación AFIP",
              message: "El CUIT del cliente no es válido o no está autorizado",
              details: errorMsg,
            });
          } else if (errorMsg.includes("Comprobante ya registrado")) {
            return res.status(400).json({
              error: "Error de validación AFIP",
              message: "El comprobante ya fue registrado anteriormente",
              details: errorMsg,
            });
          }

          throw afipError;
        }
      }

      // Crear la factura en la base de datos
      try {
        const nuevaFactura = await prisma.$transaction(async (tx) => {
          // Verificar stock disponible antes de crear la factura
          for (const detalle of detalles) {
            const producto = await tx.producto.findUnique({
              where: { id: Number(detalle.productoId) },
            });

            if (!producto) {
              throw new Error(
                `Producto con ID ${detalle.productoId} no encontrado`
              );
            }

            // Solo validar stock si es una venta (no es nota de crédito o similar)
            if (!req.body.aumentaStock) {
              const stockFinal = producto.stock - Number(detalle.cantidad);
              if (stockFinal < 0) {
                throw new Error(
                  `Stock insuficiente para el producto ${producto.descripcion}. Stock actual: ${producto.stock}`
                );
              }
            }
          }

          // Datos adicionales de AFIP
          const datosAdicionalesAfip = datosAfip
            ? {
                cae: datosAfip.cae,
                vencimientoCae: datosAfip.vencimientoCae,
                afipComprobante: datosAfip.numeroComprobante,
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
                create: detalles.map((detalle) => ({
                  productoId: Number(detalle.productoId),
                  cantidad: Number(detalle.cantidad),
                  precioUnitario: Number(
                    Number(detalle.precioUnitario).toFixed(2)
                  ),
                  subtotal: Number(
                    (
                      Number(detalle.cantidad) * Number(detalle.precioUnitario)
                    ).toFixed(2)
                  ),
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

          // Actualizar stock
          for (const detalle of detalles) {
            const producto = await tx.producto.findUnique({
              where: { id: Number(detalle.productoId) },
              select: { stock: true },
            });

            if (!producto) continue;

            // Si es una venta normal, decrementar stock
            if (!req.body.aumentaStock) {
              await tx.producto.update({
                where: { id: Number(detalle.productoId) },
                data: {
                  stock: Math.max(0, producto.stock - Number(detalle.cantidad)),
                },
              });
            } else {
              // Si es una nota de crédito o devolución, incrementar stock
              await tx.producto.update({
                where: { id: Number(detalle.productoId) },
                data: {
                  stock: {
                    increment: Number(detalle.cantidad),
                  },
                },
              });
            }
          }

          return factura;
        });

        return res.status(201).json({
          ...nuevaFactura,
          afip: datosAfip
            ? {
                cae: datosAfip.cae,
                vencimientoCae: datosAfip.vencimientoCae,
                numeroComprobante: datosAfip.numeroComprobante,
              }
            : null,
        });
      } catch (error) {
        console.error(
          "Error en la creación de factura:",
          error instanceof Error
            ? { message: error.message, stack: error.stack }
            : String(error)
        );

        let errorMessage = "Error desconocido";
        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (error !== null && error !== undefined) {
          errorMessage = String(error);
        }

        return res.status(500).json({
          error: "Error al crear la factura",
          details: errorMessage,
        });
      }
    } catch (error) {
      console.error(
        "Error en el handler POST:",
        error instanceof Error
          ? { message: error.message, stack: error.stack }
          : String(error)
      );

      let errorMessage = "Error desconocido";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error !== null && error !== undefined) {
        errorMessage = String(error);
      }

      return res.status(500).json({
        error: "Error al procesar la solicitud",
        details: errorMessage,
      });
    }
  }

  return res.status(405).json({ error: "Método no permitido" });
}
