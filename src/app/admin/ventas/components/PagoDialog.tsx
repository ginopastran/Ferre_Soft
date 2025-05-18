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

interface PagoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facturaNumero: string;
  total: number;
  pagado: number;
  onPagoComplete?: () => void;
}

export function PagoDialog({
  open,
  onOpenChange,
  facturaNumero,
  total,
  pagado,
  onPagoComplete,
}: PagoDialogProps) {
  const [monto, setMonto] = useState("");
  const [metodoPago, setMetodoPago] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!monto) {
      toast.error("Ingrese un monto");
      return;
    }

    if (!metodoPago) {
      toast.error("Seleccione un método de pago");
      return;
    }

    const montoNumerico = parseCurrency(monto);
    if (isNaN(montoNumerico) || montoNumerico <= 0) {
      toast.error("Ingrese un monto válido");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/facturas/${facturaNumero}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pagado: pagado + montoNumerico,
          pagadoAnterior: pagado,
          total,
          metodoPago,
          observaciones,
        }),
      });

      if (!response.ok) throw new Error("Error al registrar el pago");

      toast.success("Pago registrado correctamente");
      onPagoComplete?.();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error("Error al registrar el pago");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMontoChange = (value: string) => {
    // Remover cualquier caracter que no sea número
    const numericValue = value.replace(/[^0-9]/g, "");
    // Convertir a formato de moneda
    const formattedValue = numericValue
      ? formatCurrency(Number(numericValue) / 100)
      : "";
    setMonto(formattedValue);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-cyan-gradient">
            Registrar Pago
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Total: {formatCurrency(total)}</span>
              <span>Pagado: {formatCurrency(pagado)}</span>
            </div>
            <div className="text-sm text-right">
              Restante: {formatCurrency(total - pagado)}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Monto a pagar</label>
            <Input
              value={monto}
              onChange={(e) => handleMontoChange(e.target.value)}
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
                <SelectItem value="TARJETA">Tarjeta</SelectItem>
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
              className="bg-cyan-gradient"
            >
              {isLoading ? "Registrando..." : "Registrar Pago"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
