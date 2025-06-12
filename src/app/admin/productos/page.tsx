"use client";

import { AppSidebar } from "@/components/admin/app-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Filter,
  List,
  Plus,
  X,
  FolderPlus,
  Truck,
  Search,
  Share,
  Link,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useUrlParams } from "@/hooks/useUrlParams";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Product } from "@/types/product";
import { SortDialog } from "@/components/admin/productos/SortDialog";
import { FilterDialog } from "@/components/admin/productos/FilterDialog";
import { cn } from "@/lib/utils";
import { Suspense } from "react";
import { ProductTableSkeleton } from "@/components/admin/productos/ProductTableSkeleton";
import { ProductCard } from "@/components/admin/productos/ProductCard";
import { ProductsGridSkeleton } from "@/components/admin/productos/ProductsGridSkeleton";
import { ProductDialog, ProductForm } from "./components/ProductDialog";
import { RubroListDialog } from "./components/RubroListDialog";
import { ProveedorDialog } from "./components/ProveedorDialog";

interface ProductsResponse {
  productos: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

function ProductosContent() {
  const { setUrlParam, getUrlParam } = useUrlParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("creadoEn");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filterRubro, setFilterRubro] = useState("all");
  const [filterProveedor, setFilterProveedor] = useState("all");

  const activeUrl = "/admin/productos";
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [savedFields, setSavedFields] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<number | null>(null);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [isSortDialogOpen, setIsSortDialogOpen] = useState(false);
  const [isClearingFilters, setIsClearingFilters] = useState(false);
  const [isRubroDialogOpen, setIsRubroDialogOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const productsPerPage = 20;

  useEffect(() => {
    if (isClearingFilters) {
      setIsClearingFilters(false);
      return;
    }

    const urlSort = getUrlParam("sort");
    const urlOrder = getUrlParam("order");
    const urlRubro = getUrlParam("rubro");
    const urlProveedor = getUrlParam("proveedor");
    const urlSearch = getUrlParam("search");
    const urlPage = getUrlParam("page");

    if (urlSort) {
      setSortField(urlSort);
    } else {
      setSortField("creadoEn");
    }

    if (urlOrder) {
      setSortOrder(urlOrder as "asc" | "desc");
    } else {
      setSortOrder("desc");
    }

    if (urlRubro) {
      setFilterRubro(urlRubro);
    } else {
      setFilterRubro("all");
    }

    if (urlProveedor) {
      setFilterProveedor(urlProveedor);
    } else {
      setFilterProveedor("all");
    }

    if (urlSearch) {
      setSearchTerm(urlSearch);
    } else {
      setSearchTerm("");
    }

    if (urlPage) {
      setCurrentPage(parseInt(urlPage, 10));
    } else {
      setCurrentPage(1);
    }
  }, [searchParams, getUrlParam]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    setUrlParam("page", newPage === 1 ? null : newPage.toString());
  };

  useEffect(() => {
    const fetchProductos = async () => {
      setLoading(true);
      try {
        // Construir parámetros de búsqueda
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: productsPerPage.toString(),
        });

        if (searchTerm) params.append("search", searchTerm);
        if (filterRubro !== "all") params.append("rubro", filterRubro);
        if (filterProveedor !== "all")
          params.append("proveedor", filterProveedor);
        if (sortField) params.append("sort", sortField);
        if (sortOrder) params.append("order", sortOrder);

        const response = await fetch(`/api/productos?${params.toString()}`);
        const data: ProductsResponse = await response.json();

        console.log("Products from API:", data);

        // La API devuelve productos paginados
        if (data.productos && data.pagination) {
          const transformedProducts: Product[] = data.productos.map(
            (p: any) => ({
              id: p.id,
              codigo: p.codigo || "",
              codigoProveedor: p.codigoProveedor || "",
              codigoBarras: p.codigoBarras || null,
              rubro: p.rubro || "",
              descripcion: p.descripcion || "",
              proveedor: p.proveedor || "",
              precioCosto: p.precioCosto || 0,
              iva: p.iva || 21,
              margenGanancia1: p.margenGanancia1 || 0,
              precioFinal1: p.precioFinal1 || 0,
              margenGanancia2: p.margenGanancia2 || 0,
              precioFinal2: p.precioFinal2 || 0,
              imagenUrl: p.imagenUrl || "",
              stock: p.stock || 0,
              creadoEn: new Date(p.creadoEn),
            })
          );
          setProductsList(transformedProducts);
          setPagination(data.pagination);
        } else {
          // Fallback para API que devuelve todos los productos
          const transformedProducts: Product[] = (data as unknown as any[]).map(
            (p: any) => ({
              id: p.id,
              codigo: p.codigo || "",
              codigoProveedor: p.codigoProveedor || "",
              codigoBarras: p.codigoBarras || null,
              rubro: p.rubro || "",
              descripcion: p.descripcion || "",
              proveedor: p.proveedor || "",
              precioCosto: p.precioCosto || 0,
              iva: p.iva || 21,
              margenGanancia1: p.margenGanancia1 || 0,
              precioFinal1: p.precioFinal1 || 0,
              margenGanancia2: p.margenGanancia2 || 0,
              precioFinal2: p.precioFinal2 || 0,
              imagenUrl: p.imagenUrl || "",
              stock: p.stock || 0,
              creadoEn: new Date(p.creadoEn),
            })
          );
          setProductsList(transformedProducts);
          setPagination({
            page: 1,
            limit: transformedProducts.length,
            total: transformedProducts.length,
            pages: 1,
            hasNext: false,
            hasPrev: false,
          });
        }
      } catch (error) {
        console.error("Error al cargar productos:", error);
        toast.error("Error al cargar productos");
      } finally {
        setLoading(false);
      }
    };
    fetchProductos();
  }, [
    currentPage,
    searchTerm,
    filterRubro,
    filterProveedor,
    sortField,
    sortOrder,
  ]);

  const handleAddProduct = async (data: ProductForm) => {
    try {
      const response = await fetch("/api/productos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Error al crear producto");

      const productoCreado = await response.json();

      // Transformar el producto creado para mantener consistencia con la lista
      const productoTransformado: Product = {
        id: productoCreado.id,
        codigo: productoCreado.codigo || "",
        codigoProveedor: productoCreado.codigoProveedor || "",
        codigoBarras: productoCreado.codigoBarras || null,
        rubro: productoCreado.rubro || "",
        descripcion: productoCreado.descripcion || "",
        proveedor: productoCreado.proveedor || "",
        precioCosto: productoCreado.precioCosto || 0,
        iva: productoCreado.iva || 21,
        margenGanancia1: productoCreado.margenGanancia1 || 0,
        precioFinal1: productoCreado.precioFinal1 || 0,
        margenGanancia2: productoCreado.margenGanancia2 || 0,
        precioFinal2: productoCreado.precioFinal2 || 0,
        imagenUrl: productoCreado.imagenUrl || "",
        stock: productoCreado.stock || 0,
        creadoEn: new Date(productoCreado.creadoEn),
      };

      // Recargar la lista para mantener consistencia con la paginación
      toast.success("Producto creado exitosamente");
      setIsDialogOpen(false);

      // Recargar datos para mantener paginación correcta
      window.location.reload();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al crear el producto");
    }
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;

    try {
      const response = await fetch(`/api/productos/${productToDelete}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Error al eliminar producto");

      setProductsList(productsList.filter((p) => p.id !== productToDelete));
      toast.success("Producto eliminado exitosamente");
      setDeleteDialogOpen(false);
      setProductToDelete(null);

      // Recargar datos para mantener paginación correcta
      window.location.reload();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al eliminar el producto");
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setUrlParam("search", value || null);
    setCurrentPage(1);
    setUrlParam("page", null); // Reset page when searching
  };

  const handleSort = (field: string) => {
    const newOrder =
      field === sortField && sortOrder === "asc" ? "desc" : "asc";

    setSortField(field);
    setSortOrder(newOrder);

    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set("sort", field);
    params.set("order", newOrder);

    const newUrl = `${pathname}?${params.toString()}`;
    router.push(newUrl);

    setCurrentPage(1);
    setUrlParam("page", null); // Reset page when sorting
  };

  const handleClearFilters = () => {
    setIsClearingFilters(true);
    setSearchTerm("");
    setFilterRubro("all");
    setFilterProveedor("all");
    setSortField("creadoEn");
    setSortOrder("desc");
    setCurrentPage(1);
    router.push(pathname || "/");
  };

  return (
    <>
      <header className="flex h-12 md:h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-2 md:px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-1 md:mr-2 h-4" />
          <h2 className="text-3xl font-bold tracking-tight text-cyan-gradient">
            Productos
          </h2>
          <Button
            variant="outline"
            size="sm"
            className="ml-auto mr-4 bg-cyan-gradient text-white hover:text-white shadow-md"
            onClick={() => {
              const catalogoUrl = `${window.location.origin}/catalogo`;
              if (navigator.share) {
                navigator
                  .share({
                    title: "Catálogo de Productos",
                    url: catalogoUrl,
                  })
                  .catch((error) =>
                    toast.error("Error al compartir: " + error)
                  );
              } else {
                navigator.clipboard.writeText(catalogoUrl);
                toast.success("Enlace copiado al portapapeles");
              }
            }}
          >
            Compartir catálogo
            <Link className=" h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="h-full flex-1 flex-col space-y-4 md:space-y-8 p-4 md:p-8 flex max-w-[100vw]">
        <div className="space-y-4 w-full">
          <div className="flex justify-between items-center">
            <p className="text-muted-foreground">
              {pagination.total} productos total
              {pagination.total > 0 && (
                <span className="ml-2">
                  (Mostrando {(pagination.page - 1) * pagination.limit + 1} a{" "}
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total
                  )}
                  )
                </span>
              )}
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex md:flex-row flex-col w-full items-center gap-2">
              <div className="relative flex-grow w-full">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, código, código de proveedor o código de barras..."
                  className="pl-8 w-full shadow-md"
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 w-full ">
                {(searchTerm ||
                  filterRubro !== "all" ||
                  filterProveedor !== "all" ||
                  sortField !== "creadoEn") && (
                  <Button
                    variant="ghost"
                    onClick={handleClearFilters}
                    className="h-8 px-2 lg:px-3 text-xs md:text-sm shadow-md"
                  >
                    Limpiar
                    <X className="ml-1 md:ml-2 h-3 w-3 md:h-4 md:w-4" />
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFilterDialogOpen(true)}
                  className="text-xs md:text-sm shadow-md"
                >
                  <Filter className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
                  Filtrar
                  {filterRubro !== "all" && (
                    <span className="ml-1 md:ml-2">{filterRubro}</span>
                  )}
                  {filterProveedor !== "all" && (
                    <span className="ml-1 md:ml-2">{filterProveedor}</span>
                  )}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSortDialogOpen(true)}
                  className="text-xs md:text-sm shadow-md"
                >
                  <List className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
                  Ordenar
                </Button>
              </div>
            </div>

            <div className="flex gap-2 justify-start md:justify-end  w-full">
              <Button
                onClick={() => setIsRubroDialogOpen(true)}
                className="bg-cyan-gradient shadow-md"
              >
                <FolderPlus className="h-4 w-4 mr-2" />
                Rubros
              </Button>
              <Button
                onClick={() => setIsDialogOpen(true)}
                className="bg-cyan-gradient shadow-md"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar producto
              </Button>
            </div>
          </div>
          <div className=" max-w-[100vw]">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {loading ? (
                <ProductsGridSkeleton />
              ) : productsList.length === 0 ? (
                <div className="col-span-full text-center py-8">
                  <p className="text-muted-foreground">
                    {searchTerm
                      ? "No se encontraron productos con ese criterio"
                      : "No hay productos registrados"}
                  </p>
                </div>
              ) : (
                productsList.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onViewDetails={(id) =>
                      router.push(`/admin/productos/${id}`)
                    }
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Paginación */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-center space-x-1 mt-8">
            {/* Botón flecha izquierda (anterior) */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={!pagination.hasPrev}
              className="px-2"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* Primera página (siempre visible si no es la página 1) */}
            {pagination.page > 1 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(1)}
                  className="px-3"
                >
                  1
                </Button>
                {pagination.page > 3 && (
                  <span className="px-2 text-muted-foreground">...</span>
                )}
              </>
            )}

            {/* Páginas alrededor de la actual */}
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(3, pagination.pages) }, (_, i) => {
                let pageNum;
                if (pagination.pages <= 3) {
                  pageNum = i + 1;
                } else if (pagination.page === 1) {
                  pageNum = i + 1;
                } else if (pagination.page === pagination.pages) {
                  pageNum = pagination.pages - 2 + i;
                } else {
                  pageNum = pagination.page - 1 + i;
                }

                // No mostrar si es la primera página (ya se muestra arriba)
                if (pageNum === 1 && pagination.page > 1) return null;
                // No mostrar si es la última página (se muestra abajo)
                if (
                  pageNum === pagination.pages &&
                  pagination.page < pagination.pages
                )
                  return null;

                return (
                  <Button
                    key={pageNum}
                    variant={
                      pageNum === pagination.page ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 ${
                      pageNum === pagination.page ? "bg-cyan-gradient" : ""
                    }`}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            {/* Última página (siempre visible si no es la página actual) */}
            {pagination.page < pagination.pages && (
              <>
                {pagination.page < pagination.pages - 2 && (
                  <span className="px-2 text-muted-foreground">...</span>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.pages)}
                  className="px-3"
                >
                  {pagination.pages}
                </Button>
              </>
            )}

            {/* Botón flecha derecha (siguiente) */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={!pagination.hasNext}
              className="px-2"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <ProductDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={handleAddProduct}
        mode="create"
      />

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Producto</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. El producto se eliminará
              permanentemente.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p>¿Estás seguro de que deseas eliminar este producto?</p>
          </div>
          <DialogFooter className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setProductToDelete(null);
              }}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteProduct}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SortDialog
        isOpen={isSortDialogOpen}
        onClose={() => setIsSortDialogOpen(false)}
        sortField={sortField}
        sortOrder={sortOrder}
        onSort={handleSort}
      />

      <FilterDialog
        isOpen={isFilterDialogOpen}
        onClose={() => setIsFilterDialogOpen(false)}
        filterRubro={filterRubro}
        filterProveedor={filterProveedor}
        onFilterChange={(type, value) => {
          if (type === "rubro") {
            setFilterRubro(value);
            setUrlParam("rubro", value === "all" ? null : value);
          } else if (type === "proveedor") {
            setFilterProveedor(value);
            setUrlParam("proveedor", value === "all" ? null : value);
          }
          setCurrentPage(1);
          setUrlParam("page", null); // Reset page when filtering
        }}
      />

      <RubroListDialog
        open={isRubroDialogOpen}
        onOpenChange={setIsRubroDialogOpen}
      />
    </>
  );
}

export default function ProductosPage() {
  return (
    <SidebarProvider>
      <AppSidebar activeUrl="/admin/productos" />
      <SidebarInset>
        <Suspense fallback={<ProductTableSkeleton />}>
          <ProductosContent />
        </Suspense>
      </SidebarInset>
    </SidebarProvider>
  );
}
