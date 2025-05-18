import type { Product } from "@/types/product";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { ImageUpload } from "@/components/ui/image-upload";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface ProductForm {
  codigo: string;
  codigoProveedor: string;
  codigoBarras: string;
  rubro: string;
  descripcion: string;
  proveedor: string;
  precioCosto: number | "";
  iva: number;
  margenGanancia1: number | "";
  precioFinal1: number | "";
  margenGanancia2: number | "";
  precioFinal2: number | "";
  imagenUrl?: string;
  stock: number | "";
}

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ProductForm) => Promise<void>;
  initialData?: Product | null;
  mode: "create" | "edit";
}

export function ProductDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  mode,
}: ProductDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<ProductForm>(() => ({
    codigo: initialData?.codigo?.toString() || "",
    codigoProveedor: initialData?.codigoProveedor?.toString() || "",
    codigoBarras: initialData?.codigoBarras?.toString() || "",
    rubro: initialData?.rubro?.toString() || "",
    descripcion: initialData?.descripcion?.toString() || "",
    proveedor: initialData?.proveedor?.toString() || "",
    precioCosto:
      typeof initialData?.precioCosto === "number"
        ? initialData.precioCosto
        : "",
    iva: Number(initialData?.iva) || 21,
    margenGanancia1:
      typeof initialData?.margenGanancia1 === "number"
        ? initialData.margenGanancia1
        : "",
    precioFinal1:
      typeof initialData?.precioFinal1 === "number"
        ? initialData.precioFinal1
        : "",
    margenGanancia2:
      typeof initialData?.margenGanancia2 === "number"
        ? initialData.margenGanancia2
        : "",
    precioFinal2:
      typeof initialData?.precioFinal2 === "number"
        ? initialData.precioFinal2
        : "",
    imagenUrl: initialData?.imagenUrl?.toString() || undefined,
    stock: typeof initialData?.stock === "number" ? initialData.stock : "",
  }));

  const [rubros, setRubros] = useState<{ id: number; nombre: string }[]>([]);
  const [proveedores, setProveedores] = useState<
    { id: number; nombre: string }[]
  >([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch rubros
        const rubrosResponse = await fetch("/api/rubros");
        const rubrosData = await rubrosResponse.json();
        setRubros(rubrosData);

        // Fetch proveedores
        const proveedoresResponse = await fetch("/api/proveedores");
        const proveedoresData = await proveedoresResponse.json();
        setProveedores(proveedoresData);
      } catch (error) {
        console.error("Error al cargar datos:", error);
        toast.error("Error al cargar los datos");
      }
    };

    fetchData();
  }, [open]); // Recargar cuando se abre el diálogo

  useEffect(() => {
    if (initialData && mode === "edit") {
      setFormData({
        codigo: initialData.codigo.toString(),
        codigoProveedor: initialData.codigoProveedor.toString(),
        codigoBarras: initialData.codigoBarras?.toString() || "",
        rubro: initialData.rubro.toString(),
        descripcion: initialData.descripcion.toString(),
        proveedor: initialData.proveedor.toString(),
        precioCosto: Number(initialData.precioCosto),
        iva: Number(initialData.iva),
        margenGanancia1: Number(initialData.margenGanancia1),
        precioFinal1: Number(initialData.precioFinal1),
        margenGanancia2: Number(initialData.margenGanancia2),
        precioFinal2: Number(initialData.precioFinal2),
        imagenUrl: initialData.imagenUrl?.toString(),
        stock: Number(initialData.stock),
      });
    }
  }, [initialData, mode]);

  const calculatePrecioFinal = (
    costo: number | "",
    margen: number | "",
    iva: number
  ) => {
    const costoNum = typeof costo === "number" ? costo : 0;
    const margenNum = typeof margen === "number" ? margen : 0;
    // Ya no aplicamos el IVA al precio final, solo el margen de ganancia
    return Number((costoNum * (1 + margenNum / 100)).toFixed(2));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    console.log("Datos del formulario:", formData); // Debug
    console.log("Estado de la imagen:", formData.imagenUrl); // Debug

    try {
      if (!formData.imagenUrl) {
        toast.error("Por favor, seleccione una imagen para el producto");
        setIsLoading(false);
        return;
      }

      // Solo validamos el formato base64 si es una imagen nueva
      if (
        formData.imagenUrl.startsWith("data:") &&
        !formData.imagenUrl.startsWith("data:image")
      ) {
        toast.error("Formato de imagen inválido");
        setIsLoading(false);
        return;
      }

      await onSubmit(formData);
      if (mode === "create") {
        setFormData({
          codigo: "",
          codigoProveedor: "",
          codigoBarras: "",
          rubro: "",
          descripcion: "",
          proveedor: "",
          precioCosto: 0,
          iva: 21,
          margenGanancia1: 0,
          precioFinal1: 0,
          margenGanancia2: 0,
          precioFinal2: 0,
          imagenUrl: "",
          stock: 0,
        });
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al procesar el producto");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-cyan-gradient">
            {mode === "create" ? "Nuevo Producto" : "Editar Producto"}
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Los precios finales se calculan ahora sin IVA. El porcentaje de IVA
            es informativo y se aplicará automáticamente durante la facturación.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Código</label>
              <Input
                required
                value={formData.codigo}
                onChange={(e) =>
                  setFormData({ ...formData, codigo: e.target.value })
                }
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Código Proveedor</label>
              <Input
                required
                value={formData.codigoProveedor}
                onChange={(e) =>
                  setFormData({ ...formData, codigoProveedor: e.target.value })
                }
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Código de Barras</label>
              <Input
                value={formData.codigoBarras}
                onChange={(e) =>
                  setFormData({ ...formData, codigoBarras: e.target.value })
                }
                disabled={isLoading}
                placeholder="Escanee o ingrese el código"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Rubro</label>
              <Select
                defaultValue={formData.rubro}
                value={formData.rubro}
                onValueChange={(value) => {
                  console.log("Rubro seleccionado:", value); // Para debug
                  setFormData({ ...formData, rubro: value });
                }}
                disabled={isLoading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccione un rubro" />
                </SelectTrigger>
                <SelectContent>
                  {rubros.map((rubro) => (
                    <SelectItem key={rubro.id} value={rubro.nombre}>
                      {rubro.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Proveedor</label>
              <Select
                value={formData.proveedor}
                onValueChange={(value) => {
                  console.log("Proveedor seleccionado:", value);
                  setFormData({ ...formData, proveedor: value });
                }}
                disabled={isLoading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccione un proveedor" />
                </SelectTrigger>
                <SelectContent>
                  {proveedores.map((proveedor) => (
                    <SelectItem key={proveedor.id} value={proveedor.nombre}>
                      {proveedor.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Descripción</label>
            <Input
              required
              value={formData.descripcion}
              onChange={(e) =>
                setFormData({ ...formData, descripcion: e.target.value })
              }
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Precio Costo</label>
              <Input
                type="number"
                step="0.01"
                required
                value={formData.precioCosto}
                onChange={(e) => {
                  const costo = parseFloat(e.target.value);
                  const newFormData = {
                    ...formData,
                    precioCosto: costo,
                  };

                  // Calcular precios finales solo con margen (sin IVA)
                  newFormData.precioFinal1 = calculatePrecioFinal(
                    costo,
                    newFormData.margenGanancia1,
                    newFormData.iva
                  );
                  newFormData.precioFinal2 = calculatePrecioFinal(
                    costo,
                    newFormData.margenGanancia2,
                    newFormData.iva
                  );
                  setFormData(newFormData);
                }}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">IVA % (informativo)</label>
              <Input
                type="number"
                step="0.1"
                required
                value={formData.iva}
                onChange={(e) => {
                  const iva = parseFloat(e.target.value);
                  setFormData({
                    ...formData,
                    iva: iva,
                    // Ya no recalculamos los precios finales cuando cambia el IVA
                    // porque el IVA ahora es solo informativo
                  });
                }}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Stock</label>
              <Input
                type="number"
                required
                value={formData.stock}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    stock: parseInt(e.target.value),
                  })
                }
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <h3 className="font-medium">Lista de Precio 1</h3>
              <div className="space-y-2">
                <label className="text-sm font-medium">Margen %</label>
                <Input
                  type="number"
                  step="0.1"
                  required
                  value={formData.margenGanancia1}
                  onChange={(e) => {
                    const margen = parseFloat(e.target.value);
                    setFormData({
                      ...formData,
                      margenGanancia1: margen,
                      precioFinal1: calculatePrecioFinal(
                        formData.precioCosto,
                        margen,
                        formData.iva
                      ),
                    });
                  }}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Precio Final (sin IVA)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.precioFinal1}
                  readOnly
                  disabled
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium">Lista de Precio 2</h3>
              <div className="space-y-2">
                <label className="text-sm font-medium">Margen %</label>
                <Input
                  type="number"
                  step="0.1"
                  required
                  value={formData.margenGanancia2}
                  onChange={(e) => {
                    const margen = parseFloat(e.target.value);
                    setFormData({
                      ...formData,
                      margenGanancia2: margen,
                      precioFinal2: calculatePrecioFinal(
                        formData.precioCosto,
                        margen,
                        formData.iva
                      ),
                    });
                  }}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Precio Final (sin IVA)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.precioFinal2}
                  readOnly
                  disabled
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Imagen</label>
            <ImageUpload
              onImageSelect={(base64: string) =>
                setFormData({ ...formData, imagenUrl: base64 })
              }
              currentImage={formData.imagenUrl}
            />
          </div>

          <div className="flex justify-end space-x-2">
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
              disabled={isLoading}
            >
              {isLoading
                ? mode === "create"
                  ? "Creando..."
                  : "Actualizando..."
                : mode === "create"
                ? "Crear Producto"
                : "Guardar Cambios"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
