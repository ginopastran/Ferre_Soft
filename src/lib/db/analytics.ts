import { prisma } from "@/lib/prisma";

interface SucursalData {
  ventas: number;
  clientes: number;
  topProductos: string[];
}

export async function getBusinessData() {
  try {
    const [facturas, productos, sucursales] = await Promise.all([
      prisma.factura.findMany({
        include: {
          detalles: {
            include: {
              producto: true,
            },
          },
          vendedor: true,
          cliente: true,
          pagos: true,
        },
        orderBy: {
          fecha: "desc",
        },
        take: 100,
      }),
      prisma.producto.findMany({
        where: {
          stock: {
            lte: 10, // Solo productos con stock bajo
          },
        },
      }),
      prisma.sucursal.findMany(),
    ]);

    // Calcular datos mensuales
    const monthlyData = new Array(12).fill(0);
    facturas.forEach((factura) => {
      const date = new Date(factura.fecha);
      const monthIndex = date.getMonth();
      monthlyData[monthIndex] += factura.total;
    });

    // Calcular métricas de rendimiento
    const ventasEsteMes = facturas
      .filter((factura) => {
        const fecha = new Date(factura.fecha);
        const hoy = new Date();
        return (
          fecha.getMonth() === hoy.getMonth() &&
          fecha.getFullYear() === hoy.getFullYear()
        );
      })
      .reduce((sum, factura) => sum + factura.total, 0);

    const margenGanancia = facturas.reduce((sum, factura) => {
      return (
        sum +
        factura.detalles.reduce((subtotal, detalle) => {
          const costoTotal = detalle.producto.precioCosto * detalle.cantidad;
          const ventaTotal = detalle.subtotal;
          return subtotal + (ventaTotal - costoTotal);
        }, 0)
      );
    }, 0);

    // Obtener métodos de pago
    const metodoPagoMap = new Map();
    facturas.forEach((factura) => {
      factura.pagos.forEach((pago) => {
        const actual = metodoPagoMap.get(pago.metodoPago) || 0;
        metodoPagoMap.set(pago.metodoPago, actual + 1);
      });
    });
    const totalPagos = Array.from(metodoPagoMap.values()).reduce(
      (a, b) => a + b,
      0
    );
    const metodoPago = Object.fromEntries(
      Array.from(metodoPagoMap.entries()).map(([metodo, cantidad]) => [
        metodo,
        ((cantidad as number) / totalPagos) * 100,
      ])
    );

    // Obtener clientes únicos
    const clientesUnicos = new Set(facturas.map((f) => f.clienteId)).size;

    return {
      facturas,
      productos,
      sucursales,
      resumen: {
        totalVentas: ventasEsteMes,
        cantidadClientes: clientesUnicos,
        margenGanancia,
        productosMasVendidos: obtenerProductosMasVendidos(facturas),
        metodoPago,
        ventasMensuales: monthlyData,
        porcentajeVentas: calcularPorcentajeCambio(
          ventasEsteMes,
          monthlyData[new Date().getMonth() - 1] || 0
        ),
        porcentajeClientes: calcularPorcentajeCambio(
          clientesUnicos,
          facturas.length
        ),
      },
    };
  } catch (error) {
    console.error("Error obteniendo datos del negocio:", error);
    throw error;
  }
}

function calcularPorcentajeCambio(actual: number, anterior: number) {
  if (anterior === 0) return actual > 0 ? 100 : 0;
  return Number((((actual - anterior) / anterior) * 100).toFixed(2));
}

function obtenerProductosMasVendidos(facturas: any[]) {
  const productosMap = new Map();

  facturas.forEach((factura) => {
    factura.detalles.forEach((detalle: any) => {
      const key = detalle.producto.descripcion;
      const actual = productosMap.get(key) || {
        cantidad: 0,
        montoTotal: 0,
      };

      actual.cantidad += detalle.cantidad;
      actual.montoTotal += detalle.subtotal;

      productosMap.set(key, actual);
    });
  });

  return Array.from(productosMap.entries())
    .sort(([, a], [, b]) => b.montoTotal - a.montoTotal)
    .slice(0, 5)
    .map(([nombre, datos]) => ({
      nombre,
      cantidad: datos.cantidad,
      montoTotal: datos.montoTotal,
    }));
}
