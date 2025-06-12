"use client";

import { AppSidebar } from "@/components/admin/app-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Search, PackageCheck, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Product } from "@/types/product";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import Image from "next/image";

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

function StockContent() {
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAdjustDialogOpen, setIsAdjustDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustmentQuantity, setAdjustmentQuantity] = useState<number>(0);
  const [adjustmentType, setAdjustmentType] = useState<"add" | "subtract">(
    "add"
  );

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/productos");
      if (!response.ok) throw new Error("Error al cargar productos");

      const data: ProductsResponse | Product[] = await response.json();

      // Manejar tanto la respuesta paginada como el formato legacy
      if (Array.isArray(data)) {
        // Formato legacy - array directo
        setProducts(data);
      } else if (data && typeof data === "object" && "productos" in data) {
        // Formato paginado - extraer el array de productos
        const productosArray = data.productos || [];
        setProducts(productosArray);
      } else {
        console.error("Formato de respuesta inesperado:", data);
        setProducts([]);
      }
    } catch (error) {
      console.error("Error al cargar productos:", error);
      toast.error("Error al cargar los productos");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustStock = async () => {
    if (!selectedProduct || !adjustmentQuantity) return;

    try {
      const finalQuantity =
        adjustmentType === "add"
          ? selectedProduct.stock + adjustmentQuantity
          : selectedProduct.stock - adjustmentQuantity;

      if (finalQuantity < 0) {
        toast.error("El stock no puede ser negativo");
        return;
      }

      const response = await fetch(`/api/productos/${selectedProduct.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock: finalQuantity }),
      });

      if (!response.ok) throw new Error("Error al ajustar stock");

      toast.success("Stock ajustado exitosamente");
      fetchProducts();
      setIsAdjustDialogOpen(false);
      setSelectedProduct(null);
      setAdjustmentQuantity(0);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al ajustar el stock");
    }
  };

  // Asegurar que products es un array válido antes de filtrar
  const filteredProducts = Array.isArray(products)
    ? products.filter(
        (product) =>
          product.descripcion
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          product.codigo.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  // Validación adicional para debugging
  if (!Array.isArray(products)) {
    console.warn("products no es un array:", products);
  }

  return (
    <>
      <header className="flex h-12 md:h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-2 md:px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-1 md:mr-2 h-4" />
          <h2 className="text-3xl font-bold tracking-tight text-cyan-gradient">
            Gestión de Stock
          </h2>
        </div>
      </header>

      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <div className="flex items-center space-x-2 flex-1">
            <Search className="w-5 h-5 text-gray-500" />
            <Input
              type="text"
              placeholder="Buscar por nombre o código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 max-w-md"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <p>Cargando productos...</p>
          ) : (
            filteredProducts.map((product) => (
              <Card
                key={product.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardContent className="flex flex-col h-full justify-between">
                  <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 px-0">
                    <div className="flex items-start gap-2">
                      {product.imagenUrl && (
                        <Image
                          src={product.imagenUrl}
                          alt={product.descripcion}
                          width={100}
                          height={100}
                          className="rounded-md"
                        />
                      )}

                      <CardTitle className="text-sm font-medium">
                        {product.descripcion}
                      </CardTitle>
                    </div>

                    <div className="bg-cyan-gradient rounded p-1">
                      <PackageCheck className="text-white size-5" />
                    </div>
                  </CardHeader>
                  <div className="flex flex-col gap-2">
                    <div className="text-2xl font-bold">{product.stock}</div>
                    <p className="text-xs text-muted-foreground">
                      Código: {product.codigo}
                    </p>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 bg-cyan-gradient text-white hover:text-white"
                      onClick={() => {
                        setSelectedProduct(product);
                        setAdjustmentType("add");
                        setIsAdjustDialogOpen(true);
                      }}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Agregar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 bg-cyan-gradient text-white hover:text-white"
                      onClick={() => {
                        setSelectedProduct(product);
                        setAdjustmentType("subtract");
                        setIsAdjustDialogOpen(true);
                      }}
                    >
                      <Minus className="w-4 h-4 mr-1" />
                      Restar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <Dialog open={isAdjustDialogOpen} onOpenChange={setIsAdjustDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {adjustmentType === "add" ? "Agregar" : "Restar"} Stock
            </DialogTitle>
            <DialogDescription>
              Modifica la cantidad de stock del producto seleccionado.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="mb-4">
              Producto: {selectedProduct?.descripcion}
              <br />
              Stock actual: {selectedProduct?.stock}
            </p>
            <Input
              type="number"
              min="0"
              value={adjustmentQuantity}
              onChange={(e) => setAdjustmentQuantity(Number(e.target.value))}
              placeholder="Cantidad"
            />
          </div>
          <DialogFooter className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsAdjustDialogOpen(false);
                setSelectedProduct(null);
                setAdjustmentQuantity(0);
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleAdjustStock} className="bg-cyan-gradient">
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function StockPage() {
  return (
    <SidebarProvider>
      <AppSidebar activeUrl="/admin/stock" />
      <SidebarInset>
        <StockContent />
      </SidebarInset>
    </SidebarProvider>
  );
}
