"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { PublicHeader } from "@/components/catalogo/PublicHeader";

interface Producto {
  id: number;
  codigo: string;
  descripcion: string;
  precioFinal1: number;
  iva: number;
  imagenUrl?: string;
  rubro: string;
}

export default function CatalogoTablaPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [rubros, setRubros] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("todos");

  useEffect(() => {
    fetchProductos();
  }, []);

  const fetchProductos = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/productos/catalogo");
      if (!response.ok) {
        throw new Error("Error al cargar los productos");
      }
      const data = await response.json();
      setProductos(data);

      // Extraer rubros únicos
      const uniqueRubros = Array.from(
        new Set(data.map((producto: Producto) => producto.rubro))
      ).sort() as string[];
      setRubros(uniqueRubros);

      setLoading(false);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al cargar los productos");
      setLoading(false);
    }
  };

  const handleDownloadExcel = () => {
    try {
      toast.loading("Generando archivo Excel...");

      // Filtrar productos por rubro si no está en "todos"
      const productosToExport =
        activeTab === "todos"
          ? productos
          : productos.filter((p) => p.rubro === activeTab);

      // Preparar datos para Excel
      const workbookData = productosToExport.map((producto) => {
        // Calcular el precio sin IVA
        const precioSinIva = producto.precioFinal1 / (1 + producto.iva / 100);

        return {
          CÓDIGO: producto.codigo,
          DESCRIPCIÓN: producto.descripcion,
          RUBRO: producto.rubro,
          "PRECIO SIN IVA": precioSinIva.toFixed(4),
        };
      });

      // Crear libro y hoja
      const worksheet = XLSX.utils.json_to_sheet(workbookData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Catálogo");

      // Ajustar anchos de columna
      const columnsWidth = [
        { wch: 15 }, // CÓDIGO
        { wch: 40 }, // DESCRIPCIÓN
        { wch: 20 }, // RUBRO
        { wch: 15 }, // PRECIO SIN IVA
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
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(value);
  };

  // Función para calcular el precio sin IVA
  const calcularPrecioSinIva = (precio: number, iva: number) => {
    return precio / (1 + iva / 100);
  };

  const getProductosPorRubro = (rubro: string) => {
    return productos.filter((producto) => producto.rubro === rubro);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicHeader />

      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-600 mb-4 md:mb-0">
            Lista de Precios (Sin IVA)
          </h1>
          <Button
            onClick={handleDownloadExcel}
            className="bg-green-600 hover:bg-green-700"
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Descargar Excel
          </Button>
        </div>

        <Tabs defaultValue="todos" onValueChange={setActiveTab}>
          <TabsList className="mb-6 flex flex-wrap">
            <TabsTrigger value="todos">Todos</TabsTrigger>
            {rubros.map((rubro) => (
              <TabsTrigger key={rubro} value={rubro}>
                {rubro}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="todos">
            <div className="overflow-x-auto">
              {rubros.map((rubro) => (
                <div key={rubro} className="mb-8">
                  <h2 className="text-xl font-bold mb-4 bg-indigo-600 text-white py-2 px-4 rounded">
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
                        </tr>
                      </thead>
                      <tbody>
                        {getProductosPorRubro(rubro).map((producto) => (
                          <tr key={producto.id} className="hover:bg-gray-50">
                            <td className="border px-4 py-2">
                              {producto.codigo}
                            </td>
                            <td className="border px-4 py-2">
                              {producto.descripcion}
                            </td>
                            <td className="border px-4 py-2 text-right font-semibold">
                              {formatCurrency(
                                calcularPrecioSinIva(
                                  producto.precioFinal1,
                                  producto.iva
                                )
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {rubros.map((rubro) => (
            <TabsContent key={rubro} value={rubro}>
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
                    </tr>
                  </thead>
                  <tbody>
                    {getProductosPorRubro(rubro).map((producto) => (
                      <tr key={producto.id} className="hover:bg-gray-50">
                        <td className="border px-4 py-2">{producto.codigo}</td>
                        <td className="border px-4 py-2">
                          {producto.descripcion}
                        </td>
                        <td className="border px-4 py-2 text-right font-semibold">
                          {formatCurrency(
                            calcularPrecioSinIva(
                              producto.precioFinal1,
                              producto.iva
                            )
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
