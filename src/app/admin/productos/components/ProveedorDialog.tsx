import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Proveedor } from "@prisma/client";

interface ProveedorForm {
  nombre: string;
  telefono?: string;
  email?: string;
  cuitDni?: string;
  direccion?: string;
}

interface ProveedorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ProveedorForm) => Promise<void>;
  initialData?: Proveedor | null;
  mode?: "create" | "edit";
}

export function ProveedorDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  mode,
}: ProveedorDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<ProveedorForm>({
    nombre: "",
    telefono: "",
    email: "",
    cuitDni: "",
    direccion: "",
  });

  useEffect(() => {
    if (initialData && mode === "edit") {
      setFormData({
        nombre: initialData.nombre,
        telefono: initialData.telefono || "",
        email: initialData.email || "",
        cuitDni: initialData.cuitDni || "",
        direccion: initialData.direccion || "",
      });
    }
  }, [initialData, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre) {
      toast.error("El nombre es requerido");
      return;
    }
    setIsLoading(true);
    try {
      await onSubmit(formData);
      setFormData({
        nombre: "",
        telefono: "",
        email: "",
        cuitDni: "",
        direccion: "",
      });
      onOpenChange(false);
      toast.success(
        mode === "edit"
          ? "Proveedor actualizado exitosamente"
          : "Proveedor creado exitosamente"
      );
    } catch (error) {
      toast.error(
        mode === "edit"
          ? "Error al actualizar el proveedor"
          : "Error al crear el proveedor"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-cyan-gradient text-2xl">
            {mode === "edit" ? "Editar Proveedor" : "Nuevo Proveedor"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nombre</label>
            <Input
              required
              value={formData.nombre}
              onChange={(e) =>
                setFormData({ ...formData, nombre: e.target.value })
              }
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">CUIT/DNI</label>
            <Input
              value={formData.cuitDni}
              onChange={(e) =>
                setFormData({ ...formData, cuitDni: e.target.value })
              }
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Dirección</label>
            <Input
              value={formData.direccion}
              onChange={(e) =>
                setFormData({ ...formData, direccion: e.target.value })
              }
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Teléfono</label>
            <Input
              value={formData.telefono}
              onChange={(e) =>
                setFormData({ ...formData, telefono: e.target.value })
              }
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
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
              className="bg-cyan-gradient"
            >
              {isLoading
                ? mode === "edit"
                  ? "Actualizando..."
                  : "Creando..."
                : mode === "edit"
                ? "Guardar Cambios"
                : "Crear Proveedor"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
