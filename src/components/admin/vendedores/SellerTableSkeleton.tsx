import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function SellerTableSkeleton() {
  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" /> {/* Nombre */}
            <Skeleton className="h-4 w-32" /> {/* Sucursal */}
          </div>
          <Skeleton className="h-10 w-[140px]" /> {/* Select de sucursal */}
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-center">
            <Skeleton className="h-4 w-4 mr-2" /> {/* Icono */}
            <Skeleton className="h-4 w-32" /> {/* DNI */}
          </div>
          <div className="flex items-center">
            <Skeleton className="h-4 w-4 mr-2" /> {/* Icono */}
            <Skeleton className="h-4 w-40" /> {/* Email */}
          </div>
          <div className="flex items-center">
            <Skeleton className="h-4 w-4 mr-2" /> {/* Icono */}
            <Skeleton className="h-4 w-28" /> {/* Teléfono */}
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Skeleton className="h-4 w-16 mb-2" /> {/* Label Comisión */}
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-20" /> {/* Input comisión */}
                <Skeleton className="h-4 w-4" /> {/* Símbolo % */}
              </div>
            </div>
            <div>
              <Skeleton className="h-4 w-24 mb-2" /> {/* Label Total Ventas */}
              <Skeleton className="h-6 w-28" /> {/* Valor Total Ventas */}
            </div>
          </div>
          <div className="mt-2">
            <Skeleton className="h-4 w-16 mb-2" /> {/* Label A Pagar */}
            <Skeleton className="h-7 w-32" /> {/* Valor A Pagar */}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
