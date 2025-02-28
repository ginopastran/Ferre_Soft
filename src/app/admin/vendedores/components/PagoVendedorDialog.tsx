import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { toast } from "sonner";
import { formatCurrency, parseCurrency } from "@/lib/utils/format";

interface PagoVendedorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendedorId: number;
  nombreVendedor: string;
  montoAPagar: number;
  totalPagado: number;
  onPagoComplete?: () => void;
}

export function PagoVendedorDialog({
  open,
  onOpenChange,
  vendedorId,
  nombreVendedor,
  montoAPagar,
  totalPagado,
  onPagoComplete,
}: PagoVendedorDialogProps) {
  const [monto, setMonto] = useState("");
  const [metodoPago, setMetodoPago] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!monto || !metodoPago) {
      toast.error("Complete todos los campos requeridos");
      return;
    }

    const montoNumerico = parseCurrency(monto);
    if (isNaN(montoNumerico) || montoNumerico <= 0) {
      toast.error("Ingrese un monto válido");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/usuarios/${vendedorId}/pagos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          monto: montoNumerico,
          metodoPago,
          observaciones,
        }),
      });

      if (!response.ok) throw new Error("Error al registrar el pago");

      toast.success("Pago registrado correctamente");
      onPagoComplete?.();
      onOpenChange(false);
      setMonto("");
      setMetodoPago("");
      setObservaciones("");
    } catch (error) {
      toast.error("Error al registrar el pago");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-indigo-gradient">
            Registrar Pago a {nombreVendedor}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span>Total comisiones:</span>
                <span>{formatCurrency(montoAPagar)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Total pagado:</span>
                <span>{formatCurrency(totalPagado)}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Pendiente de pago:</span>
                <span>{formatCurrency(montoAPagar - totalPagado)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Monto</label>
            <Input
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              placeholder="$0.00"
              className="text-right"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Método de pago</label>
            <Select value={metodoPago} onValueChange={setMetodoPago}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione método de pago" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EFECTIVO">Efectivo</SelectItem>
                <SelectItem value="TRANSFERENCIA">Transferencia</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Observaciones</label>
            <Textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Ingrese observaciones (opcional)"
              className="resize-none"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="bg-cancel-gradient text-white hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-indigo-gradient"
            >
              {isLoading ? "Registrando..." : "Registrar Pago"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
