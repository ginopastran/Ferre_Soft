import { Card, CardContent } from "@/components/ui/card";
import { Package2, Hash, Tag, DollarSign, Percent } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";

interface Producto {
  id: number;
  codigo: string;
  descripcion: string;
  precioFinal1: number;
  iva: number;
  imagenUrl?: string;
  rubro: string;
}

interface CatalogoCardProps {
  producto: Producto;
}

export function CatalogoCard({ producto }: CatalogoCardProps) {
  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="flex justify-center items-center">
          {producto.imagenUrl ? (
            <div className="relative w-40 h-40">
              <img
                src={producto.imagenUrl}
                alt={producto.descripcion}
                className="object-cover rounded-md"
              />
            </div>
          ) : (
            <div className="w-40 h-40 bg-gray-100 rounded-md flex items-center justify-center">
              <Package2 className="h-20 w-20 text-gray-400" />
            </div>
          )}
        </div>

        <div className="mt-4">
          <h3 className="text-xl font-semibold text-indigo-600 mb-2">
            {producto.descripcion}
          </h3>

          <div className="space-y-2">
            <div className="flex items-center text-sm">
              <Hash className="h-4 w-4 mr-2 text-muted-foreground" />
              <span className="text-muted-foreground">Código:</span>
              <span className="ml-2">{producto.codigo}</span>
            </div>

            <div className="flex items-center text-sm">
              <Tag className="h-4 w-4 mr-2 text-muted-foreground" />
              <span className="text-muted-foreground">Rubro:</span>
              <span className="ml-2">{producto.rubro}</span>
            </div>

            <div className="flex items-center text-sm">
              <Percent className="h-4 w-4 mr-2 text-muted-foreground" />
              <span className="text-muted-foreground">IVA:</span>
              <span className="ml-2">{producto.iva}%</span>
            </div>

            <div className="flex items-center text-sm">
              <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
              <span className="text-muted-foreground">Precio:</span>
              <span className="ml-2 font-semibold">
                {formatCurrency(producto.precioFinal1)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
