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
import { Info, Plus, Trash2 } from "lucide-react";
import { ProductSearchDialog } from "./ProductSearchDialog";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/lib/utils/format";

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
  precioCosto: number;
  iva: number;
  margenGanancia1: number;
  precioFinal1: number;
  margenGanancia2: number;
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
  const [tipoIvaRemito, setTipoIvaRemito] = useState<
    "sin_iva" | "iva_10_5" | "iva_21"
  >("sin_iva");
  const [detalles, setDetalles] = useState<DetalleFactura[]>([]);
  const [isProductSearchOpen, setIsProductSearchOpen] = useState(false);
  const [listaPrecio, setListaPrecio] = useState<"1" | "2">("1");
  const [clienteSeleccionado, setClienteSeleccionado] =
    useState<Cliente | null>(null);
  const [aumentaStock, setAumentaStock] = useState(false);
  const [descuento, setDescuento] = useState<string>("");
  const { user } = useAuth();

  useEffect(() => {
    if (open) {
      fetchClientes();
      fetchProductos();
    }
  }, [open]);

  useEffect(() => {
    if (detalles.length > 0) {
      const nuevosDetalles = detalles.map((detalle) => {
        let precioFinal;

        // Calculamos el precio base sin IVA usando el precio de costo y el margen
        const margen =
          listaPrecio === "1"
            ? detalle.producto.margenGanancia1
            : detalle.producto.margenGanancia2;

        // Precio base sin IVA = Precio de costo * (1 + margen/100)
        const precioBaseSinIva =
          detalle.producto.precioCosto * (1 + margen / 100);

        if (
          tipoComprobante === "REMITO" ||
          tipoComprobante === "NOTA_CREDITO_REMITO"
        ) {
          if (tipoIvaRemito === "sin_iva") {
            // Para "Sin IVA", usamos el precio base sin IVA
            precioFinal = precioBaseSinIva;
          } else if (tipoIvaRemito === "iva_10_5") {
            // Para "Con IVA 10,5%", aplicamos 10.5% de IVA al precio base sin IVA
            precioFinal = precioBaseSinIva * 1.105;
          } else {
            // Para "Con IVA 21%", aplicamos 21% de IVA al precio base sin IVA
            precioFinal = precioBaseSinIva * 1.21;
          }
        } else if (
          tipoComprobante === "FACTURA_A" ||
          tipoComprobante === "NOTA_CREDITO_A"
        ) {
          // Para Factura A y Nota de Crédito A, usamos el IVA configurado en el producto
          precioFinal = precioBaseSinIva * (1 + detalle.producto.iva / 100);
        } else {
          // Para otros tipos de comprobante (como Nota de Crédito C), usamos el precio con IVA 21%
          precioFinal = precioBaseSinIva * 1.21;
        }

        return {
          ...detalle,
          precioUnitario: precioFinal,
          subtotal: precioFinal * detalle.cantidad,
        };
      });

      setDetalles(nuevosDetalles);
    }
  }, [listaPrecio, tipoIvaRemito, tipoComprobante]);

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

  const handleCantidadChange = (index: number, value: string) => {
    const cantidad = value === "" ? 0 : parseInt(value);
    if (isNaN(cantidad)) return;

    const newDetalles = [...detalles];
    newDetalles[index] = {
      ...newDetalles[index],
      cantidad,
      subtotal: newDetalles[index].precioUnitario * cantidad,
    };
    setDetalles(newDetalles);
  };

  const subtotal = detalles.reduce((sum, detalle) => sum + detalle.subtotal, 0);
  const descuentoValor =
    subtotal * (descuento === "" ? 0 : parseFloat(descuento) / 100);
  const total = subtotal - descuentoValor;

  const handleDescuentoChange = (value: string) => {
    // Si está vacío, mantenerlo vacío (internamente se tratará como 0)
    if (value === "") {
      setDescuento("");
      return;
    }

    // Remover ceros iniciales (excepto para "0" y "0.")
    if (value.length > 1 && value.startsWith("0") && !value.startsWith("0.")) {
      value = value.replace(/^0+/, "");
    }

    const descuentoPorcentaje = parseFloat(value);

    // Validar que sea un número entre 0 y 100
    if (
      isNaN(descuentoPorcentaje) ||
      descuentoPorcentaje < 0 ||
      descuentoPorcentaje > 100
    ) {
      return;
    }

    setDescuento(value);
  };

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

    // Convertir descuento a número para enviarlo a la API
    const descuentoNum = descuento === "" ? 0 : parseFloat(descuento);

    console.log("Datos a enviar:", {
      clienteId,
      tipoComprobante,
      vendedorId: user?.id,
      aumentaStock,
      descuento: descuentoNum,
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
        aumentaStock,
        descuento: descuentoNum,
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

  const handleTipoComprobanteChange = (value: string) => {
    setTipoComprobante(value);
    // Detectar si es un tipo de comprobante que aumenta stock
    const esComprobanteAumentaStock =
      value === "NOTA_CREDITO_A" || value === "NOTA_CREDITO_REMITO";
    setAumentaStock(esComprobanteAumentaStock);

    // Resetear el tipo de IVA si se cambia el tipo de comprobante
    if (value !== "REMITO" && value !== "NOTA_CREDITO_REMITO") {
      setTipoIvaRemito("sin_iva");
    }
  };

  const handleProductSelect = (producto: Producto) => {
    let precioFinal;

    // Calculamos el precio base sin IVA usando el precio de costo y el margen
    const margen =
      listaPrecio === "1" ? producto.margenGanancia1 : producto.margenGanancia2;

    // Precio base sin IVA = Precio de costo * (1 + margen/100)
    const precioBaseSinIva = producto.precioCosto * (1 + margen / 100);

    if (
      tipoComprobante === "REMITO" ||
      tipoComprobante === "NOTA_CREDITO_REMITO"
    ) {
      if (tipoIvaRemito === "sin_iva") {
        // Para "Sin IVA", usamos el precio base sin IVA
        precioFinal = precioBaseSinIva;
      } else if (tipoIvaRemito === "iva_10_5") {
        // Para "Con IVA 10,5%", aplicamos 10.5% de IVA al precio base sin IVA
        precioFinal = precioBaseSinIva * 1.105;
      } else {
        // Para "Con IVA 21%", aplicamos 21% de IVA al precio base sin IVA
        precioFinal = precioBaseSinIva * 1.21;
      }
    } else if (
      tipoComprobante === "FACTURA_A" ||
      tipoComprobante === "NOTA_CREDITO_A"
    ) {
      // Para Factura A y Nota de Crédito A, usamos el IVA configurado en el producto
      precioFinal = precioBaseSinIva * (1 + producto.iva / 100);
    } else {
      // Para otros tipos de comprobante (como Nota de Crédito C), usamos el precio con IVA 21%
      precioFinal = precioBaseSinIva * 1.21;
    }

    setDetalles([
      ...detalles,
      {
        productoId: producto.id,
        producto,
        cantidad: 1,
        precioUnitario: precioFinal,
        subtotal: precioFinal,
      },
    ]);
  };

  const handleClienteChange = (id: string) => {
    setClienteId(id);
    const cliente = clientes.find((c) => c.id.toString() === id);
    setClienteSeleccionado(cliente || null);
    // Resetear el tipo de comprobante cuando cambia el cliente
    setTipoComprobante("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-cyan-gradient">
            {aumentaStock ? "Nueva Nota de Crédito" : "Nueva Factura"}
          </DialogTitle>
          {aumentaStock && (
            <p className="text-sm text-muted-foreground mt-1">
              Esta operación aumentará el stock de los productos seleccionados.
            </p>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Cliente</label>
              <Select
                value={clienteId}
                onValueChange={handleClienteChange}
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
                onValueChange={handleTipoComprobanteChange}
                disabled={isLoading || !clienteId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FACTURA_A">Factura A</SelectItem>
                  <SelectItem value="REMITO">Remito</SelectItem>
                  {/* <SelectItem value="NOTA_CREDITO_C">
                    Nota de Crédito C
                  </SelectItem> */}
                  <SelectItem value="NOTA_CREDITO_A">
                    Nota de Crédito A (+ Stock)
                  </SelectItem>
                  <SelectItem value="NOTA_CREDITO_REMITO">
                    Nota de Crédito Remito (+ Stock)
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

            <div className="space-y-2">
              <label className="text-sm font-medium">Descuento (%)</label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={descuento}
                onChange={(e) => handleDescuentoChange(e.target.value)}
                className="w-full"
                disabled={isLoading}
                placeholder="0"
              />
            </div>

            {(tipoComprobante === "REMITO" ||
              tipoComprobante === "NOTA_CREDITO_REMITO") && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Tipo de IVA para{" "}
                  {tipoComprobante === "REMITO"
                    ? "Remito"
                    : "Nota de Crédito Remito"}
                </label>
                <Select
                  value={tipoIvaRemito}
                  onValueChange={(value: "sin_iva" | "iva_10_5" | "iva_21") =>
                    setTipoIvaRemito(value)
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione tipo de IVA" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sin_iva">Sin IVA</SelectItem>
                    <SelectItem value="iva_10_5">Con IVA 10,5%</SelectItem>
                    <SelectItem value="iva_21">Con IVA 21%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {aumentaStock && (
              <div className="md:col-span-3 bg-blue-50 p-3 rounded-md border border-blue-200 mt-2">
                <p className="text-blue-700 text-sm flex items-center">
                  <Info className="mr-2 h-4 w-4" />
                  Este tipo de comprobante&nbsp;
                  <span className="font-bold">aumentará</span>&nbsp;el stock de
                  los productos seleccionados.
                </p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Productos</h3>
              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  onClick={handleAddProducto}
                  disabled={isLoading}
                  className="bg-cyan-gradient"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Producto
                </Button>
              </div>
            </div>

            <div className="border rounded-md">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-2">Producto</th>
                    <th className="text-center p-2">Cantidad</th>
                    <th className="text-right p-2">Precio</th>
                    <th className="text-right p-2">Subtotal</th>
                    <th className="p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {detalles.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="text-center py-4 text-muted-foreground"
                      >
                        No hay productos agregados
                      </td>
                    </tr>
                  ) : (
                    detalles.map((detalle, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-2">
                          {detalle.producto.codigo} -{" "}
                          {detalle.producto.descripcion}
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            min="1"
                            max={detalle.producto.stock}
                            value={detalle.cantidad}
                            onChange={(e) =>
                              handleCantidadChange(index, e.target.value)
                            }
                            className="w-20 mx-auto text-center"
                            disabled={isLoading}
                          />
                        </td>
                        <td className="p-2 text-right">
                          {formatCurrency(detalle.precioUnitario)}
                        </td>
                        <td className="p-2 text-right">
                          {formatCurrency(detalle.subtotal)}
                        </td>
                        <td className="p-2 text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveProducto(index)}
                            disabled={isLoading}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr className="border-t">
                    <td colSpan={3} className="p-2 text-right font-semibold">
                      Subtotal:
                    </td>
                    <td className="p-2 text-right font-semibold">
                      {formatCurrency(subtotal)}
                    </td>
                    <td></td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="p-2 text-right font-semibold">
                      Descuento ({descuento || "0"}%):
                    </td>
                    <td className="p-2 text-right font-semibold">
                      {formatCurrency(descuentoValor)}
                    </td>
                    <td></td>
                  </tr>
                  <tr className="border-t">
                    <td colSpan={3} className="p-2 text-right font-semibold">
                      Total Final:
                    </td>
                    <td className="p-2 text-right font-semibold text-lg text-cyan-600">
                      {formatCurrency(total)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-cyan-gradient"
              disabled={isLoading || detalles.length === 0}
            >
              {isLoading
                ? "Guardando..."
                : aumentaStock
                ? "Guardar Nota de Crédito"
                : "Guardar Factura"}
            </Button>
          </div>
        </form>

        <ProductSearchDialog
          open={isProductSearchOpen}
          onOpenChange={setIsProductSearchOpen}
          onProductSelect={handleProductSelect}
          listaPrecio={listaPrecio}
          productosAgregados={detalles.map((detalle) => detalle.productoId)}
        />
      </DialogContent>
    </Dialog>
  );
}
