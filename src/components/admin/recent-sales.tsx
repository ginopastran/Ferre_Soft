import { useEffect, useState } from "react";
import { RecentSalesSkeleton } from "@/components/admin/reporte/RecentSalesSkeleton";
import { useAuth } from "@/contexts/AuthContext";

interface ProductSales {
  id: number;
  nombre: string;
  tipoMedida: string;
  cantidadTotal: number;
  ventaTotal: number;
}

export function RecentSales() {
  const [topProducts, setTopProducts] = useState<ProductSales[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchTopProducts = async () => {
      if (!user) return;

      setLoading(true);
      try {
        const response = await fetch(
          `/api/facturas?userId=${user.id}&role=${user.rol.nombre}`
        );
        if (!response.ok) {
          throw new Error("Error al obtener facturas");
        }
        const facturas = await response.json();

        // Crear un mapa para acumular ventas por producto
        const productSalesMap = new Map<number, ProductSales>();

        // Procesar cada factura y sus detalles
        facturas.forEach((factura: any) => {
          factura.detalles?.forEach((detalle: any) => {
            const { producto, cantidad, subtotal } = detalle;
            if (!producto) return;

            const productoId = producto.id;

            if (productSalesMap.has(productoId)) {
              const currentStats = productSalesMap.get(productoId)!;
              currentStats.cantidadTotal += cantidad;
              currentStats.ventaTotal += subtotal;
            } else {
              productSalesMap.set(productoId, {
                id: productoId,
                nombre: producto.descripcion,
                tipoMedida: "U",
                cantidadTotal: cantidad,
                ventaTotal: subtotal,
              });
            }
          });
        });

        // Convertir el mapa a array y ordenar por venta total
        const sortedProducts = Array.from(productSalesMap.values())
          .sort((a, b) => b.ventaTotal - a.ventaTotal)
          .slice(0, 5); // Tomar los top 5

        setTopProducts(sortedProducts);
      } catch (error) {
        console.error("Error al obtener los productos más vendidos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopProducts();
  }, [user]);

  if (loading) return <RecentSalesSkeleton />;

  return (
    <div className="space-y-8">
      {topProducts.map((product) => (
        <div key={product.id} className="flex items-center">
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">{product.nombre}</p>
            <p className="text-sm text-muted-foreground">
              {product.cantidadTotal.toFixed(2)} {product.tipoMedida} vendidos
            </p>
          </div>
          <div className="ml-auto font-medium">
            +${product.ventaTotal.toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}
