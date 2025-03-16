import { BlockKind } from "@/components/block";
import { getBusinessData } from "@/lib/db/analytics";

export const blocksPrompt = `
Blocks es una interfaz especial que ayuda a los usuarios con tareas de escritura, edición y otras tareas de creación de contenido. Cuando el bloque está abierto, se encuentra en el lado derecho de la pantalla, mientras que la conversación está en el lado izquierdo. Al crear o actualizar documentos, los cambios se reflejan en tiempo real en los bloques y son visibles para el usuario.

Cuando se te pida escribir código, siempre usa bloques. Al escribir código, especifica el lenguaje en los backticks, por ejemplo \`\`\`typescript\`código aquí\`\`\`. El lenguaje predeterminado es TypeScript, ya que es el lenguaje principal del proyecto.

NO ACTUALICES LOS DOCUMENTOS INMEDIATAMENTE DESPUÉS DE CREARLOS. ESPERA LA RETROALIMENTACIÓN DEL USUARIO O LA SOLICITUD DE ACTUALIZACIÓN.

Esta es una guía para usar las herramientas de bloques: \`createDocument\` y \`updateDocument\`, que renderizan contenido en bloques junto a la conversación.

**Cuándo usar \`createDocument\`:**
- Para contenido sustancial (>10 líneas) o código
- Para contenido que los usuarios probablemente guardarán/reutilizarán (reportes, código, documentación, etc.)
- Cuando se solicite explícitamente crear un documento
- Cuando el contenido contiene un fragmento de código único

**Cuándo NO usar \`createDocument\`:**
- Para contenido informativo/explicativo
- Para respuestas conversacionales
- Cuando se pida mantenerlo en el chat

**Usando \`updateDocument\`:**
- Por defecto, usa reescrituras completas del documento para cambios mayores
- Usa actualizaciones específicas solo para cambios aislados
- Sigue las instrucciones del usuario sobre qué partes modificar

**Cuándo NO usar \`updateDocument\`:**
- Inmediatamente después de crear un documento
`;

export const regularPrompt =
  "Eres un asistente amigable para la ferretería. Mantén tus respuestas concisas y útiles.";

interface VentaData {
  ventas: number;
  cantidad: number;
}

interface VendedorData {
  ventas: number;
  cantidad: number;
  facturas: number;
  comision: number;
}

interface ClienteData {
  ventas: number;
  cantidad: number;
  facturas: number;
  ultimaCompra: Date | null;
}

interface RubroData {
  ventas: number;
  cantidad: number;
}

interface MetodosPagoDia {
  [metodo: string]: number;
}

interface MetodosPagoDiarios {
  [dia: string]: MetodosPagoDia;
}

export async function getSystemPrompt() {
  const data = await getBusinessData();

  // Analizar ventas por día de la semana
  const ventasPorDia = new Map();
  const productosPorDia = new Map();
  const ventasPorHora = new Map();
  const ventasPorRubro = new Map();
  const ventasPorCliente = new Map();
  const ventasPorVendedor = new Map();
  const metodoPagoPorDia = new Map();

  // Inicializar mapa de horas
  for (let i = 0; i < 24; i++) {
    ventasPorHora.set(i, { ventas: 0, cantidad: 0 });
  }

  data.facturas.forEach((factura) => {
    const fecha = new Date(factura.fecha);
    const diaSemana = fecha.toLocaleDateString("es-ES", { weekday: "long" });
    const hora = fecha.getHours();

    // Ventas por día
    const ventasActuales = ventasPorDia.get(diaSemana) || 0;
    ventasPorDia.set(diaSemana, ventasActuales + factura.total);

    // Productos por día
    const productosActuales = productosPorDia.get(diaSemana) || 0;
    let cantidadProductos = 0;

    factura.detalles.forEach((detalle) => {
      cantidadProductos += detalle.cantidad;

      // Ventas por rubro
      const rubroActual = ventasPorRubro.get(detalle.producto.rubro) || {
        ventas: 0,
        cantidad: 0,
      };
      rubroActual.ventas += detalle.subtotal;
      rubroActual.cantidad += detalle.cantidad;
      ventasPorRubro.set(detalle.producto.rubro, rubroActual);
    });

    productosPorDia.set(diaSemana, productosActuales + cantidadProductos);

    // Ventas por hora
    const horaActual = ventasPorHora.get(hora) || { ventas: 0, cantidad: 0 };
    horaActual.ventas += factura.total;
    horaActual.cantidad += cantidadProductos;
    ventasPorHora.set(hora, horaActual);

    // Ventas por cliente
    const clienteActual = ventasPorCliente.get(factura.cliente.nombre) || {
      ventas: 0,
      cantidad: 0,
      facturas: 0,
      ultimaCompra: null,
    };
    clienteActual.ventas += factura.total;
    clienteActual.cantidad += cantidadProductos;
    clienteActual.facturas += 1;
    clienteActual.ultimaCompra = fecha;
    ventasPorCliente.set(factura.cliente.nombre, clienteActual);

    // Ventas por vendedor
    const vendedorActual = ventasPorVendedor.get(
      factura?.vendedor?.nombre || ""
    ) || {
      ventas: 0,
      cantidad: 0,
      facturas: 0,
      comision: 0,
    };
    vendedorActual.ventas += factura.total;
    vendedorActual.cantidad += cantidadProductos;
    vendedorActual.facturas += 1;
    vendedorActual.comision +=
      factura.total * (factura?.vendedor?.comision || 0 / 100);
    ventasPorVendedor.set(factura?.vendedor?.nombre || "", vendedorActual);

    // Métodos de pago por día
    const metodoPagoDia = metodoPagoPorDia.get(diaSemana) || new Map();
    factura.pagos.forEach((pago) => {
      const metodoCantidad = metodoPagoDia.get(pago.metodoPago) || 0;
      metodoPagoDia.set(pago.metodoPago, metodoCantidad + 1);
    });
    metodoPagoPorDia.set(diaSemana, metodoPagoDia);
  });

  // Convertir maps a objetos para visualización
  const ventasDiarias = Object.fromEntries(ventasPorDia);
  const productosDiarios = Object.fromEntries(productosPorDia);
  const ventasHorarias = Object.fromEntries(ventasPorHora) as Record<
    string,
    VentaData
  >;
  const ventasRubros = Object.fromEntries(ventasPorRubro) as Record<
    string,
    RubroData
  >;
  const topClientes = Array.from(ventasPorCliente.entries())
    .sort(([, a], [, b]) => b.ventas - a.ventas)
    .slice(0, 5) as [string, ClienteData][];
  const topVendedores = Array.from(ventasPorVendedor.entries()).sort(
    ([, a], [, b]) => b.ventas - a.ventas
  ) as [string, VendedorData][];
  const metodosPagoDiarios = Object.fromEntries(
    Array.from(metodoPagoPorDia.entries()).map(([dia, metodos]) => [
      dia,
      Object.fromEntries(
        Array.from(metodos as Map<string, number>)
      ) as MetodosPagoDia,
    ])
  ) as MetodosPagoDiarios;

  return `Eres un asistente especializado para una ferretería. Tienes acceso a datos detallados y actualizados del negocio:

ANÁLISIS TEMPORAL DE VENTAS:

VENTAS POR DÍA DE LA SEMANA:
${Object.entries(ventasDiarias)
  .map(([dia, total]) => `- ${dia}: $${(total as number).toFixed(2)}`)
  .join("\n")}

PRODUCTOS VENDIDOS POR DÍA:
${Object.entries(productosDiarios)
  .map(([dia, cantidad]) => `- ${dia}: ${cantidad} unidades`)
  .join("\n")}

VENTAS POR HORA DEL DÍA:
${Object.entries(ventasHorarias)
  .map(
    ([hora, datos]) =>
      `- ${hora}:00hs: $${datos.ventas.toFixed(2)} (${datos.cantidad} unidades)`
  )
  .join("\n")}

ANÁLISIS POR RUBRO:
${Object.entries(ventasRubros)
  .map(
    ([rubro, datos]) =>
      `- ${rubro}: $${datos.ventas.toFixed(2)} (${datos.cantidad} unidades)`
  )
  .join("\n")}

TOP 5 CLIENTES:
${topClientes
  .map(
    ([cliente, datos]) =>
      `- ${cliente}: $${datos.ventas.toFixed(2)} (${datos.facturas} facturas)`
  )
  .join("\n")}

RENDIMIENTO DE VENDEDORES:
${topVendedores
  .map(
    ([vendedor, datos]) =>
      `- ${vendedor}: $${datos.ventas.toFixed(2)} (${
        datos.facturas
      } facturas, Comisión: $${datos.comision.toFixed(2)})`
  )
  .join("\n")}

MÉTODOS DE PAGO POR DÍA:
${Object.entries(metodosPagoDiarios)
  .map(
    ([dia, metodos]) =>
      `- ${dia}:\n${Object.entries(metodos)
        .map(([metodo, cantidad]) => `  * ${metodo}: ${cantidad} transacciones`)
        .join("\n")}`
  )
  .join("\n")}

GESTIÓN DE PRODUCTOS:
- Catálogo completo de productos ferreteros
- Control de stock y alertas de inventario bajo
- Precios y márgenes de ganancia
- Códigos de productos y códigos de barras
- Rubros y categorías de productos

VENTAS Y FACTURACIÓN:
- Proceso de facturación (Facturas A, Remitos, Notas de Crédito)
- Gestión de pagos (Efectivo, Tarjeta, Transferencia)
- Estado de facturas (Pendiente, Pagada, Anulada)
- Reportes de ventas y estadísticas

GESTIÓN DE CLIENTES:
- Base de datos de clientes
- Situación IVA de clientes
- Historial de compras
- Datos de contacto y ubicación

GESTIÓN DE VENDEDORES:
- Comisiones y pagos
- Rendimiento y estadísticas
- Asignación a sucursales
- Control de acceso según rol (ADMIN o VENDEDOR)

ESTRUCTURA DE LA BASE DE DATOS:
Productos:
- ID, código, descripción, rubro
- Precio costo, IVA, márgenes de ganancia
- Stock y control de inventario
- Códigos de proveedor y barras

Facturas:
- Número de factura y tipo de comprobante
- Cliente y vendedor asociados
- Total, estado de pago y detalles
- Historial de pagos

Clientes:
- Datos personales y de contacto
- Situación IVA y documentación
- Ubicación (país, provincia, localidad)
- Historial de compras

Vendedores:
- Datos personales y de contacto
- Comisiones y sucursal asignada
- Historial de ventas y pagos
- Nivel de acceso (rol)

MÉTRICAS ACTUALES:
- Ventas totales: ${data.resumen.totalVentas}
- Cantidad de clientes: ${data.resumen.cantidadClientes}
- Margen de ganancia: ${data.resumen.margenGanancia}
- Crecimiento en ventas: ${data.resumen.porcentajeVentas}%
- Crecimiento en clientes: ${data.resumen.porcentajeClientes}%

PRODUCTOS MÁS VENDIDOS:
${data.resumen.productosMasVendidos
  .map((p) => `- ${p.nombre}: ${p.cantidad} unidades, Total: $${p.montoTotal}`)
  .join("\n")}

MÉTODOS DE PAGO:
${Object.entries(data.resumen.metodoPago)
  .map(([metodo, porcentaje]) => `- ${metodo}: ${porcentaje}%`)
  .join("\n")}

INVENTARIO CRÍTICO (stock bajo):
${data.productos
  .filter((p) => (p.stock || 0) < 10)
  .map((p) => `- ${p.descripcion}: ${p.stock}`)
  .join("\n")}

TENDENCIAS DE VENTAS MENSUALES:
${data.resumen.ventasMensuales
  .map((venta, index) => `- Mes ${index + 1}: $${venta}`)
  .join("\n")}

CAPACIDADES DE ANÁLISIS:
1. Puedo analizar patrones de venta por:
   - Día de la semana
   - Hora del día
   - Rubro de productos
   - Vendedor
   - Cliente
   - Método de pago

2. Puedo identificar:
   - Horas pico de ventas
   - Días más rentables
   - Productos más populares
   - Mejores clientes
   - Vendedores destacados
   - Tendencias de pago

3. Puedo generar insights sobre:
   - Patrones de compra
   - Rendimiento de vendedores
   - Eficiencia de inventario
   - Oportunidades de mejora
   - Predicciones de demanda

4. Puedo recomendar:
   - Mejores horarios para promociones
   - Optimización de stock
   - Estrategias de venta
   - Gestión de personal
   - Mejoras en el servicio

Usa esta información para proporcionar respuestas precisas y relevantes para el negocio.
Cuando te pregunten sobre productos, ventas o estadísticas, asegúrate de usar los datos más recientes disponibles.
Puedo analizar tendencias, patrones y proporcionar insights detallados basados en los datos históricos disponibles.
Si necesitas información específica sobre algún aspecto, puedo profundizar en cualquiera de estas áreas.`;
}

export const codePrompt = `
Eres un generador de código TypeScript especializado en el sistema de ferretería. Al escribir código:

1. Cada fragmento debe ser completo y ejecutable por sí mismo
2. Usa tipos y interfaces apropiados según el schema de Prisma
3. Incluye comentarios explicativos útiles
4. Mantén los fragmentos concisos (generalmente menos de 20 líneas)
5. Maneja errores adecuadamente
6. Sigue las convenciones de Next.js y React
7. Usa las utilidades y componentes existentes cuando sea posible
8. Implementa validación de datos cuando sea necesario
9. Considera la seguridad y los roles de usuario
10. Sigue las mejores prácticas de TypeScript

Ejemplo de un buen fragmento:

\`\`\`typescript
// Calcular el total de ventas por vendedor
async function calcularVentasPorVendedor(vendedorId: number) {
  try {
    const facturas = await prisma.factura.findMany({
      where: {
        vendedorId,
        estado: "PAGADA"
      },
      select: {
        total: true,
        detalles: {
          select: {
            cantidad: true,
            precioUnitario: true
          }
        }
      }
    });

    const totalVentas = facturas.reduce((sum, factura) => sum + factura.total, 0);
    return totalVentas;
  } catch (error) {
    console.error("Error al calcular ventas:", error);
    throw new Error("No se pudieron calcular las ventas del vendedor");
  }
}
\`\`\`
`;

export const updateDocumentPrompt = (
  currentContent: string | null,
  type: BlockKind
) =>
  type === "text"
    ? `\
Mejora el siguiente contenido del documento basado en el prompt dado.

${currentContent}
`
    : type === "code"
    ? `\
Mejora el siguiente fragmento de código basado en el prompt dado.

${currentContent}
`
    : "";

interface SucursalData {
  ventas: number;
  clientes: number;
  topProductos: string[];
}
