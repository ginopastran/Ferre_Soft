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
import { useState } from "react";
import { toast } from "sonner";

interface VendedorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => Promise<void>;
  sucursales: Array<{ id: number; nombre: string }>;
}

interface VendedorForm {
  nombre: string;
  dni: string;
  email: string;
  password: string;
  telefono: string;
  sucursalId: string;
  comision: string;
}

export function VendedorDialog({
  open,
  onOpenChange,
  onSubmit,
  sucursales,
}: VendedorDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<VendedorForm>({
    nombre: "",
    dni: "",
    email: "",
    telefono: "",
    password: "",
    sucursalId: "",
    comision: "0",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones
    if (!formData.nombre.trim()) {
      toast.error("El nombre es requerido");
      return;
    }
    if (!formData.email.trim()) {
      toast.error("El email es requerido");
      return;
    }
    if (!formData.password || formData.password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setIsLoading(true);
    try {
      // Crear email permitido automáticamente
      await fetch("/api/emails-permitidos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          activo: true,
        }),
      });

      await onSubmit(formData);
      setFormData({
        nombre: "",
        dni: "",
        email: "",
        telefono: "",
        password: "",
        sucursalId: "",
        comision: "0",
      });
      onOpenChange(false);
      toast.success("Vendedor creado exitosamente");
    } catch (error: any) {
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error("Error al crear el vendedor");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-cyan-gradient">
            Nuevo Vendedor
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
            <label className="text-sm font-medium">DNI</label>
            <Input
              value={formData.dni}
              onChange={(e) =>
                setFormData({ ...formData, dni: e.target.value })
              }
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input
              type="email"
              required
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Contraseña</label>
            <Input
              type="password"
              required
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
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
            <label className="text-sm font-medium">Sucursal</label>
            <Select
              value={formData.sucursalId}
              onValueChange={(value) =>
                setFormData({ ...formData, sucursalId: value })
              }
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccione una sucursal" />
              </SelectTrigger>
              <SelectContent>
                {sucursales.map((sucursal) => (
                  <SelectItem key={sucursal.id} value={sucursal.id.toString()}>
                    {sucursal.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Comisión (%)</label>
            <Input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={formData.comision}
              onChange={(e) =>
                setFormData({ ...formData, comision: e.target.value })
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
              {isLoading ? "Creando..." : "Crear Vendedor"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
