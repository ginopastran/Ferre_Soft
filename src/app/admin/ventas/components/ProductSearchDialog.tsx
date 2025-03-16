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
import { formatCurrency } from "@/lib/utils/format";

interface Producto {
  id: number;
  codigo: string;
  descripcion: string;
  precioCosto: number;
  iva: number;
  margenGanancia1: number;
  precioFinal1: number;
  margenGanancia2: number;
  precioFinal2: number;
  stock: number;
}

interface ProductSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductSelect: (producto: Producto) => void;
  listaPrecio: "1" | "2";
  productosAgregados?: number[]; // IDs de productos ya agregados a la factura
}

export function ProductSearchDialog({
  open,
  onOpenChange,
  onProductSelect,
  listaPrecio,
  productosAgregados = [], // Valor por defecto: array vacío
}: ProductSearchDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [productos, setProductos] = useState<Producto[]>([]);
  const [filteredProductos, setFilteredProductos] = useState<Producto[]>([]);

  useEffect(() => {
    if (open) {
      fetchProductos();
    }
  }, [open]);

  useEffect(() => {
    const filtered = productos.filter(
      (producto) =>
        // Filtrar por término de búsqueda
        (producto.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          producto.descripcion
            .toLowerCase()
            .includes(searchTerm.toLowerCase())) &&
        // Solo mostrar productos con stock disponible
        producto.stock > 0 &&
        // Excluir productos ya agregados a la factura
        !productosAgregados.includes(producto.id)
    );
    setFilteredProductos(filtered);
  }, [searchTerm, productos, productosAgregados]);

  const fetchProductos = async () => {
    try {
      const response = await fetch("/api/productos");
      const data = await response.json();
      // Filtrar productos con stock > 0
      const productosConStock = data.filter(
        (producto: Producto) => producto.stock > 0
      );
      setProductos(productosConStock);
      setFilteredProductos(
        productosConStock.filter(
          (producto: Producto) => !productosAgregados.includes(producto.id)
        )
      );
    } catch (error) {
      console.error("Error al cargar productos:", error);
    }
  };

  const handleProductSelect = (producto: Producto) => {
    onProductSelect(producto);
    onOpenChange(false);
    setSearchTerm("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-indigo-gradient">
            Buscar Producto
          </DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por código o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>

        <div className="overflow-y-auto max-h-[50vh]">
          <table className="w-full">
            <thead className="sticky top-0 bg-background">
              <tr className="border-b">
                <th className="text-left py-2">Código</th>
                <th className="text-left py-2">Descripción</th>
                <th className="text-right py-2">Precio</th>
                <th className="text-right py-2">Stock</th>
                <th className="text-right py-2"></th>
              </tr>
            </thead>
            <tbody>
              {filteredProductos.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-4 text-center text-muted-foreground"
                  >
                    No se encontraron productos disponibles
                  </td>
                </tr>
              ) : (
                filteredProductos.map((producto) => (
                  <tr
                    key={producto.id}
                    className="border-b hover:bg-muted/50 transition-colors"
                  >
                    <td className="py-2">{producto.codigo}</td>
                    <td className="py-2">{producto.descripcion}</td>
                    <td className="py-2 text-right">
                      {formatCurrency(
                        listaPrecio === "1"
                          ? producto.precioFinal1
                          : producto.precioFinal2
                      )}
                    </td>
                    <td className="py-2 text-right">{producto.stock}</td>
                    <td className="py-2 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleProductSelect(producto)}
                        className="bg-indigo-gradient text-white hover:text-white"
                      >
                        Seleccionar
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
