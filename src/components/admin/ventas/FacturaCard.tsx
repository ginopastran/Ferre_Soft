import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Eye, DollarSign } from "lucide-react";
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
  };
  onViewDetails: (id: string) => void;
  onUpdate?: () => void;
}

export function FacturaCard({
  factura,
  onViewDetails,
  onUpdate,
}: FacturaCardProps) {
  const [isPagoDialogOpen, setIsPagoDialogOpen] = useState(false);
  const router = useRouter();

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

  const handleViewDetails = () => {
    router.push(`/admin/ventas/${factura.numero}`);
  };

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-semibold text-indigo-gradient">
              {factura.numero}
            </h2>
            <p className="text-sm text-muted-foreground">
              {new Date(factura.fecha).toLocaleDateString()}
            </p>
          </div>
          <Badge className={getBadgeColor(factura.estado)}>
            {factura.estado}
          </Badge>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center">
            <span className="text-base">
              Cliente:{" "}
              <span className="text-base ">{factura.cliente.nombre}</span>
            </span>
          </div>
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

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 bg-indigo-gradient text-white hover:text-white"
            onClick={handleViewDetails}
          >
            Ver detalles
            <Eye className="h-4 w-4 ml-2" />
          </Button>

          {factura.estado !== "PAGADA" && (
            <Button
              variant="outline"
              className="flex-1 bg-indigo-gradient text-white hover:text-white"
              onClick={() => setIsPagoDialogOpen(true)}
            >
              Ingresar Pago
              <DollarSign className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>

        <PagoDialog
          open={isPagoDialogOpen}
          onOpenChange={setIsPagoDialogOpen}
          facturaNumero={factura.numero}
          total={factura.total}
          pagado={factura.pagado}
          onPagoComplete={onUpdate || (() => {})}
        />
      </CardContent>
    </Card>
  );
}
