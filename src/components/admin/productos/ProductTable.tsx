import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Product } from "@/types/product";
import { ProductTableRow } from "./ProductTableRow";
import { Separator } from "@/components/ui/separator";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationLink,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
import { Loader } from "lucide-react";
import { ProductTableSkeleton } from "./ProductTableSkeleton";

interface ProductTableProps {
  products: Product[];
  loading: boolean;
  onDelete: (id: number) => void;
  savedFields: { [key: string]: boolean };
  onInputChange: (id: number, field: string, value: string) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  productsPerPage: number;
  totalProducts: number;
}

export const ProductTable: React.FC<ProductTableProps> = ({
  products,
  loading,
  onDelete,
  savedFields,
  onInputChange,
  currentPage,
  setCurrentPage,
  productsPerPage,
  totalProducts,
}) => {
  if (loading) {
    return (
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead>Tipo de medida</TableHead>
              <TableHead>Costo U/Kg</TableHead>
              <TableHead>Margen %</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <ProductTableSkeleton />
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Producto</TableHead>
            <TableHead>Tipo de medida</TableHead>
            <TableHead>Costo U/Kg</TableHead>
            <TableHead>Margen %</TableHead>
            <TableHead>Precio</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.length > 0 ? (
            products.map((product) => (
              <ProductTableRow
                key={product.id}
                product={product}
                savedFields={savedFields}
                onInputChange={onInputChange}
                onDelete={onDelete}
              />
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="text-center">
                No hay productos que coincidan con los filtros.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Paginación */}
      {products.length > 0 && (
        <>
          <Separator />
          <Pagination className="my-4">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  className={cn(
                    currentPage === 1 && "pointer-events-none opacity-50"
                  )}
                />
              </PaginationItem>

              {Array.from(
                {
                  length: Math.min(
                    5,
                    Math.ceil(totalProducts / productsPerPage)
                  ),
                },
                (_, i) => (
                  <PaginationItem key={i + 1}>
                    <PaginationLink
                      onClick={() => setCurrentPage(i + 1)}
                      isActive={currentPage === i + 1}
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}

              {Math.ceil(totalProducts / productsPerPage) > 5 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}

              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    setCurrentPage(
                      Math.min(
                        Math.ceil(totalProducts / productsPerPage),
                        currentPage + 1
                      )
                    )
                  }
                  className={cn(
                    currentPage ===
                      Math.ceil(totalProducts / productsPerPage) &&
                      "pointer-events-none opacity-50"
                  )}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </>
      )}
    </div>
  );
};
