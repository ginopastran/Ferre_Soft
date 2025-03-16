"use client";

import { AppSidebar } from "@/components/admin/app-sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  ArrowLeft,
  Package2,
  Loader,
  Tag,
  Barcode,
  DollarSign,
  Archive,
  Pencil,
  Hash,
  ScanLine,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ProductDialog, ProductForm } from "../components/ProductDialog";
import { formatCurrency } from "@/lib/utils/format";
import Image from "next/image";

interface Product {
  id: number;
  codigo: string;
  codigoProveedor: string;
  codigoBarras: string | null;
  rubro: string;
  descripcion: string;
  proveedor: string;
  precioCosto: number;
  iva: number;
  margenGanancia1: number;
  precioFinal1: number;
  margenGanancia2: number;
  precioFinal2: number;
  imagenUrl?: string;
  stock: number;
  creadoEn: Date;
}

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, []);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/productos/${params?.id}`);
      if (!response.ok) throw new Error("Producto no encontrado");
      const data = await response.json();
      setProduct(data);
    } catch (error) {
      toast.error("Error al cargar el producto");
      router.push("/admin/productos");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProduct = async (data: ProductForm) => {
    try {
      const response = await fetch(`/api/productos/${params?.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Error al actualizar el producto");
      await fetchProduct();
      toast.success("Producto actualizado exitosamente");
    } catch (error) {
      toast.error("Error al actualizar el producto");
      throw error;
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar activeUrl={`/admin/productos`} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="flex{ABBABA51-AF03-46CF-A253-D1107F7175D8}.png items-center bg-indigo-gradient text-white hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a productos
            </Button>
          </div>
        </header>
        <div className="h-full px-4 py-6 lg:px-8">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <Loader className="h-10 w-10 animate-spin" />
            </div>
          ) : (
            <Card>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row justify-between items-start">
                    <div className="flex items-center gap-4 flex-wrap">
                      <h2 className="text-3xl font-bold text-indigo-gradient">
                        {product?.descripcion}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Creado el:{" "}
                        {product?.creadoEn
                          ? new Date(product.creadoEn).toLocaleDateString()
                          : ""}
                      </p>
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => setIsDialogOpen(true)}
                      className="bg-indigo-gradient text-white hover:text-white hidden md:flex"
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Editar Producto
                    </Button>
                  </div>

                  <div className="flex w-full gap-8 md:gap-20 md:flex-row flex-col items-start md:items-end">
                    {product?.imagenUrl && (
                      <div className="flex justify-center">
                        <div className="relative w-40 h-40">
                          <Image
                            src={product.imagenUrl}
                            alt={product.descripcion}
                            fill
                            className="object-cover rounded-lg"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />
                        </div>
                      </div>
                    )}
                    <div className="flex items-center">
                      <Tag className="h-8 w-8 mr-3 text-muted-foreground" />
                      <div className="flex flex-col gap-0">
                        <span className="block text-lg">{product?.rubro}</span>
                        <span className="text-sm text-muted-foreground">
                          Rubro
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <Hash className="h-8 w-8 mr-3 text-muted-foreground" />
                      <div className="flex flex-col gap-0">
                        <span className="block text-lg">{product?.codigo}</span>
                        <span className="text-sm text-muted-foreground">
                          Código
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Barcode className="h-8 w-8 mr-3 text-muted-foreground" />
                      <div className="flex flex-col gap-0">
                        <span className="block text-lg">
                          {product?.codigoProveedor}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          Código Proveedor
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <ScanLine className="h-8 w-8 mr-3 text-muted-foreground" />
                      <div className="flex flex-col gap-0">
                        <span className="block text-lg">
                          {product?.codigoBarras || "No asignado"}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          Código de Barras
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <Package2 className="h-8 w-8 mr-3 text-muted-foreground" />
                      <div className="flex flex-col gap-0">
                        <span className="block text-lg">
                          {product?.proveedor}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          Proveedor
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <Archive className="h-8 w-8 mr-3 text-muted-foreground" />
                      <div className="flex flex-col gap-0">
                        <span className="block text-lg">{product?.stock}</span>
                        <span className="text-sm text-muted-foreground">
                          Stock
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="space-y-4">
                      <div className="flex gap-10 flex-col md:flex-row">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Precio Costo
                          </p>
                          <p className="text-lg font-semibold">
                            {formatCurrency(product?.precioCosto || 0)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">IVA</p>
                          <p className="text-lg font-semibold">
                            {product?.iva}%
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-10 flex-col md:flex-row pt-4">
                        <div>
                          <h3 className="text-lg font-semibold mb-2">
                            Lista de Precio 1
                          </h3>
                          <div className="space-y-2">
                            <p>
                              <span className="text-muted-foreground">
                                Margen:
                              </span>{" "}
                              {product?.margenGanancia1}%
                            </p>
                            <p>
                              <span className="text-muted-foreground">
                                Precio Final:
                              </span>{" "}
                              {formatCurrency(product?.precioFinal1 || 0)}
                            </p>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold mb-2">
                            Lista de Precio 2
                          </h3>
                          <div className="space-y-2">
                            <p>
                              <span className="text-muted-foreground">
                                Margen:
                              </span>{" "}
                              {product?.margenGanancia2}%
                            </p>
                            <p>
                              <span className="text-muted-foreground">
                                Precio Final:
                              </span>{" "}
                              {formatCurrency(product?.precioFinal2 || 0)}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => setIsDialogOpen(true)}
                          className="bg-indigo-gradient text-white hover:text-white flex md:hidden"
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          Editar Producto
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </SidebarInset>

      <ProductDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={handleUpdateProduct}
        initialData={product}
        mode="edit"
      />
    </SidebarProvider>
  );
}
