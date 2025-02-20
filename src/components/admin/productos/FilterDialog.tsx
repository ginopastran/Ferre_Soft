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

interface FilterDialogProps {
  isOpen: boolean;
  onClose: () => void;
  filterUnit: string;
  onFilterChange: (value: string) => void;
}

export const FilterDialog: React.FC<FilterDialogProps> = ({
  isOpen,
  onClose,
  filterUnit,
  onFilterChange,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90vw] md:w-full rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-indigo-gradient font-bold text-2xl">
            Filtrar Productos
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo de medida</label>
            <Select
              value={filterUnit}
              onValueChange={(value) => {
                onFilterChange(value);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="Unidad">Unidad</SelectItem>
                <SelectItem value="Kg">Kg</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={onClose}
            className="bg-indigo-gradient text-white hover:text-white"
          >
            Aplicar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
