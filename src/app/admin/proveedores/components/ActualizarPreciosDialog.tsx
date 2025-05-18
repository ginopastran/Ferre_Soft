import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface ActualizarPreciosDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proveedores?: Array<{ id: number; nombre: string }>;
  proveedorId?: number;
}

export function ActualizarPreciosDialog({
  open,
  onOpenChange,
  proveedores,
  proveedorId: initialProveedorId,
}: ActualizarPreciosDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [proveedorId, setProveedorId] = useState<string>(
    initialProveedorId?.toString() || ""
  );
  const [porcentaje, setPorcentaje] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proveedorId || !porcentaje) {
      toast.error("Por favor complete todos los campos");
      return;
    }

    const porcentajeNum = parseFloat(porcentaje);
    if (isNaN(porcentajeNum) || porcentajeNum <= 0) {
      toast.error("Ingrese un porcentaje válido");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/proveedores/actualizar-precios", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          proveedorId: parseInt(proveedorId),
          porcentaje: porcentajeNum,
        }),
      });

      if (!response.ok) throw new Error("Error al actualizar precios");

      toast.success("Precios actualizados correctamente");
      onOpenChange(false);
      setPorcentaje("");
      setProveedorId("");
    } catch (error) {
      console.error(error);
      toast.error("Error al actualizar los precios");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-cyan-gradient">
            Actualizar Precios
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!initialProveedorId && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Proveedor</label>
              <Select
                value={proveedorId}
                onValueChange={setProveedorId}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un proveedor" />
                </SelectTrigger>
                <SelectContent>
                  {proveedores?.map((proveedor) => (
                    <SelectItem
                      key={proveedor.id}
                      value={proveedor.id.toString()}
                    >
                      {proveedor.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Porcentaje de Aumento</label>
            <div className="relative">
              <Input
                type="number"
                step="0.01"
                min="0"
                value={porcentaje}
                onChange={(e) => setPorcentaje(e.target.value)}
                disabled={isLoading}
                className="pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2">
                %
              </span>
            </div>
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
              {isLoading ? "Actualizando..." : "Actualizar Precios"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
