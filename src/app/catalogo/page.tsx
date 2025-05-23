"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, FileDown, Package2 } from "lucide-react";
import { toast } from "sonner";
import { useInView } from "react-intersection-observer";
import { CatalogoCard } from "@/components/catalogo/CatalogoCard";
import { PublicHeader } from "@/components/catalogo/PublicHeader";
import { CatalogoPDF } from "@/components/catalogo/CatalogoPDF";
import { pdf } from "@react-pdf/renderer";

interface Producto {
  id: number;
  codigo: string;
  descripcion: string;
  precioFinal1: number;
  iva: number;
  imagenUrl?: string;
  rubro: string;
}

interface ProductosResponse {
  productos: Producto[];
  total: number;
  hasMore: boolean;
}

export default function CatalogoPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [allProductos, setAllProductos] = useState<Producto[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingPDF, setIsLoadingPDF] = useState(false);
  const { ref: loadMoreRef, inView } = useInView();

  const ITEMS_PER_PAGE = 12;

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setIsSearching(true);
      setPage(1);
      setProductos([]);
      setHasMore(true);
      fetchProductos(1, true);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  useEffect(() => {
    if (inView && hasMore && !loading && !isSearching) {
      setPage((prevPage) => prevPage + 1);
    }
  }, [inView, hasMore, loading, isSearching]);

  useEffect(() => {
    if (page > 1 && hasMore && !isSearching) {
      fetchProductos(page, false);
    }
  }, [page]);

  const fetchProductos = async (pageNum: number, isNewSearch: boolean) => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/productos/catalogo?page=${pageNum}&limit=${ITEMS_PER_PAGE}&search=${searchTerm}`
      );
      if (!response.ok) throw new Error("Error al cargar productos");
      const data: ProductosResponse = await response.json();

      setProductos((prev) =>
        isNewSearch ? data.productos : [...prev, ...data.productos]
      );
      setHasMore(data.hasMore);
    } catch (error) {
      toast.error("Error al cargar el catálogo");
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  };

  const generateAndDownloadPDF = async (productos: Producto[]) => {
    try {
      setIsLoadingPDF(true);
      const blob = await pdf(<CatalogoPDF productos={productos} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "lista-de-precios.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error al generar PDF:", error);
      toast.error("Error al generar el PDF. Por favor intente nuevamente.");
    } finally {
      setIsLoadingPDF(false);
    }
  };

  const fetchAllProductos = async () => {
    try {
      setIsLoadingPDF(true);
      const response = await fetch(
        `/api/productos/catalogo?all=true&search=${searchTerm}`
      );
      if (!response.ok) throw new Error("Error al cargar productos");
      const data = await response.json();
      if (!data.productos || !Array.isArray(data.productos)) {
        throw new Error("Formato de datos inválido");
      }
      const productos = data.productos;
      setAllProductos(productos);
      await generateAndDownloadPDF(productos);
    } catch (error) {
      console.error("Error al cargar todos los productos:", error);
      toast.error(
        "Error al cargar los productos. Por favor intente nuevamente."
      );
      setAllProductos([]);
    } finally {
      setIsLoadingPDF(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicHeader />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-cyan-600">
              Catálogo de Productos (Precios sin IVA)
            </h1>
            <Button
              onClick={fetchAllProductos}
              disabled={isLoadingPDF}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              <FileDown className="h-4 w-4 mr-2" />
              {isLoadingPDF ? "Generando PDF..." : "Descargar PDF"}
            </Button>
          </div>

          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar productos..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {productos.map((producto) => (
              <div key={producto.id}>
                <CatalogoCard producto={producto} />
              </div>
            ))}

            {loading &&
              [...Array(6)].map((_, index) => (
                <Card key={`skeleton-${index}`} className="w-full">
                  <CardContent className="p-6">
                    <div className="animate-pulse space-y-4">
                      <div className="h-40 bg-gray-200 rounded" />
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-4 bg-gray-200 rounded w-1/2" />
                    </div>
                  </CardContent>
                </Card>
              ))}

            {!loading && productos.length === 0 && (
              <div className="col-span-full text-center text-muted-foreground">
                <Package2 className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-semibold">
                  No se encontraron productos
                </h3>
                <p className="mt-1 text-sm">
                  Intenta con otra búsqueda o revisa más tarde.
                </p>
              </div>
            )}

            {hasMore && (
              <div ref={loadMoreRef} className="col-span-full h-10" />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
