"use client";

import { AppSidebar } from "@/components/admin/app-sidebar";
import { Button } from "@/components/ui/button";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Plus, Search, Filter, X, Link } from "lucide-react";
import { useState, useEffect } from "react";
import { FacturaDialog } from "./components/FacturaDialog";
import { FacturaCard } from "@/components/admin/ventas/FacturaCard";
import { FacturaSkeleton } from "@/components/admin/ventas/FacturaSkeleton";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Suspense } from "react";

interface Factura {
  id: string;
  numero: string;
  fecha: Date;
  vendedorId: number;
  clienteId: number;
  tipoComprobante: string;
  total: number;
  pagado: number;
  estado: string;
  cliente: {
    nombre: string;
  };
  vendedor: {
    nombre: string;
  };
}

interface FacturasResponse {
  facturas: Factura[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

function VentasContent() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [filteredFacturas, setFilteredFacturas] = useState<Factura[]>([]);
  const { user } = useAuth();
  const isAdmin = user?.rol?.nombre === "ADMIN";
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [searchTerm, setSearchTerm] = useState(
    searchParams?.get("search") || ""
  );
  const [filterStatus, setFilterStatus] = useState(
    searchParams?.get("status") || "all"
  );

  // Function to set URL parameters
  const setUrlParam = (name: string, value: string | null) => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    if (value) {
      params.set(name, value);
    } else {
      params.delete(name);
    }
    router.replace(`${pathname}?${params.toString()}`);
  };

  useEffect(() => {
    if (user) {
      fetchFacturas();
    }
  }, [user]);

  useEffect(() => {
    // Get search and filter from URL when component mounts
    const searchFromUrl = searchParams?.get("search") || "";
    const statusFromUrl = searchParams?.get("status") || "all";
    setSearchTerm(searchFromUrl);
    setFilterStatus(statusFromUrl);
  }, [searchParams]);

  // Update filtered facturas when search term, filter status, or facturas change
  useEffect(() => {
    // Asegurar que facturas es un array válido antes de filtrar
    if (!Array.isArray(facturas)) {
      console.warn("facturas no es un array:", facturas);
      setFilteredFacturas([]);
      return;
    }

    let results = facturas;

    // Apply status filter
    if (filterStatus !== "all") {
      results = results.filter((factura) => factura.estado === filterStatus);
    }

    // Apply search filter
    results = results.filter((factura) =>
      Object.values({
        numero: factura.numero,
        clienteNombre: factura.cliente.nombre,
        vendedorNombre: factura.vendedor?.nombre || "",
        total: factura.total.toString(),
        estado: factura.estado,
      }).some((value) =>
        value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );

    setFilteredFacturas(results);
  }, [searchTerm, filterStatus, facturas]);

  const fetchFacturas = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/facturas?userId=${user?.id}&role=${user?.rol?.nombre}`
      );
      if (!response.ok) throw new Error("Error al cargar facturas");
      const data: FacturasResponse | Factura[] = await response.json();

      // Manejar tanto la respuesta paginada como el formato legacy
      if (Array.isArray(data)) {
        // Formato legacy - array directo
        setFacturas(data);
        setFilteredFacturas(data);
      } else if (data && typeof data === "object" && "facturas" in data) {
        // Formato paginado - extraer el array de facturas
        const facturasArray = data.facturas || [];
        setFacturas(facturasArray);
        setFilteredFacturas(facturasArray);
      } else {
        console.error("Formato de respuesta inesperado:", data);
        setFacturas([]);
        setFilteredFacturas([]);
      }
    } catch (error) {
      console.error("Error al cargar facturas:", error);
      toast.error("Error al cargar las facturas");
      setFacturas([]);
      setFilteredFacturas([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFactura = async (data: any) => {
    try {
      const response = await fetch("/api/facturas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al crear la factura");
      }

      await fetchFacturas();
      setIsDialogOpen(false);
      toast.success("Factura creada exitosamente");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Error al crear la factura");
      }
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setUrlParam("search", value || null);
  };

  const handleFilterStatus = (status: string) => {
    setFilterStatus(status);
    setUrlParam("status", status === "all" ? null : status);
  };

  const handleClearFilters = () => {
    setFilterStatus("all");
    setUrlParam("status", null);
  };

  return (
    <>
      <header className="flex h-12 md:h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-2 md:px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-1 md:mr-2 h-4" />
          <h2 className="text-3xl font-bold tracking-tight text-cyan-gradient">
            Ventas
          </h2>
          <Button
            variant="outline"
            size="sm"
            className="ml-auto mr-4 bg-cyan-gradient text-white hover:text-white shadow-md"
            onClick={() => {
              const catalogoUrl = `${window.location.origin}/catalogo`;
              if (navigator.share) {
                navigator
                  .share({
                    title: "Catálogo de Productos",
                    url: catalogoUrl,
                  })
                  .catch((error) =>
                    toast.error("Error al compartir: " + error)
                  );
              } else {
                navigator.clipboard.writeText(catalogoUrl);
                toast.success("Enlace copiado al portapapeles");
              }
            }}
          >
            Compartir catálogo
            <Link className=" h-4 w-4" />
          </Button>
        </div>
      </header>
      <div className="h-full flex-1 flex-col space-y-8 p-4 md:p-8 flex">
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex md:flex-row flex-col w-full md:w-1/2 items-start md:items-center gap-2">
              <div className="relative flex-grow w-full">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground " />
                <Input
                  type="search"
                  placeholder="Buscar por número, cliente, vendedor..."
                  className="pl-8 w-full shadow-md"
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs md:text-sm shadow-md"
                    >
                      <Filter className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
                      Filtrar
                      {filterStatus !== "all" && (
                        <span className="ml-1 md:ml-2">
                          {filterStatus === "PAGADA" ? "Pagadas" : "Pendientes"}
                        </span>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[200px]">
                    <DropdownMenuItem onClick={() => handleFilterStatus("all")}>
                      Todas
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleFilterStatus("PAGADA")}
                    >
                      Pagadas
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleFilterStatus("PENDIENTE")}
                    >
                      Pendientes
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {filterStatus !== "all" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearFilters}
                    className="h-8 px-2 lg:px-3 text-xs md:text-sm"
                  >
                    Limpiar
                    <X className="ml-1 md:ml-2 h-3 w-3 md:h-4 md:w-4" />
                  </Button>
                )}
              </div>
            </div>
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="bg-cyan-gradient shadow-md"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Venta
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {loading ? (
            <>
              {[...Array(6)].map((_, index) => (
                <FacturaSkeleton key={index} />
              ))}
            </>
          ) : filteredFacturas.length > 0 ? (
            filteredFacturas.map((factura) => (
              <FacturaCard
                key={factura.id}
                factura={factura}
                showVendedor={isAdmin}
                onViewDetails={(id) => {
                  router.push(`/admin/ventas/${factura.numero}`);
                }}
                onUpdate={fetchFacturas}
              />
            ))
          ) : (
            <div className="col-span-full text-center text-muted-foreground">
              No se encontraron facturas
            </div>
          )}
        </div>
      </div>

      <FacturaDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={handleCreateFactura}
      />
    </>
  );
}

export default function VentasPage() {
  return (
    <SidebarProvider>
      <AppSidebar activeUrl="/admin/ventas" />
      <SidebarInset>
        <Suspense fallback={<div>Cargando...</div>}>
          <VentasContent />
        </Suspense>
      </SidebarInset>
    </SidebarProvider>
  );
}
