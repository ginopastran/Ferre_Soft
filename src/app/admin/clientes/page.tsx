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
  ArrowRight,
  CreditCard,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState, useEffect, Suspense } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClientDialog } from "./components/ClientDialog";
import { formatDNI, formatPhoneNumber } from "@/lib/utils/format";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ClientsGridSkeleton } from "./components/ClientsGridSkeleton";

interface Cliente {
  id: number;
  codigo: string;
  nombre: string;
  direccion: string;
  pais: string;
  provincia: string;
  localidad: string;
  situacionIVA: string;
  cuitDni: string;
  telefono?: string;
  email?: string;
  creadoEn: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface ClientesResponse {
  clientes: Cliente[];
  pagination: PaginationInfo;
}

function ClientesContent() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Cliente[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [searchTerm, setSearchTerm] = useState(
    searchParams?.get("search") || ""
  );
  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams?.get("page") || "1", 10)
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
    fetchClients();
  }, [currentPage, searchTerm]);

  useEffect(() => {
    // Get search and page from URL when component mounts
    const searchFromUrl = searchParams?.get("search") || "";
    const pageFromUrl = parseInt(searchParams?.get("page") || "1", 10);
    setSearchTerm(searchFromUrl);
    setCurrentPage(pageFromUrl);
  }, [searchParams]);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
      });

      if (searchTerm) {
        params.append("search", searchTerm);
      }

      const response = await fetch(`/api/clientes?${params.toString()}`);
      if (!response.ok) throw new Error("Error al cargar clientes");

      const data: ClientesResponse = await response.json();
      setClients(data.clientes);
      setPagination(data.pagination);
    } catch (error) {
      toast.error("Error al cargar los clientes");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (codigo: string) => {
    router.push(`/admin/clientes/${codigo}`);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page on search
    setUrlParam("search", value || null);
    setUrlParam("page", value ? null : "1"); // Reset page if searching
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    setUrlParam("page", newPage === 1 ? null : newPage.toString());
  };

  const handleCreateClient = async (clientData: any) => {
    try {
      const response = await fetch("/api/clientes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(clientData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al crear el cliente");
      }

      await fetchClients(); // Recargar la lista
      toast.success("Cliente creado exitosamente");
      return Promise.resolve();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Error al crear el cliente");
      }
      return Promise.reject(error);
    }
  };

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h2 className="text-3xl font-bold tracking-tight text-cyan-gradient">
            Listado de Clientes
          </h2>
        </div>
      </header>
      <div className="h-full flex-1 flex-col space-y-2 p-8 flex max-w-[100vw]">
        <div className="flex gap-4 mb-6 items-center">
          <div className="relative flex-grow">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar clientes..."
              className="pl-8 w-full md:w-1/2 shadow-md"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="bg-cyan-gradient shadow-md"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar Cliente
          </Button>
        </div>

        {/* Información de paginación */}
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-muted-foreground">
            Mostrando {(pagination.page - 1) * pagination.limit + 1} a{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} de{" "}
            {pagination.total} clientes
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {loading ? (
            <ClientsGridSkeleton />
          ) : clients.length === 0 ? (
            <div className="col-span-full text-center py-8">
              <p className="text-muted-foreground">
                {searchTerm
                  ? "No se encontraron clientes con ese criterio"
                  : "No hay clientes registrados"}
              </p>
            </div>
          ) : (
            clients.map((client) => (
              <Card key={client.codigo} className="w-full">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-2xl font-semibold text-cyan-gradient">
                      {client.nombre}
                    </h2>
                    <Badge
                      variant="secondary"
                      className="bg-cyan-gradient text-white text-sm"
                    >
                      {client.codigo}
                    </Badge>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-sm">{client.direccion}</span>
                    </div>
                    <div className="flex items-center">
                      <CreditCard className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-sm">
                        {formatDNI(client.cuitDni)}
                      </span>
                    </div>
                    {client.telefono && (
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm">
                          {formatPhoneNumber(client.telefono)}
                        </span>
                      </div>
                    )}
                    {client.email && (
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm">{client.email}</span>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    className="w-full bg-cyan-gradient text-white hover:text-white"
                    onClick={() => handleViewDetails(client.codigo)}
                  >
                    Ver detalles
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Paginación */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-center space-x-1 mt-8">
            {/* Botón flecha izquierda (anterior) */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={!pagination.hasPrev}
              className="px-2"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* Primera página (siempre visible si no es la página 1) */}
            {pagination.page > 1 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(1)}
                  className="px-3"
                >
                  1
                </Button>
                {pagination.page > 3 && (
                  <span className="px-2 text-muted-foreground">...</span>
                )}
              </>
            )}

            {/* Páginas alrededor de la actual */}
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(3, pagination.pages) }, (_, i) => {
                let pageNum;
                if (pagination.pages <= 3) {
                  pageNum = i + 1;
                } else if (pagination.page === 1) {
                  pageNum = i + 1;
                } else if (pagination.page === pagination.pages) {
                  pageNum = pagination.pages - 2 + i;
                } else {
                  pageNum = pagination.page - 1 + i;
                }

                // No mostrar si es la primera página (ya se muestra arriba)
                if (pageNum === 1 && pagination.page > 1) return null;
                // No mostrar si es la última página (se muestra abajo)
                if (
                  pageNum === pagination.pages &&
                  pagination.page < pagination.pages
                )
                  return null;

                return (
                  <Button
                    key={pageNum}
                    variant={
                      pageNum === pagination.page ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 ${
                      pageNum === pagination.page ? "bg-cyan-gradient" : ""
                    }`}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            {/* Última página (siempre visible si no es la página actual) */}
            {pagination.page < pagination.pages && (
              <>
                {pagination.page < pagination.pages - 2 && (
                  <span className="px-2 text-muted-foreground">...</span>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.pages)}
                  className="px-3"
                >
                  {pagination.pages}
                </Button>
              </>
            )}

            {/* Botón flecha derecha (siguiente) */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={!pagination.hasNext}
              className="px-2"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <ClientDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={handleCreateClient}
      />
    </>
  );
}

export default function ClientesPage() {
  return (
    <SidebarProvider>
      <AppSidebar activeUrl="/admin/clientes" />
      <SidebarInset>
        <Suspense fallback={<ClientsGridSkeleton />}>
          <ClientesContent />
        </Suspense>
      </SidebarInset>
    </SidebarProvider>
  );
}
