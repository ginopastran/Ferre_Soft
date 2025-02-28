import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ProveedorCardSkeleton() {
  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" /> {/* Nombre */}
            <Skeleton className="h-4 w-32" /> {/* Código */}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center">
            <Skeleton className="h-4 w-4 mr-2" /> {/* Icono */}
            <Skeleton className="h-4 w-32" /> {/* CUIT/DNI */}
          </div>
          <div className="flex items-center">
            <Skeleton className="h-4 w-4 mr-2" /> {/* Icono */}
            <Skeleton className="h-4 w-40" /> {/* Email */}
          </div>
          <div className="flex items-center">
            <Skeleton className="h-4 w-4 mr-2" /> {/* Icono */}
            <Skeleton className="h-4 w-36" /> {/* Teléfono */}
          </div>
          <div className="flex items-center">
            <Skeleton className="h-4 w-4 mr-2" /> {/* Icono */}
            <Skeleton className="h-4 w-44" /> {/* Dirección */}
          </div>
        </div>

        <div className="mt-4">
          <Skeleton className="h-9 w-full" /> {/* Botón */}
        </div>
      </CardContent>
    </Card>
  );
}
