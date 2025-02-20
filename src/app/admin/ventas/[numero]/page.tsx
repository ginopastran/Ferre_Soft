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
import { PagoDialog } from "../components/PagoDialog";
import { ArrowLeft, DollarSign, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FacturaTabs } from "../components/FacturaTabs";
import { FacturaSkeleton } from "../components/FacturaSkeleton";

interface DetalleFactura {
  id: number;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  producto: {
    codigo: string;
    descripcion: string;
  };
}

interface Factura {
  id: string;
  numero: string;
  fecha: Date;
  cliente: {
    codigo: string;
    nombre: string;
  };
  tipoComprobante: string;
  total: number;
  pagado: number;
  estado: string;
  detalles: DetalleFactura[];
  vendedor: {
    nombre: string;
  };
  pagos: Array<{
    id: string;
    fecha: Date;
    monto: number;
    metodoPago: string;
    observaciones?: string;
  }>;
}

function FacturaContent() {
  const params = useParams();
  const router = useRouter();
  const [factura, setFactura] = useState<Factura | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPagoDialogOpen, setIsPagoDialogOpen] = useState(false);

  useEffect(() => {
    fetchFactura();
  }, []);

  const fetchFactura = async () => {
    try {
      const response = await fetch(`/api/facturas/${params?.numero}`);
      if (!response.ok) throw new Error("Factura no encontrada");
      const data = await response.json();
      setFactura(data);
    } catch (error) {
      toast.error("Error al cargar la factura");
      router.push("/admin/ventas");
    } finally {
      setLoading(false);
    }
  };

  const getBadgeColor = (estado: string) => {
    switch (estado) {
      case "PAGADA":
        return "bg-gradient-to-r from-green-500 to-green-600";
      case "PENDIENTE":
        return "bg-gradient-to-r from-yellow-500 to-yellow-600";
      case "ANULADA":
        return "bg-gradient-to-r from-red-500 to-red-600";
      default:
        return "bg-gray-500";
    }
  };

  if (!factura && !loading) return null;

  return (
    <>
      <header className="flex h-12 md:h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-2 md:px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-1 md:mr-2 h-4" />
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center bg-indigo-gradient text-white hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a ventas
          </Button>
        </div>
      </header>

      <div className="h-full flex-1 flex-col space-y-8 p-8 flex">
        {loading ? (
          <FacturaSkeleton />
        ) : factura ? (
          <div className="p-6 bg-white rounded-lg border shadow-sm">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-semibold text-indigo-gradient">
                  Factura #{factura.numero}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {new Date(factura.fecha).toLocaleDateString()}
                </p>
              </div>
              <Badge className={getBadgeColor(factura.estado)}>
                {factura.estado}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Cliente</h3>
                <p>{factura.cliente.nombre}</p>
                <p className="text-sm text-muted-foreground">
                  Código: {factura.cliente.codigo}
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Información</h3>
                <div className="flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{factura.tipoComprobante}</span>
                </div>
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span>Total: {formatCurrency(factura.total)}</span>
                    <span className="text-sm text-muted-foreground">
                      Pagado: {formatCurrency(factura.pagado)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <FacturaTabs
              detalles={factura.detalles || []}
              pagos={factura.pagos || []}
              total={factura.total}
            />

            {factura.estado !== "PAGADA" && (
              <div className="mt-6 flex justify-end">
                <Button
                  className="bg-indigo-gradient"
                  onClick={() => setIsPagoDialogOpen(true)}
                >
                  Ingresar Pago
                  <DollarSign className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}
          </div>
        ) : null}

        {!loading && factura && (
          <PagoDialog
            open={isPagoDialogOpen}
            onOpenChange={setIsPagoDialogOpen}
            facturaNumero={factura.numero}
            total={factura.total}
            pagado={factura.pagado}
            onPagoComplete={fetchFactura}
          />
        )}
      </div>
    </>
  );
}

export default function FacturaPage() {
  return (
    <SidebarProvider>
      <AppSidebar activeUrl="/admin/ventas" />
      <SidebarInset>
        <FacturaContent />
      </SidebarInset>
    </SidebarProvider>
  );
}
