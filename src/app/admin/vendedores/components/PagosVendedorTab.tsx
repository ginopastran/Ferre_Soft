import { useState, useEffect } from "react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface PagosVendedorTabProps {
  vendedorId: number;
  nombreVendedor: string;
}

interface Pago {
  id: string;
  fecha: Date;
  monto: number;
  metodoPago: string;
  observaciones: string | null;
  esComision: boolean;
  mesComision: number | null;
  anioComision: number | null;
}

export function PagosVendedorTab({
  vendedorId,
  nombreVendedor,
}: PagosVendedorTabProps) {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPagos();
  }, [vendedorId]);

  const fetchPagos = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/usuarios/pagos?userId=${vendedorId}`);
      if (!response.ok) {
        throw new Error("Error al obtener pagos");
      }
      const data = await response.json();
      setPagos(data);
    } catch (error) {
      console.error("Error al cargar pagos:", error);
      toast.error("Error al cargar el historial de pagos");
    } finally {
      setLoading(false);
    }
  };

  const getNombreMes = (mes: number) => {
    const meses = [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ];
    return meses[mes - 1] || "";
  };

  const formatMetodoPago = (metodo: string) => {
    switch (metodo) {
      case "EFECTIVO":
        return "Efectivo";
      case "TRANSFERENCIA":
        return "Transferencia";
      default:
        return metodo;
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-6">
          <h3 className="text-lg font-medium">Historial de Pagos</h3>

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
          ) : pagos.length > 0 ? (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Método de Pago</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Observaciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagos.map((pago) => (
                    <TableRow key={pago.id}>
                      <TableCell>
                        {new Date(pago.fecha).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(pago.monto)}
                      </TableCell>
                      <TableCell>{formatMetodoPago(pago.metodoPago)}</TableCell>
                      <TableCell>
                        {pago.esComision ? (
                          <span className="text-green-600 font-medium">
                            Comisión{" "}
                            {pago.mesComision && pago.anioComision
                              ? `${getNombreMes(pago.mesComision)} ${
                                  pago.anioComision
                                }`
                              : ""}
                          </span>
                        ) : (
                          <span>Pago general</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {pago.observaciones || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No hay pagos registrados para este vendedor
            </div>
          )}

          {pagos.length > 0 && (
            <div className="bg-indigo-50 p-4 rounded-md">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">
                    Total de pagos: {pagos.length}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">Total pagado:</p>
                  <p className="text-xl font-bold text-indigo-600">
                    {formatCurrency(
                      pagos.reduce((sum, pago) => sum + pago.monto, 0)
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
