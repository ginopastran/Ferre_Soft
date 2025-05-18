"use client";

import { AppSidebar } from "@/components/admin/app-sidebar";
import { Button } from "@/components/ui/button";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils/format";
import { ArrowLeft, Calendar, DollarSign, User2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { ComisionMensualTab } from "../components/ComisionMensualTab";
import { PagosVendedorTab } from "../components/PagosVendedorTab";

interface Vendedor {
  id: number;
  nombre: string;
  email: string;
  dni: string;
  telefono: string | null;
  comision: number;
  totalVentas: number;
  totalPagado: number;
  montoPendiente: number;
  sucursal: {
    id: number;
    nombre: string;
  } | null;
}

function VendedorContent() {
  const params = useParams();
  const router = useRouter();
  const [vendedor, setVendedor] = useState<Vendedor | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("comisiones");

  useEffect(() => {
    fetchVendedor();
  }, []);

  const fetchVendedor = async () => {
    try {
      const response = await fetch(
        `/api/usuarios/vendedor?userId=${params?.id}&includeVentas=true`
      );
      if (!response.ok) throw new Error("Vendedor no encontrado");
      const data = await response.json();
      setVendedor(data);
    } catch (error) {
      toast.error("Error al cargar el vendedor");
      router.push("/admin/vendedores");
    } finally {
      setLoading(false);
    }
  };

  if (!vendedor && !loading) return null;

  return (
    <>
      <header className="flex h-12 md:h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-2 md:px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-1 md:mr-2 h-4" />
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center bg-cyan-gradient text-white hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a vendedores
          </Button>
        </div>
      </header>

      <div className="h-full flex-1 flex-col space-y-8 p-8 flex">
        {loading ? (
          <div className="p-6 bg-white rounded-lg border shadow-sm animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        ) : vendedor ? (
          <div className="p-6 bg-white rounded-lg border shadow-sm">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-semibold text-cyan-gradient">
                  {vendedor.nombre}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {vendedor.sucursal?.nombre || "Sin sucursal asignada"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <User2 className="h-5 w-5 text-muted-foreground" />
                  <span className="text-base text-muted-foreground">
                    Email:
                  </span>
                  <span className="text-base">{vendedor.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User2 className="h-5 w-5 text-muted-foreground" />
                  <span className="text-base text-muted-foreground">DNI:</span>
                  <span className="text-base">{vendedor.dni}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User2 className="h-5 w-5 text-muted-foreground" />
                  <span className="text-base text-muted-foreground">
                    Teléfono:
                  </span>
                  <span className="text-base">{vendedor.telefono || "-"}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span>Comisión: {vendedor.comision}%</span>
                  </div>
                </div>
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span>
                      Total Ventas: {formatCurrency(vendedor.totalVentas)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span>
                      A Pagar: {formatCurrency(vendedor.montoPendiente)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Total pagado: {formatCurrency(vendedor.totalPagado)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <Tabs
              defaultValue="comisiones"
              className="w-full"
              onValueChange={setActiveTab}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="comisiones">
                  <Calendar className="h-4 w-4 mr-2" />
                  Comisiones Mensuales
                </TabsTrigger>
                <TabsTrigger value="pagos">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Historial de Pagos
                </TabsTrigger>
              </TabsList>
              <TabsContent value="comisiones" className="mt-4">
                <ComisionMensualTab
                  vendedorId={vendedor.id}
                  nombreVendedor={vendedor.nombre}
                  comisionPorcentaje={vendedor.comision}
                  onPagoComplete={fetchVendedor}
                />
              </TabsContent>
              <TabsContent value="pagos" className="mt-4">
                <PagosVendedorTab
                  vendedorId={vendedor.id}
                  nombreVendedor={vendedor.nombre}
                />
              </TabsContent>
            </Tabs>
          </div>
        ) : null}
      </div>
    </>
  );
}

export default function VendedorPage() {
  return (
    <SidebarProvider>
      <AppSidebar activeUrl="/admin/vendedores" />
      <SidebarInset>
        <VendedorContent />
      </SidebarInset>
    </SidebarProvider>
  );
}
