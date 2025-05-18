import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";

interface FilterDialogProps {
  isOpen: boolean;
  onClose: () => void;
  filterRubro: string;
  filterProveedor: string;
  onFilterChange: (type: "rubro" | "proveedor", value: string) => void;
}

export const FilterDialog: React.FC<FilterDialogProps> = ({
  isOpen,
  onClose,
  filterRubro,
  filterProveedor,
  onFilterChange,
}) => {
  const [rubros, setRubros] = useState<string[]>([]);
  const [proveedores, setProveedores] = useState<string[]>([]);

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        // Fetch both rubros and proveedores in parallel
        const [rubrosResponse, proveedoresResponse] = await Promise.all([
          fetch("/api/rubros"),
          fetch("/api/proveedores"),
        ]);

        const rubrosData = await rubrosResponse.json();
        const proveedoresData = await proveedoresResponse.json();

        setRubros(rubrosData.map((r: any) => r.nombre));

        // Extract unique provider names
        const uniqueProveedores = [
          ...new Set(proveedoresData.map((p: any) => p.nombre)),
        ].filter((nombre): nombre is string => typeof nombre === "string");
        setProveedores(uniqueProveedores);
      } catch (error) {
        console.error("Error al cargar filtros:", error);
      }
    };

    if (isOpen) {
      fetchFilters();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90vw] md:w-full rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-cyan-gradient font-bold text-2xl">
            Filtrar Productos
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Rubro</label>
            <Select
              value={filterRubro}
              onValueChange={(value) => {
                onFilterChange("rubro", value);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar rubro" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {rubros.map((rubro) => (
                  <SelectItem key={rubro} value={rubro}>
                    {rubro}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Proveedor</label>
            <Select
              value={filterProveedor}
              onValueChange={(value) => {
                onFilterChange("proveedor", value);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar proveedor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {proveedores.map((proveedor) => (
                  <SelectItem key={proveedor} value={proveedor}>
                    {proveedor}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={onClose}
            className="bg-cyan-gradient text-white hover:text-white"
          >
            Aplicar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
