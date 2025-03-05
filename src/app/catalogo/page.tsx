"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, FileDown, Package2 } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils/format";
import { CatalogoCard } from "@/components/catalogo/CatalogoCard";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

interface Producto {
  id: number;
  codigo: string;
  descripcion: string;
  precioFinal1: number;
  iva: number;
  imagenUrl?: string;
  rubro: string;
}

export default function CatalogoPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [filteredProductos, setFilteredProductos] = useState<Producto[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const catalogoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchProductos();
  }, []);

  useEffect(() => {
    const results = productos.filter((producto) =>
      Object.values({
        codigo: producto.codigo,
        descripcion: producto.descripcion,
        rubro: producto.rubro,
      }).some((value) =>
        value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
    setFilteredProductos(results);
  }, [searchTerm, productos]);

  const fetchProductos = async () => {
    try {
      const response = await fetch("/api/productos/catalogo");
      if (!response.ok) throw new Error("Error al cargar productos");
      const data = await response.json();
      setProductos(data);
      setFilteredProductos(data);
    } catch (error) {
      toast.error("Error al cargar el catálogo");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!catalogoRef.current) return;

    try {
      toast.loading("Generando PDF...");

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // Configuración de la página
      const pageWidth = 210; // A4 width
      const pageHeight = 297; // A4 height
      const margin = 15;
      const contentWidth = pageWidth - margin * 2;
      const colWidth = (contentWidth - margin) / 2; // Ancho de cada columna

      // Configurar fuente y tamaños
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(16);

      // Agregar encabezado
      pdf.setTextColor(0, 0, 0);
      pdf.text("LISTA DE PRECIOS", pageWidth / 2, margin, { align: "center" });
      pdf.setFontSize(12);
      const fecha = new Date().toLocaleDateString();
      pdf.text(fecha, pageWidth - margin, margin, { align: "right" });

      let yPosition = margin + 20;
      let currentPage = 1;
      const itemHeight = 100; // Altura estimada para cada producto
      const itemsPerPage =
        Math.floor((pageHeight - margin * 3 - 20) / itemHeight) * 2; // Items por página (2 columnas)

      // Procesar productos en pares (2 columnas)
      for (let i = 0; i < filteredProductos.length; i += 2) {
        // Nueva página si es necesario
        if (i > 0 && i % itemsPerPage === 0) {
          pdf.addPage();
          yPosition = margin + 20;
          currentPage++;
        }

        // Primera columna
        const producto1 = filteredProductos[i];
        if (producto1) {
          const card1 = document.getElementById(`product-card-${producto1.id}`);
          if (card1) {
            const canvas1 = await html2canvas(card1, {
              scale: 2,
              useCORS: true,
              logging: false,
              backgroundColor: "#ffffff",
            });

            const imgWidth1 = colWidth;
            const imgHeight1 = (canvas1.height * colWidth) / canvas1.width;

            pdf.addImage(
              canvas1.toDataURL("image/jpeg", 1.0),
              "JPEG",
              margin,
              yPosition,
              imgWidth1,
              imgHeight1,
              "",
              "FAST"
            );
          }
        }

        // Segunda columna
        const producto2 = filteredProductos[i + 1];
        if (producto2) {
          const card2 = document.getElementById(`product-card-${producto2.id}`);
          if (card2) {
            const canvas2 = await html2canvas(card2, {
              scale: 2,
              useCORS: true,
              logging: false,
              backgroundColor: "#ffffff",
            });

            const imgWidth2 = colWidth;
            const imgHeight2 = (canvas2.height * colWidth) / canvas2.width;

            pdf.addImage(
              canvas2.toDataURL("image/jpeg", 1.0),
              "JPEG",
              margin + colWidth + margin,
              yPosition,
              imgWidth2,
              imgHeight2,
              "",
              "FAST"
            );
          }
        }

        // Actualizar posición Y para la siguiente fila
        const maxHeight = Math.max(
          document.getElementById(`product-card-${producto1.id}`)
            ?.offsetHeight || 0,
          document.getElementById(`product-card-${producto2?.id}`)
            ?.offsetHeight || 0
        );
        yPosition +=
          (maxHeight * colWidth) /
            (document.getElementById(`product-card-${producto1.id}`)
              ?.offsetWidth || colWidth) +
          10;

        // Agregar número de página
        pdf.setFontSize(8);
        pdf.text(`Página ${currentPage}`, pageWidth / 2, pageHeight - margin, {
          align: "center",
        });
      }

      pdf.save("lista-de-precios.pdf");

      toast.dismiss();
      toast.success("PDF generado exitosamente");
    } catch (error) {
      toast.dismiss();
      toast.error("Error al generar el PDF");
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-indigo-gradient">
              Catálogo de Productos
            </h1>
            <Button onClick={handleDownloadPDF} className="bg-indigo-gradient">
              <FileDown className="h-4 w-4 mr-2" />
              Descargar PDF
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
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

          <div
            ref={catalogoRef}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {loading ? (
              <>
                {[...Array(6)].map((_, index) => (
                  <Card key={index} className="w-full">
                    <CardContent className="p-6">
                      <div className="animate-pulse space-y-4">
                        <div className="h-40 bg-gray-200 rounded" />
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                        <div className="h-4 bg-gray-200 rounded w-1/2" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            ) : filteredProductos.length > 0 ? (
              filteredProductos.map((producto) => (
                <div key={producto.id} id={`product-card-${producto.id}`}>
                  <CatalogoCard producto={producto} />
                </div>
              ))
            ) : (
              <div className="col-span-full text-center text-muted-foreground">
                No se encontraron productos
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
