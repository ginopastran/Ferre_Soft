import { prisma } from "@/lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";
import { generarFacturaElectronica, verificarConexion } from "@/lib/afip";

// Definir interfaces para los tipos de datos
interface AfipResponse {
  cae: string;
  vencimientoCae: string;
  numeroComprobante: number;
}

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
      const total = Number(
        detalles
          .reduce(
            (sum, detalle) => sum + detalle.cantidad * detalle.precioUnitario,
            0
          )
          .toFixed(2)
      );
      console.log("Total calculado:", total);

      // Generar número de factura
      let numeroFactura = "";
      let datosAfip: AfipResponse | null = null;
      let datosAdicionalesAfip = {};

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
      }
      // Si es una nota de crédito, generar un número de nota de crédito
      else if (tipoComprobante.startsWith("NOTA_CREDITO")) {
        const ultimaNotaCredito = await prisma.factura.findFirst({
          where: {
            tipoComprobante,
          },
          orderBy: {
            numero: "desc",
          },
        });

        // Generar un nuevo número de nota de crédito
        let nuevoNumero = 1;
        const prefijo = tipoComprobante === "NOTA_CREDITO_A" ? "NCA-" : "NCB-";
        if (ultimaNotaCredito && ultimaNotaCredito.numero.startsWith(prefijo)) {
          nuevoNumero = parseInt(ultimaNotaCredito.numero.substring(4)) + 1;
        }
        numeroFactura = `${prefijo}${nuevoNumero.toString().padStart(8, "0")}`;

        // Para notas de crédito, obtener datos de AFIP
        if (
          tipoComprobante === "NOTA_CREDITO_A" ||
          tipoComprobante === "NOTA_CREDITO_B"
        ) {
          try {
            // Código para obtener datos de AFIP para notas de crédito
            // ... (similar al código para facturas)
          } catch (error) {
            console.error("Error al obtener datos de AFIP:", error);
          }
        }
      }
      // Si es una factura A o B, generar un número de factura y obtener datos de AFIP
      else {
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

        // Verificar conexión con AFIP
        const afipConectado = await verificarConexion();

        // Obtener datos de AFIP solo para facturas A y B
        try {
          if (
            (tipoComprobante === "FACTURA_A" ||
              tipoComprobante === "FACTURA_B") &&
            afipConectado
          ) {
            console.log("Obteniendo datos de AFIP para factura:", {
              tipoComprobante,
              numeroFactura,
              clienteId,
            });

            // Obtener detalles completos para enviar a AFIP
            const detallesCompletos = detalles.map((detalle) => ({
              ...detalle,
              subtotal:
                Number(detalle.cantidad) * Number(detalle.precioUnitario),
            }));

            // Crear objeto de factura para AFIP
            const facturaParaAfip = {
              numero: numeroFactura,
              tipoComprobante,
              total,
            };

            // Obtener datos del cliente para AFIP
            const cliente = await prisma.cliente.findUnique({
              where: { id: Number(clienteId) },
            });

            if (!cliente) {
              throw new Error("Cliente no encontrado");
            }

            // Llamar a la función para generar factura electrónica
            datosAfip = await generarFacturaElectronica(
              facturaParaAfip,
              cliente,
              detallesCompletos
            );

            console.log("Datos obtenidos de AFIP:", datosAfip);
          } else {
            console.log("No se obtuvieron datos de AFIP:", {
              tipoComprobante,
              afipConectado,
            });
          }
        } catch (error) {
          console.error("Error al obtener datos de AFIP:", error);
        }

        // Crear factura y actualizar stock en una transacción
        try {
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

            // Crear datos adicionales para AFIP si existen
            datosAdicionalesAfip = datosAfip
              ? {
                  cae: datosAfip.cae,
                  vencimientoCae: datosAfip.vencimientoCae,
                  afipComprobante: datosAfip.numeroComprobante,
                }
              : {};

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
                // Agregar datos de AFIP si existen
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
                        Number(detalle.cantidad) *
                        Number(detalle.precioUnitario)
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
        } catch (error) {
          // Usar una forma más segura de registrar el error
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
      }

      // Verificar que el número de factura sea único
      const verificarNumeroUnico = async (numero: string): Promise<string> => {
        const existe = await prisma.factura.findUnique({
          where: { numero },
          select: { id: true },
        });

        if (existe) {
          // Si ya existe, incrementar el número y verificar de nuevo
          const num = parseInt(numero.substring(1));
          const nuevoNumero = `F${String(num + 1).padStart(8, "0")}`;
          console.log(
            `Número ${numero} ya existe, intentando con ${nuevoNumero}`
          );
          return verificarNumeroUnico(nuevoNumero);
        }

        return numero;
      };

      // Asegurar que el número sea único
      numeroFactura = await verificarNumeroUnico(numeroFactura);
      console.log("Número de factura único confirmado:", numeroFactura);

      // Obtener datos del cliente para AFIP
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
        ];
        if (!situacionesValidasParaFacturaA.includes(cliente.situacionIVA)) {
          console.log("Situación IVA inválida:", {
            situacionIVA: cliente.situacionIVA,
            situacionesValidas: situacionesValidasParaFacturaA,
          });
          return res.status(400).json({
            error: "Situación IVA inválida",
            details:
              "Para Factura A, el cliente debe ser Responsable Inscripto. " +
              `La situación actual del cliente es "${cliente.situacionIVA}"`,
            situacionIVA: cliente.situacionIVA,
            situacionesValidas: situacionesValidasParaFacturaA,
          });
        }
      }

      // Crear factura para remitos y notas de crédito
      if (
        tipoComprobante === "REMITO" ||
        tipoComprobante.startsWith("NOTA_CREDITO")
      ) {
        try {
          const nuevaFactura = await prisma.$transaction(async (tx) => {
            // Verificar stock
            for (const detalle of detalles) {
              const producto = await tx.producto.findUnique({
                where: { id: Number(detalle.productoId) },
                select: { id: true, stock: true, descripcion: true },
              });

              if (!producto || producto.stock < detalle.cantidad) {
                throw new Error(
                  `Stock insuficiente para el producto ${
                    producto?.descripcion || detalle.productoId
                  }`
                );
              }
            }

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
                // Agregar datos de AFIP si existen
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
                        Number(detalle.cantidad) *
                        Number(detalle.precioUnitario)
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
        } catch (error) {
          // Usar una forma más segura de registrar el error
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
      }
    } catch (error) {
      // Usar una forma más segura de registrar el error
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
  }

  return res.status(405).json({ error: "Método no permitido" });
}
