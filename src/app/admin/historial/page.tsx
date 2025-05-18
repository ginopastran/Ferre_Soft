"use client";

import { AppSidebar } from "@/components/admin/app-sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronDown, ChevronUp, Download, Search, X } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { FilterDialog } from "@/components/admin/historial/FilterDialog";
import React from "react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
import { OrderTableSkeleton } from "@/components/admin/historial/OrderTableSkeleton";
import { Suspense } from "react";

interface DetalleOrden {
  id: number;
  cantidad: number;
  subtotal: number;
  precioHistorico: number;
  producto: {
    id: number;
    nombre: string;
    tipoMedida: string;
  };
}

interface Orden {
  id: number;
  fecha: Date;
  total: number;
  metodoPago: string;
  estado: string;
  vendedor: {
    id: number;
    nombre: string;
  };
  sucursal: {
    id: number;
    nombre: string;
  };
  detalles: DetalleOrden[];
}

function HistorialContent() {
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [vendedores, setVendedores] = useState<
    { id: number; nombre: string }[]
  >([]);
  const [sucursales, setSucursales] = useState<
    { id: number; nombre: string }[]
  >([]);
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;
  const [loading, setLoading] = useState(true);

  const search = searchParams?.get("search") || "";
  const vendedor = searchParams?.get("vendedor") || "all";
  const sucursal = searchParams?.get("sucursal") || "all";

  const setUrlParam = (param: string, value: string | null) => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    if (value) {
      params.set(param, value);
    } else {
      params.delete(param);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleClearFilters = () => {
    router.push(pathname || "/");
    setIsFilterDialogOpen(false);
  };

  useEffect(() => {
    fetchVendedores();
    fetchSucursales();
  }, []);

  const fetchVendedores = async () => {
    try {
      const response = await fetch("/api/usuarios");
      if (!response.ok) throw new Error("Error al cargar vendedores");
      const data = await response.json();
      setVendedores(data);
    } catch (error) {
      toast.error("Error al cargar los vendedores");
    }
  };

  const fetchSucursales = async () => {
    try {
      const response = await fetch("/api/sucursales");
      if (!response.ok) throw new Error("Error al cargar sucursales");
      const data = await response.json();
      setSucursales(data);
    } catch (error) {
      toast.error("Error al cargar las sucursales");
    }
  };

  useEffect(() => {
    fetchOrdenes();
  }, [search, vendedor, sucursal]);

  const fetchOrdenes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (vendedor !== "all") params.append("vendedor", vendedor);
      if (sucursal !== "all") params.append("sucursal", sucursal);

      const response = await fetch(`/api/ordenes?${params.toString()}`);
      if (!response.ok) throw new Error("Error al cargar órdenes");
      const data = await response.json();
      setOrdenes(data);
    } catch (error) {
      toast.error("Error al cargar el historial");
    } finally {
      setLoading(false);
    }
  };

  const toggleRow = (id: number) => {
    const newExpandedRows = new Set(expandedRows);
    if (expandedRows.has(id)) {
      newExpandedRows.delete(id);
    } else {
      newExpandedRows.add(id);
    }
    setExpandedRows(newExpandedRows);
  };

  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = ordenes.slice(indexOfFirstOrder, indexOfLastOrder);

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h2 className="text-3xl font-bold tracking-tight text-cyan-gradient">
            Historial de Ventas
          </h2>
        </div>
      </header>
      <div className="h-full flex-1 flex-col space-y-8 p-8 max-w-[100vw]">
        <div className="w-full mx-auto">
          <div className="flex justify-start items-center mb-8 gap-4">
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
              <Input
                className="pl-12 h-12 text-lg"
                placeholder="Buscar por número, vendedor o sucursal..."
                value={search}
                onChange={(e) => setUrlParam("search", e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setIsFilterDialogOpen(true)}
              >
                Filtrar
              </Button>
              {(search || vendedor !== "all" || sucursal !== "all") && (
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={handleClearFilters}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Limpiar filtros
                </Button>
              )}
            </div>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="py-5 text-base">Orden #</TableHead>
                  <TableHead className="py-5 text-base">Fecha</TableHead>
                  <TableHead className="py-5 text-base">Vendedor</TableHead>
                  <TableHead className="py-5 text-base">Sucursal</TableHead>
                  <TableHead className="py-5 text-base">
                    Método de Pago
                  </TableHead>
                  <TableHead className="py-5 text-base">Total</TableHead>
                  <TableHead className="py-5 text-base">Detalles</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <OrderTableSkeleton />
                ) : (
                  currentOrders.map((orden) => (
                    <React.Fragment key={orden.id}>
                      <TableRow
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => toggleRow(orden.id)}
                      >
                        <TableCell className="py-4 text-base font-medium">
                          #{orden.id}
                        </TableCell>
                        <TableCell className="py-4 text-base">
                          {new Date(orden.fecha).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="py-4 text-base">
                          {orden.vendedor.nombre}
                        </TableCell>
                        <TableCell className="py-4 text-base">
                          {orden.sucursal.nombre}
                        </TableCell>
                        <TableCell className="py-4 text-base capitalize">
                          {orden.metodoPago}
                        </TableCell>
                        <TableCell className="py-4 text-base">
                          ${orden.total}
                        </TableCell>
                        <TableCell className="py-4">
                          <Button variant="ghost" size="sm">
                            Ver{" "}
                            {expandedRows.has(orden.id) ? (
                              <ChevronUp className="ml-2 w-4 h-4" />
                            ) : (
                              <ChevronDown className="ml-2 w-4 h-4" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                      {expandedRows.has(orden.id) && (
                        <TableRow key={`expanded-${orden.id}`}>
                          <TableCell colSpan={7}>
                            <div className="bg-muted/30 p-6 rounded-lg mx-4 mb-4">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="text-base">
                                      Producto
                                    </TableHead>
                                    <TableHead className="text-base">
                                      Cantidad (Kg/U)
                                    </TableHead>
                                    <TableHead className="text-base">
                                      Precio Kg/U.
                                    </TableHead>
                                    <TableHead className="text-base">
                                      Subtotal
                                    </TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {orden.detalles.map((detalle) => (
                                    <TableRow key={detalle.id}>
                                      <TableCell className="text-base">
                                        {detalle.producto.nombre}
                                      </TableCell>
                                      <TableCell className="text-base">
                                        {detalle.cantidad}{" "}
                                        {detalle.producto.tipoMedida === "Kg"
                                          ? "Kg"
                                          : "U"}
                                      </TableCell>
                                      <TableCell className="text-base">
                                        ${detalle.precioHistorico}
                                      </TableCell>
                                      <TableCell className="text-base">
                                        ${detalle.subtotal}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))
                )}
              </TableBody>
            </Table>
            <Separator />
            {ordenes.length > 0 && (
              <div className="p-4 flex justify-end">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() =>
                          setCurrentPage(Math.max(1, currentPage - 1))
                        }
                        className={cn(
                          currentPage === 1 && "pointer-events-none opacity-50"
                        )}
                      />
                    </PaginationItem>

                    {Array.from(
                      {
                        length: Math.min(
                          5,
                          Math.ceil(ordenes.length / ordersPerPage)
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

                    {Math.ceil(ordenes.length / ordersPerPage) > 5 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() =>
                          setCurrentPage(
                            Math.min(
                              Math.ceil(ordenes.length / ordersPerPage),
                              currentPage + 1
                            )
                          )
                        }
                        className={cn(
                          currentPage ===
                            Math.ceil(ordenes.length / ordersPerPage) &&
                            "pointer-events-none opacity-50"
                        )}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </div>
        </div>
      </div>
      <FilterDialog
        isOpen={isFilterDialogOpen}
        onClose={() => setIsFilterDialogOpen(false)}
        vendedores={vendedores}
        sucursales={sucursales}
        selectedVendedor={vendedor}
        selectedSucursal={sucursal}
        onVendedorChange={(value) => {
          setUrlParam("vendedor", value === "all" ? null : value);
        }}
        onSucursalChange={(value) => {
          setUrlParam("sucursal", value === "all" ? null : value);
        }}
      />
    </>
  );
}

export default function HistorialPage() {
  return (
    <SidebarProvider>
      <AppSidebar activeUrl="/admin/historial" />
      <SidebarInset>
        <Suspense fallback={<OrderTableSkeleton />}>
          <HistorialContent />
        </Suspense>
      </SidebarInset>
    </SidebarProvider>
  );
}
