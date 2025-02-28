import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ProductsGridSkeleton() {
  return (
    <>
      {[...Array(6)].map((_, i) => (
        <Card key={i} className="w-full">
          <CardContent className="p-6">
            {/* Imagen */}
            <div className="flex justify-center items-center mb-4">
              <Skeleton className="w-40 h-40 rounded-md" />
            </div>

            {/* Título */}
            <div className="flex justify-between items-start my-4">
              <div>
                <Skeleton className="h-8 w-48" /> {/* Descripción */}
              </div>
            </div>

            {/* Detalles */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center">
                <Skeleton className="h-4 w-4 mr-2" /> {/* Icono */}
                <Skeleton className="h-4 w-32" /> {/* Código */}
              </div>
              <div className="flex items-center">
                <Skeleton className="h-4 w-4 mr-2" /> {/* Icono */}
                <Skeleton className="h-4 w-40" /> {/* Código Proveedor */}
              </div>
              <div className="flex items-center">
                <Skeleton className="h-4 w-4 mr-2" /> {/* Icono */}
                <Skeleton className="h-4 w-44" /> {/* Código de Barras */}
              </div>
              <div className="flex items-center">
                <Skeleton className="h-4 w-4 mr-2" /> {/* Icono */}
                <Skeleton className="h-4 w-36" /> {/* Stock */}
              </div>
            </div>

            {/* Botón */}
            <Skeleton className="h-9 w-full" />
          </CardContent>
        </Card>
      ))}
    </>
  );
}
