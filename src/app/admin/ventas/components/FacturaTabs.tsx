import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/utils/format";
import { Calendar, DollarSign } from "lucide-react";

interface PagoRegistro {
  id: string;
  fecha: Date;
  monto: number;
  metodoPago: string;
  observaciones?: string;
}

interface FacturaTabsProps {
  detalles: Array<{
    id: number;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
    producto: {
      codigo: string;
      descripcion: string;
    };
  }>;
  pagos: PagoRegistro[];
  total: number;
}

export function FacturaTabs({ detalles, pagos = [], total }: FacturaTabsProps) {
  return (
    <Tabs defaultValue="detalle" className="w-full">
      <TabsList>
        <TabsTrigger value="detalle">Detalle de productos</TabsTrigger>
        <TabsTrigger value="pagos">Registro de pagos</TabsTrigger>
      </TabsList>

      <TabsContent value="detalle">
        <div className="rounded-lg border overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Código
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Descripción
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Cantidad
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Precio Unit.
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Subtotal
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {detalles.map((detalle) => (
                <tr key={detalle.id}>
                  <td className="px-6 py-4">{detalle.producto.codigo}</td>
                  <td className="px-6 py-4">{detalle.producto.descripcion}</td>
                  <td className="px-6 py-4 text-right">{detalle.cantidad}</td>
                  <td className="px-6 py-4 text-right">
                    {formatCurrency(detalle.precioUnitario)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {formatCurrency(detalle.subtotal)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-muted/50">
              <tr>
                <td colSpan={4} className="px-6 py-4 text-right font-medium">
                  Total:
                </td>
                <td className="px-6 py-4 text-right font-medium">
                  {formatCurrency(total)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </TabsContent>

      <TabsContent value="pagos">
        <div className="rounded-lg border overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Método de pago
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Monto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Observaciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pagos.map((pago) => (
                <tr key={pago.id}>
                  <td className="px-6 py-4">
                    {new Date(pago.fecha).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">{pago.metodoPago}</td>
                  <td className="px-6 py-4 text-right">
                    {formatCurrency(pago.monto)}
                  </td>
                  <td className="px-6 py-4">{pago.observaciones || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TabsContent>
    </Tabs>
  );
}
