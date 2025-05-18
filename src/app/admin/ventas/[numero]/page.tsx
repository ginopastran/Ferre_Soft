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
import {
  ArrowLeft,
  Code,
  DollarSign,
  FileText,
  Hash,
  User2,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FacturaTabs } from "../components/FacturaTabs";
import { FacturaSkeleton } from "../components/FacturaSkeleton";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { AfipInfo } from "@/components/admin/ventas/AfipInfo";
import { RemitoInfo } from "@/components/admin/ventas/RemitoInfo";

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
  cae?: string | null;
  vencimientoCae?: string | null;
  afipComprobante?: number | null;
  facturaAnuladaId?: string | null;
  facturaAnulada?: {
    id: string;
    numero: string;
  } | null;
}

function FacturaContent({ isAdmin }: { isAdmin: boolean }) {
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
        return "bg-gradient-to-r from-green-600 to-green-700";
      case "PENDIENTE":
        return "bg-gradient-to-r from-yellow-600 to-yellow-700";
      case "ANULADA":
        return "bg-gradient-to-r from-red-600 to-red-700";
      default:
        return "bg-gray-500";
    }
  };

  const getEstadoLabel = (estado: string, tipoComprobante: string) => {
    if (tipoComprobante.startsWith("NOTA_CREDITO") && estado === "PAGADA") {
      return "EMITIDA";
    }
    return estado;
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
            className="flex items-center bg-cyan-gradient text-white hover:text-white"
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
                <h2 className="text-2xl font-semibold text-cyan-gradient">
                  {factura.tipoComprobante.startsWith("NOTA_CREDITO")
                    ? `Nota de Crédito #${factura.numero}`
                    : `Factura #${factura.numero}`}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {new Date(factura.fecha).toLocaleDateString()}
                </p>
              </div>
              <Badge className={getBadgeColor(factura.estado)}>
                {getEstadoLabel(factura.estado, factura.tipoComprobante)}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              {/* <div className="space-y-2">
                <h3 className="text-lg font-semibold">Cliente</h3>
                <p>{factura.cliente.nombre}</p>
                <p className="text-sm text-muted-foreground">
                  Código: {factura.cliente.codigo}
                </p>
              </div> */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <User2 className="h-5 w-5 text-muted-foreground" />
                  <span className="text-base text-muted-foreground">
                    Cliente:
                  </span>
                  <span className="text-base">{factura.cliente.nombre}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Hash className="h-5 w-5 text-muted-foreground" />
                  <span className="text-base text-muted-foreground">
                    Código:
                  </span>
                  <span className="text-base">{factura.cliente.codigo}</span>
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <span className="text-base text-muted-foreground">
                      Vendedor:
                    </span>
                    <span className="text-base">{factura.vendedor.nombre}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{factura.tipoComprobante}</span>
                </div>
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span>Total: {formatCurrency(factura.total)}</span>
                    {!factura.tipoComprobante.startsWith("NOTA_CREDITO") && (
                      <span className="text-sm text-muted-foreground">
                        Pagado: {formatCurrency(factura.pagado)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {factura.facturaAnulada && factura.facturaAnulada.numero && (
              <div className="mb-6 p-4 border border-amber-200 bg-amber-50 rounded-md">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-amber-600" />
                  <span className="text-amber-800 font-medium">
                    Esta nota de crédito anula la factura:{" "}
                    <Button
                      variant="link"
                      className="p-0 h-auto text-amber-600 font-medium"
                      onClick={() => {
                        if (
                          factura.facturaAnulada &&
                          factura.facturaAnulada.numero
                        ) {
                          router.push(
                            `/admin/ventas/${factura.facturaAnulada.numero}`
                          );
                        }
                      }}
                    >
                      {factura.facturaAnulada.numero}
                    </Button>
                  </span>
                </div>
              </div>
            )}

            {/* Información de AFIP o Remito según el tipo de comprobante */}
            {(factura.tipoComprobante === "FACTURA_A" ||
              factura.tipoComprobante === "FACTURA_B") && (
              <div className="mb-6">
                <AfipInfo
                  cae={factura.cae}
                  vencimientoCae={factura.vencimientoCae}
                  afipComprobante={factura.afipComprobante}
                  tipoComprobante={factura.tipoComprobante}
                  factura={factura}
                  onUpdate={fetchFactura}
                />
              </div>
            )}

            {/* Información de AFIP para notas de crédito */}
            {(factura.tipoComprobante === "NOTA_CREDITO_A" ||
              factura.tipoComprobante === "NOTA_CREDITO_B") && (
              <div className="mb-6">
                <AfipInfo
                  cae={factura.cae}
                  vencimientoCae={factura.vencimientoCae}
                  afipComprobante={factura.afipComprobante}
                  tipoComprobante={factura.tipoComprobante}
                  factura={factura}
                  onUpdate={fetchFactura}
                />
              </div>
            )}

            {factura.tipoComprobante === "REMITO" && (
              <div className="mb-6">
                <RemitoInfo remito={factura} onUpdate={fetchFactura} />
              </div>
            )}

            <FacturaTabs
              detalles={factura.detalles || []}
              pagos={factura.pagos || []}
              total={factura.total}
              tipoComprobante={factura.tipoComprobante}
            />

            {factura.estado !== "PAGADA" &&
              factura.estado !== "ANULADA" &&
              !factura.tipoComprobante.startsWith("NOTA_CREDITO") && (
                <div className="mt-6 flex justify-end">
                  <Button
                    className="bg-cyan-gradient"
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
  const { user } = useAuth();
  const isAdmin = user?.rol?.nombre === "ADMIN";

  return (
    <SidebarProvider>
      <AppSidebar activeUrl="/admin/ventas" />
      <SidebarInset>
        <FacturaContent isAdmin={isAdmin} />
      </SidebarInset>
    </SidebarProvider>
  );
}
