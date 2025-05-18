import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Search } from "lucide-react";

interface Rubro {
  id: number;
  nombre: string;
  descripcion?: string;
}

interface RubroSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRubroSelect: (rubro: Rubro) => void;
}

export function RubroSearchDialog({
  open,
  onOpenChange,
  onRubroSelect,
}: RubroSearchDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [rubros, setRubros] = useState<Rubro[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchRubros();
    }
  }, [open]);

  const fetchRubros = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/rubros");
      const data = await response.json();
      setRubros(data);
    } catch (error) {
      console.error("Error al cargar rubros:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRubros = rubros.filter((rubro) =>
    rubro.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-cyan-gradient">
            Buscar Rubro
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center space-x-2 mb-4">
          <Search className="w-5 h-5 text-gray-500" />
          <Input
            type="text"
            placeholder="Buscar por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 text-left">Nombre</th>
                <th className="py-2 px-4 text-left">Descripción</th>
                <th className="py-2 px-4"></th>
              </tr>
            </thead>
            <tbody>
              {filteredRubros.map((rubro) => (
                <tr
                  key={rubro.id}
                  className="border-b hover:bg-gray-50 transition-colors"
                >
                  <td className="py-2 px-4">{rubro.nombre}</td>
                  <td className="py-2 px-4">{rubro.descripcion || "-"}</td>
                  <td className="py-2 px-4 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onRubroSelect(rubro)}
                      className="bg-cyan-gradient text-white hover:text-white"
                    >
                      Elegir
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
