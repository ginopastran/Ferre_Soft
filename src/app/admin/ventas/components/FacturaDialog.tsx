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
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { ProductSearchDialog } from "./ProductSearchDialog";
import { useAuth } from "@/contexts/AuthContext";

interface FacturaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => Promise<void>;
}

interface Cliente {
  id: number;
  codigo: string;
  nombre: string;
  situacionIVA: string;
}

interface Producto {
  id: number;
  codigo: string;
  descripcion: string;
  precioFinal1: number;
  precioFinal2: number;
  stock: number;
}

interface DetalleFactura {
  productoId: number;
  producto: Producto;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export function FacturaDialog({
  open,
  onOpenChange,
  onSubmit,
}: FacturaDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [clienteId, setClienteId] = useState<string>("");
  const [tipoComprobante, setTipoComprobante] = useState<string>("");
  const [detalles, setDetalles] = useState<DetalleFactura[]>([]);
  const [isProductSearchOpen, setIsProductSearchOpen] = useState(false);
  const [listaPrecio, setListaPrecio] = useState<"1" | "2">("1");
  const { user } = useAuth();

  useEffect(() => {
    if (open) {
      fetchClientes();
      fetchProductos();
    }
  }, [open]);

  const fetchClientes = async () => {
    try {
      const response = await fetch("/api/clientes");
      const data = await response.json();
      setClientes(data);
    } catch (error) {
      toast.error("Error al cargar clientes");
    }
  };

  const fetchProductos = async () => {
    try {
      const response = await fetch("/api/productos");
      const data = await response.json();
      setProductos(data);
    } catch (error) {
      toast.error("Error al cargar productos");
    }
  };

  const handleAddProducto = () => {
    setIsProductSearchOpen(true);
  };

  const handleRemoveProducto = (index: number) => {
    setDetalles(detalles.filter((_, i) => i !== index));
  };

  const handleProductoChange = (index: number, productoId: number) => {
    const producto = productos.find((p) => p.id === Number(productoId));
    if (!producto) return;

    const newDetalles = [...detalles];
    newDetalles[index] = {
      ...newDetalles[index],
      productoId: producto.id,
      producto,
      precioUnitario: producto.precioFinal1,
      subtotal: producto.precioFinal1 * newDetalles[index].cantidad,
    };
    setDetalles(newDetalles);
  };

  const handleCantidadChange = (index: number, cantidad: number) => {
    const newDetalles = [...detalles];
    newDetalles[index] = {
      ...newDetalles[index],
      cantidad,
      subtotal: newDetalles[index].precioUnitario * cantidad,
    };
    setDetalles(newDetalles);
  };

  const total = detalles.reduce((sum, detalle) => sum + detalle.subtotal, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteId || !tipoComprobante || detalles.length === 0) {
      toast.error("Por favor complete todos los campos");
      return;
    }

    if (!user?.id) {
      toast.error("No hay un vendedor identificado");
      return;
    }

    console.log("Datos a enviar:", {
      clienteId,
      tipoComprobante,
      vendedorId: user?.id,
      detalles: detalles.map(({ productoId, cantidad, precioUnitario }) => ({
        productoId,
        cantidad,
        precioUnitario,
      })),
    });

    setIsLoading(true);
    try {
      await onSubmit({
        clienteId: Number(clienteId),
        tipoComprobante,
        vendedorId: user?.id,
        detalles: detalles.map(({ productoId, cantidad, precioUnitario }) => ({
          productoId,
          cantidad,
          precioUnitario,
        })),
      });
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error("Error al crear la factura");
    } finally {
      setIsLoading(false);
    }
  };

  const handleProductSelect = (producto: Producto) => {
    const precioSeleccionado =
      listaPrecio === "1" ? producto.precioFinal1 : producto.precioFinal2;

    setDetalles([
      ...detalles,
      {
        productoId: producto.id,
        producto,
        cantidad: 1,
        precioUnitario: precioSeleccionado,
        subtotal: precioSeleccionado,
      },
    ]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-indigo-gradient">
            Nueva Factura
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Cliente</label>
              <Select
                value={clienteId}
                onValueChange={setClienteId}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id.toString()}>
                      {cliente.nombre} - {cliente.codigo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Comprobante</label>
              <Select
                value={tipoComprobante}
                onValueChange={setTipoComprobante}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FACTURA_A">Factura A</SelectItem>
                  <SelectItem value="REMITO">Remito</SelectItem>
                  <SelectItem value="NOTA_CREDITO_A">
                    Nota de Crédito A
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Lista de Precios</label>
              <Select
                value={listaPrecio}
                onValueChange={(value: "1" | "2") => setListaPrecio(value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione lista" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Lista 1</SelectItem>
                  <SelectItem value="2">Lista 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Productos</h3>
              <Button
                type="button"
                onClick={handleAddProducto}
                className="bg-indigo-gradient"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Producto
              </Button>
            </div>

            <div className="space-y-4">
              {detalles.map((detalle, index) => (
                <div key={index} className="flex gap-4 items-end">
                  <div className="flex-1">
                    <label className="text-sm font-medium">Producto</label>
                    <div className="p-2 border rounded-md">
                      {detalle.producto.descripcion} - {detalle.producto.codigo}
                    </div>
                  </div>

                  <div className="w-24">
                    <label className="text-sm font-medium">Cantidad</label>
                    <Input
                      type="number"
                      min="1"
                      value={detalle.cantidad}
                      onChange={(e) =>
                        handleCantidadChange(index, Number(e.target.value))
                      }
                    />
                  </div>

                  <div className="w-32">
                    <label className="text-sm font-medium">Subtotal</label>
                    <Input type="number" value={detalle.subtotal} disabled />
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleRemoveProducto(index)}
                    className="bg-cancel-gradient text-white"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-lg font-semibold">
              Total: ${total.toFixed(2)}
            </div>
            <div className="space-x-2">
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
                className="bg-indigo-gradient"
              >
                {isLoading ? "Creando..." : "Crear Factura"}
              </Button>
            </div>
          </div>
        </form>

        <ProductSearchDialog
          open={isProductSearchOpen}
          onOpenChange={setIsProductSearchOpen}
          onProductSelect={handleProductSelect}
          listaPrecio={listaPrecio}
        />
      </DialogContent>
    </Dialog>
  );
}
