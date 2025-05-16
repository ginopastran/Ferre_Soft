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
import { RubroDialog } from "./components/RubroDialog";
import { ProveedorDialog } from "./components/ProveedorDialog";

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

    setCurrentPage(1);
  }, [searchParams, getUrlParam]);

  useEffect(() => {
    const fetchProductos = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/productos");
        const data = await response.json();
        console.log("Products from API:", data);
        const transformedProducts: Product[] = data.map((p: any) => ({
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
        }));

        setProductsList(transformedProducts);
      } catch (error) {
        console.error("Error al cargar productos:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProductos();
  }, []);

  const handleAddProduct = async (data: ProductForm) => {
    try {
      const response = await fetch("/api/productos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Error al crear producto");

      const productoCreado = await response.json();
      setProductsList([productoCreado, ...productsList]);
      toast.success("Producto creado exitosamente");
      setIsDialogOpen(false);
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
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al eliminar el producto");
    }
  };

  const sortProducts = (products: Product[]) => {
    return [...products].sort((a, b) => {
      let aValue = a[sortField as keyof Product];
      let bValue = b[sortField as keyof Product];

      // Manejar fechas
      if (aValue instanceof Date) {
        return sortOrder === "asc"
          ? aValue.getTime() - (bValue as Date).getTime()
          : (bValue as Date).getTime() - aValue.getTime();
      }

      // Convertir a string o número para comparación
      aValue = (aValue as string | number) || "";
      bValue = (bValue as string | number) || "";

      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = (bValue as string).toLowerCase();
      }

      if (sortField === "precioCosto") {
        aValue = Number(aValue) || 0;
        bValue = Number(bValue) || 0;
      }

      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return sortOrder === "asc" ? comparison : -comparison;
    });
  };

  const filterProducts = (products: Product[]) => {
    return products.filter((product) => {
      const searchableFields = {
        descripcion: product.descripcion.toLowerCase(),
        codigo: product.codigo.toLowerCase(),
        codigoProveedor: product.codigoProveedor.toLowerCase(),
        codigoBarras: (product.codigoBarras || "").toLowerCase(),
      };

      const matchesSearch =
        !searchTerm ||
        Object.values(searchableFields).some((value) =>
          value.includes(searchTerm.toLowerCase())
        );

      const matchesRubro =
        filterRubro === "all" || product.rubro === filterRubro;

      const matchesProveedor =
        filterProveedor === "all" || product.proveedor === filterProveedor;

      return matchesSearch && matchesRubro && matchesProveedor;
    });
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setUrlParam("search", value || null);
    setCurrentPage(1);
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

  const sortedAndFiltered = sortProducts(filterProducts(productsList));

  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = sortedAndFiltered.slice(
    indexOfFirstProduct,
    indexOfLastProduct
  );

  const handleCreateRubro = async (data: { nombre: string }) => {
    try {
      const response = await fetch("/api/rubros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Error al crear rubro");
      toast.success("Rubro creado exitosamente");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al crear el rubro");
      throw error;
    }
  };

  return (
    <>
      <header className="flex h-12 md:h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-2 md:px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-1 md:mr-2 h-4" />
          <h2 className="text-3xl font-bold tracking-tight text-indigo-gradient">
            Productos
          </h2>
          <Button
            variant="outline"
            size="sm"
            className="ml-auto mr-4 bg-indigo-gradient text-white hover:text-white"
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
          <p className="text-muted-foreground">
            {productsList.length} productos
          </p>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex md:flex-row flex-col w-full items-center gap-2">
              <div className="relative flex-grow w-full">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, código, código de proveedor o código de barras..."
                  className="pl-8 w-full"
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
                    className="h-8 px-2 lg:px-3 text-xs md:text-sm"
                  >
                    Limpiar
                    <X className="ml-1 md:ml-2 h-3 w-3 md:h-4 md:w-4" />
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFilterDialogOpen(true)}
                  className="text-xs md:text-sm"
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
                  className="text-xs md:text-sm"
                >
                  <List className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
                  Ordenar
                </Button>
              </div>
            </div>

            <div className="flex gap-2 justify-start md:justify-end  w-full">
              <Button
                onClick={() => setIsRubroDialogOpen(true)}
                className="bg-indigo-gradient"
              >
                <FolderPlus className="h-4 w-4 mr-2" />
                Rubros
              </Button>
              <Button
                onClick={() => setIsDialogOpen(true)}
                className="bg-indigo-gradient"
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
              ) : (
                currentProducts.map((product) => (
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
        }}
      />

      <RubroDialog
        open={isRubroDialogOpen}
        onOpenChange={setIsRubroDialogOpen}
        onSubmit={handleCreateRubro}
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
