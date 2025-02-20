import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";

interface RubroDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { nombre: string }) => Promise<void>;
}

export function RubroDialog({
  open,
  onOpenChange,
  onSubmit,
}: RubroDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [nombre, setNombre] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSubmit({ nombre });
      setNombre("");
      onOpenChange(false);
      toast.success("Rubro creado exitosamente");
    } catch (error) {
      toast.error("Error al crear el rubro");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-indigo-gradient text-2xl">
            Nuevo Rubro
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nombre</label>
            <Input
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              disabled={isLoading}
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
              className="bg-indigo-gradient text-white hover:text-white"
            >
              {isLoading ? "Creando..." : "Crear Rubro"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
