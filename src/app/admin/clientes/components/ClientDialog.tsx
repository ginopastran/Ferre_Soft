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
import { useState, useEffect } from "react";
import { Cliente } from "@prisma/client";
import { formatDNI, formatPhoneNumber } from "@/lib/utils/format";

const situacionesIVA = [
  "RESPONSABLE_INSCRIPTO",
  "IVA_RESPONSABLE_NO_INSCRIPTO",
  "IVA_NO_RESPONSABLE",
  "IVA_SUJETO_EXENTO",
  "CONSUMIDOR_FINAL",
  "MONOTRIBUTISTA",
  "SUJETO_NO_CATEGORIZADO",
];

export type ClienteForm = Omit<Cliente, "id" | "creadoEn"> & {
  telefono: string;
  email: string;
};

interface ClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ClienteForm) => Promise<void>;
  initialData?: Cliente | null;
  mode?: "create" | "edit";
}

export function ClientDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  mode = "create",
}: ClientDialogProps) {
  const [formData, setFormData] = useState<ClienteForm>(() => {
    if (initialData && mode === "edit") {
      return {
        codigo: initialData.codigo,
        nombre: initialData.nombre,
        direccion: initialData.direccion,
        pais: initialData.pais,
        provincia: initialData.provincia,
        localidad: initialData.localidad,
        situacionIVA: initialData.situacionIVA,
        cuitDni: initialData.cuitDni,
        telefono: initialData.telefono || "",
        email: initialData.email || "",
      };
    }
    return {
      codigo: "",
      nombre: "",
      direccion: "",
      pais: "",
      provincia: "",
      localidad: "",
      situacionIVA: "",
      cuitDni: "",
      telefono: "",
      email: "",
    };
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialData && mode === "edit") {
      setFormData({
        codigo: initialData.codigo,
        nombre: initialData.nombre,
        direccion: initialData.direccion,
        pais: initialData.pais,
        provincia: initialData.provincia,
        localidad: initialData.localidad,
        situacionIVA: initialData.situacionIVA,
        cuitDni: initialData.cuitDni,
        telefono: initialData.telefono || "",
        email: initialData.email || "",
      });
    }
  }, [initialData, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSubmit(formData);
      setFormData({
        codigo: "",
        nombre: "",
        direccion: "",
        pais: "",
        provincia: "",
        localidad: "",
        situacionIVA: "",
        cuitDni: "",
        telefono: "",
        email: "",
      });
      onOpenChange(false);
    } catch (error) {
      // El error ya se maneja en el componente padre
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-cyan-gradient">
            {mode === "create" ? "Nuevo Cliente" : "Editar Cliente"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Código</label>
              <Input
                required
                value={formData.codigo}
                onChange={(e) =>
                  setFormData({ ...formData, codigo: e.target.value })
                }
                placeholder="C001"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">CUIT/DNI</label>
              <Input
                required
                value={formData.cuitDni}
                onChange={(e) => {
                  const formatted = formatDNI(e.target.value);
                  setFormData({ ...formData, cuitDni: formatted });
                }}
                placeholder="23.113.245"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Nombre</label>
            <Input
              required
              value={formData.nombre}
              onChange={(e) =>
                setFormData({ ...formData, nombre: e.target.value })
              }
              placeholder="Juan Pérez"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Dirección</label>
            <Input
              required
              value={formData.direccion}
              onChange={(e) =>
                setFormData({ ...formData, direccion: e.target.value })
              }
              placeholder="Av. Corrientes 1234, Buenos Aires"
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">País</label>
              <Input
                required
                value={formData.pais}
                onChange={(e) =>
                  setFormData({ ...formData, pais: e.target.value })
                }
                placeholder="Argentina"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Provincia</label>
              <Input
                required
                value={formData.provincia}
                onChange={(e) =>
                  setFormData({ ...formData, provincia: e.target.value })
                }
                placeholder="Buenos Aires"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Localidad</label>
              <Input
                required
                value={formData.localidad}
                onChange={(e) =>
                  setFormData({ ...formData, localidad: e.target.value })
                }
                placeholder="Caseros"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Situación IVA</label>
            <Select
              required
              value={formData.situacionIVA}
              onValueChange={(value) =>
                setFormData({ ...formData, situacionIVA: value })
              }
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccione situación IVA" />
              </SelectTrigger>
              <SelectContent>
                {situacionesIVA.map((situacion) => (
                  <SelectItem key={situacion} value={situacion}>
                    {situacion}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Teléfono</label>
              <Input
                value={formData.telefono}
                onChange={(e) => {
                  const formatted = formatPhoneNumber(e.target.value);
                  setFormData({ ...formData, telefono: formatted });
                }}
                placeholder="+54 11 1234-5678"
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
                placeholder="juan.perez@email.com"
                disabled={isLoading}
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-cyan-gradient"
            disabled={isLoading}
          >
            {isLoading
              ? mode === "create"
                ? "Creando cliente..."
                : "Actualizando cliente..."
              : mode === "create"
              ? "Crear Cliente"
              : "Guardar Cambios"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
