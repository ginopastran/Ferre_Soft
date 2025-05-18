import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus } from "lucide-react";
import { toast } from "sonner";
import { RubroEditDialog } from "./RubroEditDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Rubro {
  id: number;
  nombre: string;
  descripcion?: string;
}

interface RubroListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RubroListDialog({ open, onOpenChange }: RubroListDialogProps) {
  const [rubros, setRubros] = useState<Rubro[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedRubro, setSelectedRubro] = useState<string>("");

  const fetchRubros = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/rubros");
      const data = await response.json();
      setRubros(data);
    } catch (error) {
      console.error("Error al cargar rubros:", error);
      toast.error("Error al cargar los rubros");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchRubros();
    }
  }, [open]);

  const handleEditClick = (nombre: string) => {
    setSelectedRubro(nombre);
    setIsEditDialogOpen(true);
  };

  const filteredRubros = rubros.filter((rubro) =>
    rubro.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-cyan-gradient">
            Administración de Rubros
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 flex-1 max-w-md">
              <Search className="w-5 h-5 text-gray-500" />
              <Input
                type="text"
                placeholder="Buscar por nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>
            <Button
              onClick={() => {
                setSelectedRubro("");
                setIsEditDialogOpen(true);
              }}
              className="bg-cyan-gradient text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Rubro
            </Button>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="py-3 px-4 text-left">Nombre</th>
                    <th className="py-3 px-4 text-left">Descripción</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRubros.map((rubro) => (
                    <tr
                      key={rubro.id}
                      className="border-b last:border-b-0 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4">{rubro.nombre}</td>
                      <td className="py-3 px-4">{rubro.descripcion || "-"}</td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditClick(rubro.nombre)}
                          className="bg-cyan-gradient text-white hover:text-white"
                        >
                          Editar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <RubroEditDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          nombreRubro={selectedRubro}
          onSave={fetchRubros}
        />
      </DialogContent>
    </Dialog>
  );
}
