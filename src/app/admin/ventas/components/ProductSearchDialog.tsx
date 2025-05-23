import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";
import { Checkbox } from "@/components/ui/checkbox";

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
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [soloConStock, setSoloConStock] = useState(true);
  const productsPerPage = 10;

  useEffect(() => {
    if (open) {
      fetchProductos();
      setCurrentPage(1); // Reiniciar a la primera página cuando se abre el diálogo
    }
  }, [open]);

  useEffect(() => {
    // Solo aplicar filtros si hay productos cargados
    if (productos.length > 0) {
      console.log(
        `Filtrando ${productos.length} productos con término: "${searchTerm}"`
      );

      // Contar productos con stock
      const conStock = productos.filter((p) => p.stock > 0).length;
      console.log(`Del total de productos, ${conStock} tienen stock > 0`);

      const filtered = productos.filter(
        (producto) =>
          // Filtrar por término de búsqueda
          (producto.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            producto.descripcion
              ?.toLowerCase()
              .includes(searchTerm.toLowerCase())) &&
          // Solo mostrar productos con stock si la opción está activada
          (!soloConStock || producto.stock > 0) &&
          // Excluir productos ya agregados a la factura
          !productosAgregados.includes(producto.id)
      );

      console.log(`Productos filtrados: ${filtered.length}`);
      setFilteredProductos(filtered);
      setCurrentPage(1); // Volver a la página 1 cuando cambia el filtro
    }
  }, [searchTerm, productos, productosAgregados, soloConStock]);

  const fetchProductos = async () => {
    setIsLoading(true);
    setError("");

    try {
      console.log("Iniciando solicitud de productos a la API...");

      // Agregar un timestamp para evitar el caché
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/productos?nocache=${timestamp}`, {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      });

      console.log(
        `Respuesta recibida: ${response.status} ${response.statusText}`
      );

      if (!response.ok) {
        throw new Error(
          `Error al cargar productos: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log(`Datos recibidos: ${data.length} productos`);

      if (!Array.isArray(data)) {
        throw new Error("La respuesta no contiene un array de productos");
      }

      // Validar que los productos tengan la estructura esperada
      const productosValidos = data.map((prod: any) => ({
        id: prod.id,
        codigo: prod.codigo || `PROD-${prod.id}`,
        descripcion: prod.descripcion || "Sin descripción",
        precioCosto: Number(prod.precioCosto) || 0,
        iva: Number(prod.iva) || 21,
        margenGanancia1: Number(prod.margenGanancia1) || 0,
        margenGanancia2: Number(prod.margenGanancia2) || 0,
        precioFinal1: Number(prod.precioFinal1) || 0,
        precioFinal2: Number(prod.precioFinal2) || 0,
        stock: Number(prod.stock) || 0,
      }));

      // Mostrar resumen de stock
      const conStock = productosValidos.filter((p) => p.stock > 0).length;
      const sinStock = productosValidos.filter((p) => p.stock === 0).length;
      console.log(
        `Resumen de productos: ${conStock} con stock, ${sinStock} sin stock`
      );

      setProductos(productosValidos);

      const filtrados = productosValidos.filter(
        (producto: Producto) => !productosAgregados.includes(producto.id)
      );

      console.log(`Productos disponibles (no agregados): ${filtrados.length}`);
      setFilteredProductos(filtrados);
    } catch (error: any) {
      console.error("Error al cargar productos:", error);
      setError(`Error: ${error.message || "Error desconocido"}`);
      // Mantener la lista anterior en caso de error
    } finally {
      setIsLoading(false);
    }
  };

  const handleProductSelect = (producto: Producto) => {
    onProductSelect(producto);
    onOpenChange(false);
    setSearchTerm("");
  };

  // Cálculo de paginación
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProductos.slice(
    indexOfFirstProduct,
    indexOfLastProduct
  );

  const totalPages = Math.ceil(filteredProductos.length / productsPerPage);

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  // Función para recargar los productos
  const handleReloadProducts = () => {
    fetchProductos();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] sm:max-h-[80vh] w-[95vw] sm:w-auto p-3 sm:p-6 flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl font-bold text-cyan-gradient text-center">
            Buscar Producto
          </DialogTitle>
        </DialogHeader>

        <div className="relative mb-3">
          <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por código o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
            autoFocus
          />
        </div>

        {/* Controles - Reorganizados para móvil */}
        <div className="flex flex-col sm:flex-row sm:justify-between gap-2 sm:items-center mb-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="soloConStock"
              checked={soloConStock}
              onCheckedChange={(checked) => setSoloConStock(checked === true)}
            />
            <label htmlFor="soloConStock" className="text-sm font-medium">
              Solo productos con stock
            </label>
          </div>

          <div className="flex justify-between sm:justify-end items-center w-full sm:w-auto gap-2">
            <div className="text-xs sm:text-sm">
              {filteredProductos.length > 0
                ? `${filteredProductos.length} productos`
                : isLoading
                ? "Cargando..."
                : "No hay productos"}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReloadProducts}
              disabled={isLoading}
              className="px-2 py-1 h-8 text-xs sm:text-sm"
            >
              Recargar
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 text-red-800 p-2 rounded text-sm mb-3">
            {error}
          </div>
        )}

        {productos.length > 0 &&
          productos.filter((p) => p.stock > 0).length === 0 &&
          !soloConStock && (
            <div className="bg-yellow-100 text-yellow-800 p-2 rounded text-xs sm:text-sm mb-3">
              Aviso: Todos los productos tienen stock 0. Se muestran de todas
              formas.
            </div>
          )}

        {/* Contenedor para tabla y paginación con flex-grow para que ocupe el espacio disponible */}
        <div className="flex flex-col flex-grow min-h-0">
          {/* Tabla adaptada para móvil con scroll horizontal habilitado */}
          <div className="overflow-y-auto overflow-x-auto flex-grow border rounded-md relative">
            <div className="min-w-[600px]">
              {" "}
              {/* Ancho mínimo para evitar que se comprima demasiado en móviles */}
              <table className="w-full">
                <thead className="sticky top-0 bg-background z-10 shadow-sm">
                  <tr className="border-b">
                    <th className="text-left py-2 px-1 sm:px-2 text-xs sm:text-sm w-[20%]">
                      Código
                    </th>
                    <th className="text-left py-2 px-1 sm:px-2 text-xs sm:text-sm w-[40%]">
                      Descripción
                    </th>
                    <th className="text-right py-2 px-1 sm:px-2 text-xs sm:text-sm w-[15%]">
                      Precio
                    </th>
                    <th className="text-center py-2 px-1 sm:px-2 text-xs sm:text-sm w-[10%]">
                      Stock
                    </th>
                    <th className="text-right py-2 px-1 sm:px-2 text-xs sm:text-sm w-[15%]">
                      Acción
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-sm">
                        Cargando productos...
                      </td>
                    </tr>
                  ) : currentProducts.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-4 text-center text-muted-foreground text-sm"
                      >
                        No se encontraron productos disponibles
                      </td>
                    </tr>
                  ) : (
                    currentProducts.map((producto) => (
                      <tr
                        key={producto.id}
                        className={`border-b hover:bg-muted/50 transition-colors cursor-pointer ${
                          producto.stock <= 0 ? "bg-orange-50" : ""
                        }`}
                        onClick={() => handleProductSelect(producto)}
                      >
                        <td className="py-1 sm:py-2 px-1 sm:px-2 text-xs sm:text-sm">
                          {producto.codigo}
                        </td>
                        <td className="py-1 sm:py-2 px-1 sm:px-2 text-xs sm:text-sm">
                          {producto.descripcion}
                        </td>
                        <td className="py-1 sm:py-2 px-1 sm:px-2 text-right text-xs sm:text-sm">
                          {formatCurrency(
                            listaPrecio === "1"
                              ? producto.precioFinal1
                              : producto.precioFinal2
                          )}
                        </td>
                        <td
                          className={`py-1 sm:py-2 px-1 sm:px-2 text-center text-xs sm:text-sm ${
                            producto.stock <= 0 ? "text-red-500 font-bold" : ""
                          }`}
                        >
                          {producto.stock}
                        </td>
                        <td className="py-1 sm:py-2 px-1 sm:px-2 text-right hidden sm:table-cell">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleProductSelect(producto);
                            }}
                            className="bg-cyan-gradient text-white hover:text-white px-1 sm:px-3 py-0 h-7 text-xs sm:text-sm whitespace-nowrap"
                          >
                            Elegir
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mensaje indicativo de scroll horizontal */}
          <div className="text-xs text-center text-muted-foreground py-1 sm:hidden">
            ← Desliza horizontalmente para ver más →
          </div>

          {/* Controles de paginación - Adaptados para móvil y dentro del contenedor flex */}
          {filteredProductos.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-3 mt-0 gap-2">
              <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                Mostrando {indexOfFirstProduct + 1}-
                {Math.min(indexOfLastProduct, filteredProductos.length)} de{" "}
                {filteredProductos.length}
              </div>

              <div className="flex items-center justify-center sm:justify-end space-x-1 sm:space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  aria-label="Página anterior"
                  className="px-2 py-0 h-7"
                >
                  <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>

                <span className="text-xs sm:text-sm">
                  {currentPage} / {totalPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  aria-label="Página siguiente"
                  className="px-2 py-0 h-7"
                >
                  <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
