"use client";

import { AppSidebar } from "@/components/admin/app-sidebar";
import { Button } from "@/components/ui/button";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { FacturaDialog } from "./components/FacturaDialog";
import { FacturaCard } from "@/components/admin/ventas/FacturaCard";
import { FacturaSkeleton } from "./components/FacturaSkeleton";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";

interface Factura {
  id: string;
  numero: string;
  fecha: Date;
  vendedorId: number;
  clienteId: number;
  tipoComprobante: string;
  total: number;
  pagado: number;
  estado: string;
  cliente: {
    nombre: string;
  };
}

function VentasContent() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchFacturas();
    }
  }, [user]);

  const fetchFacturas = async () => {
    try {
      const response = await fetch(
        `/api/facturas?userId=${user?.id}&role=${user?.rol.nombre}`
      );
      if (!response.ok) throw new Error("Error al cargar facturas");
      const data = await response.json();
      setFacturas(data);
    } catch (error) {
      console.error("Error al cargar facturas:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFactura = async (data: any) => {
    try {
      const response = await fetch("/api/facturas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Error al crear la factura");

      await fetchFacturas();
    } catch (error) {
      console.error("Error:", error);
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
            Ventas
          </h2>
        </div>
      </header>
      <div className="h-full flex-1 flex-col space-y-8 p-8 flex">
        <div className="space-y-4">
          <div className="flex justify-between">
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="bg-indigo-gradient"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Venta
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {loading ? (
              <>
                <FacturaSkeleton />
                <FacturaSkeleton />
                <FacturaSkeleton />
              </>
            ) : facturas.length > 0 ? (
              facturas.map((factura) => (
                <FacturaCard
                  key={factura.id}
                  factura={factura}
                  onViewDetails={(id) => {
                    // Implementar navegación a detalles
                  }}
                  onUpdate={fetchFacturas}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-10 text-muted-foreground">
                No hay facturas para mostrar
              </div>
            )}
          </div>
        </div>
      </div>

      <FacturaDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={handleCreateFactura}
      />
    </>
  );
}

export default function VentasPage() {
  return (
    <SidebarProvider>
      <AppSidebar activeUrl="/admin/ventas" />
      <SidebarInset>
        <VentasContent />
      </SidebarInset>
    </SidebarProvider>
  );
}
