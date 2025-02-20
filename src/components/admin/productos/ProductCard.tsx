import { Product } from "@/types/product";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package2, Hash, Barcode, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils/format";

interface ProductCardProps {
  product: Product;
  onViewDetails: (id: number) => void;
}

export function ProductCard({ product, onViewDetails }: ProductCardProps) {
  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="flex justify-center items-center">
          {product.imagenUrl && (
            <div className="relative w-40 h-40 items-center">
              <img
                src={product.imagenUrl?.toString()}
                alt={product.descripcion.toString()}
                className="object-cover rounded-md"
              />
            </div>
          )}
        </div>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-semibold text-indigo-gradient">
              {product.descripcion}
            </h2>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center">
            <Hash className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>Código: {product.codigo}</span>
          </div>
          <div className="flex items-center">
            <Barcode className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>Código Proveedor: {product.codigoProveedor}</span>
          </div>
          <div className="flex items-center">
            <Archive className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>Stock: {product.stock} unidades</span>
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full bg-indigo-gradient text-white hover:text-white"
          onClick={() => onViewDetails(product.id)}
        >
          Ver detalles
          <Package2 className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}
