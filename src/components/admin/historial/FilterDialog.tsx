import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  vendedores: { id: number; nombre: string }[];
  sucursales: { id: number; nombre: string }[];
  selectedVendedor: string;
  selectedSucursal: string;
  onVendedorChange: (value: string) => void;
  onSucursalChange: (value: string) => void;
}

export function FilterDialog({
  isOpen,
  onClose,
  vendedores,
  sucursales,
  selectedVendedor,
  selectedSucursal,
  onVendedorChange,
  onSucursalChange,
}: FilterDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Filtrar Historial</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Vendedor</label>
            <Select value={selectedVendedor} onValueChange={onVendedorChange}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar vendedor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {vendedores.map((vendedor) => (
                  <SelectItem key={vendedor.id} value={vendedor.id.toString()}>
                    {vendedor.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Sucursal</label>
            <Select value={selectedSucursal} onValueChange={onSucursalChange}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar sucursal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {sucursales.map((sucursal) => (
                  <SelectItem key={sucursal.id} value={sucursal.id.toString()}>
                    {sucursal.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
