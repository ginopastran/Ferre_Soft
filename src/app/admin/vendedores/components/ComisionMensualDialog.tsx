import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { CalendarIcon, DollarSign, Loader2 } from "lucide-react";

interface ComisionMensualDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendedorId: number;
  nombreVendedor: string;
  comisionPorcentaje: number;
  onPagoComplete?: () => void;
}

interface Factura {
  id: string;
  numero: string;
  fecha: Date;
  fechaPago: Date;
  tipoComprobante: string;
  total: number;
  estado: string;
  cliente: {
    nombre: string;
  };
}

export function ComisionMensualDialog({
  open,
  onOpenChange,
  vendedorId,
  nombreVendedor,
  comisionPorcentaje,
  onPagoComplete,
}: ComisionMensualDialogProps) {
  const [mes, setMes] = useState<string>("");
  const [anio, setAnio] = useState<string>(new Date().getFullYear().toString());
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingPago, setProcessingPago] = useState(false);
  const [totalComision, setTotalComision] = useState(0);

  // Generar opciones para los selectores
  const meses = [
    { value: "1", label: "Enero" },
    { value: "2", label: "Febrero" },
    { value: "3", label: "Marzo" },
    { value: "4", label: "Abril" },
    { value: "5", label: "Mayo" },
    { value: "6", label: "Junio" },
    { value: "7", label: "Julio" },
    { value: "8", label: "Agosto" },
    { value: "9", label: "Septiembre" },
    { value: "10", label: "Octubre" },
    { value: "11", label: "Noviembre" },
    { value: "12", label: "Diciembre" },
  ];

  const anios = Array.from({ length: 5 }, (_, i) =>
    (new Date().getFullYear() - 2 + i).toString()
  );

  useEffect(() => {
    if (mes && anio) {
      fetchFacturasPagadas();
    }
  }, [mes, anio, vendedorId]);

  const fetchFacturasPagadas = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/usuarios/${vendedorId}/comisiones?mes=${mes}&anio=${anio}`
      );

      if (!response.ok) {
        throw new Error("Error al obtener facturas");
      }

      const data = await response.json();
      setFacturas(data.facturas);

      // Calcular comisión total (3% del total de facturas)
      const total = data.facturas.reduce(
        (sum: number, factura: Factura) => sum + factura.total,
        0
      );
      setTotalComision(total * (comisionPorcentaje / 100));
    } catch (error) {
      console.error("Error al cargar facturas:", error);
      toast.error("Error al cargar las facturas del mes");
    } finally {
      setLoading(false);
    }
  };

  const handlePagarComision = async () => {
    if (totalComision <= 0) {
      toast.error("No hay comisiones para pagar en este período");
      return;
    }

    setProcessingPago(true);
    try {
      const response = await fetch(`/api/usuarios/${vendedorId}/pagos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          monto: totalComision,
          metodoPago: "TRANSFERENCIA",
          observaciones: `Comisión del ${
            meses.find((m) => m.value === mes)?.label
          } ${anio} (${facturas.length} facturas)`,
          mesComision: parseInt(mes),
          anioComision: parseInt(anio),
        }),
      });

      if (!response.ok) throw new Error("Error al registrar el pago");

      toast.success("Comisión pagada correctamente");
      onPagoComplete?.();
      onOpenChange(false);
    } catch (error) {
      toast.error("Error al registrar el pago de comisión");
    } finally {
      setProcessingPago(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-indigo-gradient">
            Comisiones Mensuales - {nombreVendedor}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="space-y-2 flex-1">
              <label className="text-sm font-medium">Mes</label>
              <Select value={mes} onValueChange={setMes}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione mes" />
                </SelectTrigger>
                <SelectContent>
                  {meses.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 flex-1">
              <label className="text-sm font-medium">Año</label>
              <Select value={anio} onValueChange={setAnio}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione año" />
                </SelectTrigger>
                <SelectContent>
                  {anios.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
          ) : facturas.length > 0 ? (
            <>
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Fecha Pago</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">
                        Comisión ({comisionPorcentaje}%)
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {facturas.map((factura) => (
                      <TableRow key={factura.id}>
                        <TableCell>{factura.numero}</TableCell>
                        <TableCell>{factura.cliente.nombre}</TableCell>
                        <TableCell>
                          {new Date(factura.fechaPago).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(factura.total)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(
                            factura.total * (comisionPorcentaje / 100)
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="bg-indigo-50 p-4 rounded-md">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">
                      Total Facturas: {facturas.length}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Comisión: {comisionPorcentaje}% del total
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">Total Ventas:</p>
                    <p className="text-lg font-bold">
                      {formatCurrency(
                        facturas.reduce(
                          (sum, factura) => sum + factura.total,
                          0
                        )
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">Total Comisión:</p>
                    <p className="text-xl font-bold text-indigo-600">
                      {formatCurrency(totalComision)}
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : mes && anio ? (
            <div className="text-center py-8 text-muted-foreground">
              No se encontraron facturas pagadas en este período
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Seleccione un mes y año para ver las comisiones
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={processingPago}
              className="bg-cancel-gradient text-white hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              onClick={handlePagarComision}
              disabled={processingPago || totalComision <= 0}
              className="bg-indigo-gradient"
            >
              {processingPago ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <DollarSign className="mr-2 h-4 w-4" />
                  Pagar Comisión
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
