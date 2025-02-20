import { prisma } from "@/lib/prisma";

interface SucursalData {
  ventas: number;
  clientes: number;
  topProductos: string[];
}

export async function getBusinessData() {
  try {
    const [ventas, productos, sucursales] = await Promise.all([
      prisma.ordenCompra.findMany({
        include: {
          detalles: {
            include: {
              producto: true,
            },
          },
          vendedor: true,
          sucursal: true,
        },
        orderBy: {
          fecha: "desc",
        },
        take: 100,
      }),
      prisma.producto.findMany(),
      prisma.sucursal.findMany(),
    ]);

    // Calcular datos mensuales
    const monthlyData = new Array(12).fill(0);
    ventas.forEach((venta) => {
      const date = new Date(venta.fecha);
      const monthIndex = date.getMonth();
      monthlyData[monthIndex] += venta.total;
    });

    // Calcular métricas de rendimiento
    const ventasEsteMes = ventas
      .filter((venta) => {
        const fecha = new Date(venta.fecha);
        const hoy = new Date();
        return (
          fecha.getMonth() === hoy.getMonth() &&
          fecha.getFullYear() === hoy.getFullYear()
        );
      })
      .reduce((sum, venta) => sum + venta.total, 0);

    const margenGanancia = ventas.reduce((sum, venta) => {
      return (
        sum +
        venta.detalles.reduce((subtotal, detalle) => {
          const costoTotal = detalle.costo * detalle.cantidad;
          const ventaTotal = detalle.subtotal;
          return subtotal + (ventaTotal - costoTotal);
        }, 0)
      );
    }, 0);

    // Obtener métodos de pago
    const metodoPagoMap = new Map();
    ventas.forEach((venta) => {
      const actual = metodoPagoMap.get(venta.metodoPago) || 0;
      metodoPagoMap.set(venta.metodoPago, actual + 1);
    });
    const totalVentas = ventas.length;
    const metodoPago = Object.fromEntries(
      Array.from(metodoPagoMap.entries()).map(([metodo, cantidad]) => [
        metodo,
        ((cantidad as number) / totalVentas) * 100,
      ])
    );

    return {
      ventas,
      productos,
      sucursales,
      resumen: {
        totalVentas: ventasEsteMes,
        cantidadClientes: ventas.length,
        margenGanancia,
        productosMasVendidos: obtenerProductosMasVendidos(ventas),
        ventasPorSucursal: obtenerVentasPorSucursal(ventas),
        metodoPago,
        ventasMensuales: monthlyData,
        porcentajeVentas: calcularPorcentajeCambio(
          ventasEsteMes,
          monthlyData[new Date().getMonth() - 1] || 0
        ),
        porcentajeClientes: calcularPorcentajeCambio(
          ventas.length,
          totalVentas
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

function obtenerProductosMasVendidos(ventas: any[]) {
  const productosMap = new Map();

  ventas.forEach((venta) => {
    venta.detalles.forEach((detalle: any) => {
      const actual = productosMap.get(detalle.producto.nombre) || 0;
      productosMap.set(detalle.producto.nombre, actual + detalle.cantidad);
    });
  });

  return Array.from(productosMap.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);
}

function obtenerVentasPorSucursal(ventas: any[]) {
  const sucursalesMap = new Map<string, SucursalData>();

  ventas.forEach((venta) => {
    const sucursalNombre = venta.sucursal.nombre;
    const actual = sucursalesMap.get(sucursalNombre) || {
      ventas: 0,
      clientes: 0,
      topProductos: [],
    };

    actual.ventas += venta.total;
    actual.clientes += 1;

    // Agregar productos vendidos
    venta.detalles.forEach((detalle: any) => {
      if (!actual.topProductos.includes(detalle.producto.nombre)) {
        actual.topProductos.push(detalle.producto.nombre);
      }
    });

    sucursalesMap.set(sucursalNombre, actual);
  });

  return Object.fromEntries(sucursalesMap);
}
