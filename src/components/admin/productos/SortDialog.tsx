import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface SortDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sortField: string;
  sortOrder: "asc" | "desc";
  onSort: (field: string) => void;
}

export const SortDialog: React.FC<SortDialogProps> = ({
  isOpen,
  onClose,
  sortField,
  sortOrder,
  onSort,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90vw] md:w-full rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-indigo-gradient font-bold text-2xl">
            Ordenar Productos
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => onSort("creadoEn")}
            >
              Fecha de Creación
              {sortField === "creadoEn" && (
                <span>
                  {sortOrder === "asc" ? "Más Antiguo ↑" : "Más Reciente ↓"}
                </span>
              )}
            </Button>

            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => onSort("name")}
            >
              Nombre
              {sortField === "name" && (
                <span>{sortOrder === "asc" ? "A-Z ↑" : "Z-A ↓"}</span>
              )}
            </Button>

            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => onSort("pricePerUnit")}
            >
              Costo
              {sortField === "pricePerUnit" && (
                <span>
                  {sortOrder === "asc" ? "Menor-Mayor ↑" : "Mayor-Menor ↓"}
                </span>
              )}
            </Button>

            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => onSort("margen")}
            >
              Margen
              {sortField === "margen" && (
                <span>
                  {sortOrder === "asc" ? "Menor-Mayor ↑" : "Mayor-Menor ↓"}
                </span>
              )}
            </Button>

            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => onSort("price")}
            >
              Precio
              {sortField === "price" && (
                <span>
                  {sortOrder === "asc" ? "Menor-Mayor ↑" : "Mayor-Menor ↓"}
                </span>
              )}
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={onClose}
            className="bg-indigo-gradient hover:bg-indigo-gradient-hover"
          >
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
