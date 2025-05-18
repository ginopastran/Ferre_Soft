import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Eye, DollarSign, User2, Users } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { PagoDialog } from "@/app/admin/ventas/components/PagoDialog";
import { useRouter } from "next/navigation";

interface FacturaCardProps {
  factura: {
    id: string;
    numero: string;
    fecha: Date;
    tipoComprobante: string;
    total: number;
    pagado: number;
    estado: string;
    cliente: {
      nombre: string;
    };
    vendedor?: {
      nombre: string;
    };
  };
  showVendedor?: boolean;
  onViewDetails: (id: string) => void;
  onUpdate: () => void;
}

export function FacturaCard({
  factura,
  showVendedor,
  onViewDetails,
  onUpdate,
}: FacturaCardProps) {
  const [isPagoDialogOpen, setIsPagoDialogOpen] = useState(false);
  const router = useRouter();

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

  const handleViewDetails = () => {
    router.push(`/admin/ventas/${factura.numero}`);
  };

  const mostrarBotonPago =
    factura.estado !== "PAGADA" &&
    factura.estado !== "ANULADA" &&
    !factura.tipoComprobante.startsWith("NOTA_CREDITO");

  return (
    <Card className="w-full">
      <CardContent
        className="p-6 flex flex-col h-full"
        style={{ minHeight: "240px" }}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-semibold text-cyan-gradient">
              {factura.numero}
            </h2>
            <p className="text-sm text-muted-foreground">
              {new Date(factura.fecha).toLocaleDateString()}
            </p>
          </div>
          <Badge className={getBadgeColor(factura.estado)}>
            {getEstadoLabel(factura.estado, factura.tipoComprobante)}
          </Badge>
        </div>

        <div className="space-y-2 mb-4 flex-grow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Cliente:</span>
              <span className="text-sm">{factura.cliente.nombre}</span>
            </div>
          </div>

          {showVendedor && factura.vendedor && (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Vendedor:</span>
              <span className="text-sm">{factura.vendedor.nombre}</span>
            </div>
          )}

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

        <div className="flex flex-col md:flex-row gap-2 mt-auto">
          {mostrarBotonPago ? (
            <>
              <Button
                variant="outline"
                className="flex-1 bg-cyan-gradient text-white hover:text-white"
                onClick={handleViewDetails}
              >
                Ver detalles
                <Eye className="h-4 w-4 ml-2" />
              </Button>
              <Button
                variant="outline"
                className="flex-1 bg-cyan-gradient text-white hover:text-white"
                onClick={() => setIsPagoDialogOpen(true)}
              >
                Ingresar Pago
                <DollarSign className="h-4 w-4 ml-2" />
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              className="w-full bg-cyan-gradient text-white hover:text-white"
              onClick={handleViewDetails}
            >
              Ver detalles
              <Eye className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>

        <PagoDialog
          open={isPagoDialogOpen}
          onOpenChange={setIsPagoDialogOpen}
          facturaNumero={factura.numero}
          total={factura.total}
          pagado={factura.pagado}
          onPagoComplete={onUpdate}
        />
      </CardContent>
    </Card>
  );
}
