import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function FacturaSkeleton() {
  return (
    <Card className="w-full">
      <CardContent className="p-6">
        {/* Header con número de factura y fecha */}
        <div className="flex justify-between items-start mb-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-32" /> {/* Número de factura */}
            <Skeleton className="h-4 w-24" /> {/* Fecha */}
          </div>
          <Skeleton className="h-6 w-24" /> {/* Badge de estado */}
        </div>

        {/* Información del cliente y vendedor */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center">
            <Skeleton className="h-4 w-4 mr-2" /> {/* Icono */}
            <Skeleton className="h-4 w-48" /> {/* Cliente */}
          </div>
          <div className="flex items-center">
            <Skeleton className="h-4 w-4 mr-2" /> {/* Icono */}
            <Skeleton className="h-4 w-40" /> {/* Vendedor */}
          </div>
        </div>

        {/* Información de pagos */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <Skeleton className="h-4 w-20 mb-1" /> {/* Label Total */}
            <Skeleton className="h-6 w-28" /> {/* Valor Total */}
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-between gap-2 w-full">
          <Skeleton className="h-9 w-full" /> {/* Botón Ver */}
          <Skeleton className="h-9 w-full" /> {/* Botón Pagar */}
        </div>
      </CardContent>
    </Card>
  );
}
