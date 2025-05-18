import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Plus, Pencil } from "lucide-react";

interface Rubro {
  id: number;
  nombre: string;
}

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
  const [rubros, setRubros] = useState<Rubro[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  useEffect(() => {
    if (open) {
      fetchRubros();
    }
  }, [open]);

  const fetchRubros = async () => {
    try {
      const response = await fetch("/api/rubros");
      const data = await response.json();
      setRubros(data);
    } catch (error) {
      toast.error("Error al cargar rubros");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (editingId) {
        // Actualizar rubro existente
        const response = await fetch(`/api/rubros/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nombre }),
        });

        if (!response.ok) throw new Error("Error al actualizar el rubro");
        toast.success("Rubro actualizado exitosamente");
      } else {
        // Crear nuevo rubro
        await onSubmit({ nombre });
        toast.success("Rubro creado exitosamente");
      }

      setNombre("");
      setEditingId(null);
      setIsAddingNew(false);
      await fetchRubros();
    } catch (error) {
      toast.error(
        editingId ? "Error al actualizar el rubro" : "Error al crear el rubro"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (rubro: Rubro) => {
    setNombre(rubro.nombre);
    setEditingId(rubro.id);
    setIsAddingNew(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-cyan-gradient text-2xl">
            Gestionar Rubros
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!isAddingNew ? (
            <>
              <div className="flex justify-end">
                <Button
                  onClick={() => setIsAddingNew(true)}
                  className="bg-cyan-gradient"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Rubro
                </Button>
              </div>

              <div className="border rounded-lg divide-y">
                {rubros.map((rubro) => (
                  <div
                    key={rubro.id}
                    className="flex items-center justify-between p-3"
                  >
                    <span>{rubro.nombre}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(rubro)}
                      className="bg-cyan-gradient text-white hover:text-white"
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre del Rubro</label>
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
                  onClick={() => {
                    setIsAddingNew(false);
                    setEditingId(null);
                    setNombre("");
                  }}
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
                    ? editingId
                      ? "Actualizando..."
                      : "Creando..."
                    : editingId
                    ? "Actualizar Rubro"
                    : "Crear Rubro"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
