"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Search } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { PublicHeader } from "@/components/catalogo/PublicHeader";
import { Input } from "@/components/ui/input";
import { RubroToggleGroup } from "@/components/catalogo/RubroToggleGroup";

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

export default function CatalogoTablaPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [rubros, setRubros] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeRubro, setActiveRubro] = useState<string>("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [isGeneratingExcel, setIsGeneratingExcel] = useState(false);

  useEffect(() => {
    fetchProductos();
  }, []);

  const fetchProductos = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/productos/catalogo?all=true");
      if (!response.ok) {
        throw new Error("Error al cargar los productos");
      }
      const data: ProductosResponse = await response.json();

      if (!data.productos) {
        throw new Error("Formato de datos inválido");
      }

      setProductos(data.productos);

      // Extraer rubros únicos
      const uniqueRubros = Array.from(
        new Set(data.productos.map((producto) => producto.rubro))
      ).sort();
      setRubros(uniqueRubros);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al cargar los productos");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadExcel = async () => {
    try {
      setIsGeneratingExcel(true);
      toast.loading("Generando archivo Excel...");

      // Filtrar productos por rubro y búsqueda
      const productosToExport = productos
        .filter((p) => activeRubro === "todos" || p.rubro === activeRubro)
        .filter(
          (p) =>
            searchTerm === "" ||
            p.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.rubro.toLowerCase().includes(searchTerm.toLowerCase())
        );

      // Preparar datos para Excel
      const workbookData = productosToExport.map((producto) => {
        const precioSinIva = producto.precioFinal1 / (1 + producto.iva / 100);
        return {
          CÓDIGO: producto.codigo,
          DESCRIPCIÓN: producto.descripcion,
          RUBRO: producto.rubro,
          "PRECIO SIN IVA": precioSinIva.toFixed(2),
          "IVA %": producto.iva,
          "PRECIO FINAL": producto.precioFinal1.toFixed(2),
        };
      });

      // Crear libro y hoja
      const worksheet = XLSX.utils.json_to_sheet(workbookData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Catálogo");

      // Ajustar anchos de columna
      const columnsWidth = [
        { wch: 15 }, // CÓDIGO
        { wch: 50 }, // DESCRIPCIÓN
        { wch: 20 }, // RUBRO
        { wch: 15 }, // PRECIO SIN IVA
        { wch: 10 }, // IVA %
        { wch: 15 }, // PRECIO FINAL
      ];
      worksheet["!cols"] = columnsWidth;

      // Generar archivo
      XLSX.writeFile(workbook, "catalogo-productos.xlsx");

      toast.dismiss();
      toast.success("Archivo Excel generado correctamente");
    } catch (error) {
      console.error("Error al generar Excel:", error);
      toast.dismiss();
      toast.error("Error al generar el archivo Excel");
    } finally {
      setIsGeneratingExcel(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const calcularPrecioSinIva = (precio: number, iva: number) => {
    return precio / (1 + iva / 100);
  };

  const getProductosFiltrados = (rubro?: string) => {
    return productos
      .filter((p) => !rubro || p.rubro === rubro)
      .filter(
        (p) =>
          searchTerm === "" ||
          p.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.rubro.toLowerCase().includes(searchTerm.toLowerCase())
      );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicHeader />

      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-cyan-600 mb-4 md:mb-0">
            Lista de Precios (Sin IVA)
          </h1>
          <Button
            onClick={handleDownloadExcel}
            disabled={isGeneratingExcel}
            className="bg-green-600 hover:bg-green-700"
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            {isGeneratingExcel ? "Generando..." : "Descargar Excel"}
          </Button>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por código, descripción o rubro..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="mb-6">
          <RubroToggleGroup
            rubros={rubros}
            activeRubro={activeRubro}
            onRubroChange={setActiveRubro}
            getProductosCount={(rubro) => getProductosFiltrados(rubro).length}
          />
        </div>

        <div className="overflow-x-auto">
          {rubros.map((rubro) => {
            const productosFiltrados = getProductosFiltrados(rubro);
            if (activeRubro !== "todos" && activeRubro !== rubro) return null;
            if (productosFiltrados.length === 0) return null;

            return (
              <div key={rubro} className="mb-8">
                <h2 className="text-xl font-bold mb-4 bg-cyan-600 text-white py-2 px-4 rounded">
                  {rubro}
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border px-4 py-2 text-left">Código</th>
                        <th className="border px-4 py-2 text-left">
                          Descripción
                        </th>
                        <th className="border px-4 py-2 text-right">
                          Precio sin IVA
                        </th>
                        <th className="border px-4 py-2 text-right">IVA</th>
                        <th className="border px-4 py-2 text-right">
                          Precio Final
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {productosFiltrados.map((producto) => (
                        <tr key={producto.id} className="hover:bg-gray-50">
                          <td className="border px-4 py-2">
                            {producto.codigo}
                          </td>
                          <td className="border px-4 py-2">
                            {producto.descripcion}
                          </td>
                          <td className="border px-4 py-2 text-right">
                            {formatCurrency(
                              calcularPrecioSinIva(
                                producto.precioFinal1,
                                producto.iva
                              )
                            )}
                          </td>
                          <td className="border px-4 py-2 text-right">
                            {producto.iva}%
                          </td>
                          <td className="border px-4 py-2 text-right font-semibold">
                            {formatCurrency(producto.precioFinal1)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
