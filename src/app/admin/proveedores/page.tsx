"use client";

import { AppSidebar } from "@/components/admin/app-sidebar";
import { Button } from "@/components/ui/button";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Filter,
  List,
  Plus,
  X,
  Building2,
  Mail,
  Phone,
  ArrowRight,
  DollarSign,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Separator } from "@/components/ui/separator";
import { ProveedorDialog } from "../productos/components/ProveedorDialog";
import { Input } from "@/components/ui/input";
import { useRouter, usePathname } from "next/navigation";
import { useUrlParams } from "@/hooks/useUrlParams";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPhoneNumber } from "@/lib/utils/format";
import { ActualizarPreciosDialog } from "./components/ActualizarPreciosDialog";

interface Proveedor {
  id: number;
  nombre: string;
  createdAt: Date;
  codigo?: string;
  telefono?: string;
  email?: string;
}

export default function ProveedoresPage() {
  const { setUrlParam, getUrlParam } = useUrlParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [isSortDialogOpen, setIsSortDialogOpen] = useState(false);
  const [isActualizarPreciosOpen, setIsActualizarPreciosOpen] = useState(false);

  useEffect(() => {
    fetchProveedores();
  }, []);

  const fetchProveedores = async () => {
    try {
      const response = await fetch("/api/proveedores");
      const data = await response.json();
      setProveedores(data);
    } catch (error) {
      console.error("Error al cargar proveedores:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProveedor = async (data: { nombre: string }) => {
    try {
      const response = await fetch("/api/proveedores", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Error al crear el proveedor");
      await fetchProveedores();
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setUrlParam("search", value || null);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setSortField("createdAt");
    setSortOrder("desc");

    const params = new URLSearchParams();
    router.push(`${pathname}?${params.toString()}`);
  };

  const filteredProveedores = proveedores.filter((proveedor) =>
    proveedor.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <SidebarProvider>
      <AppSidebar activeUrl="/admin/proveedores" />
      <SidebarInset>
        <header className="flex h-12 md:h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-2 md:px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-1 md:mr-2 h-4" />
            <h2 className="text-3xl font-bold tracking-tight text-indigo-gradient">
              Proveedores
            </h2>
          </div>
        </header>

        <div className="h-full flex-1 flex-col space-y-4 md:space-y-8 p-4 md:p-8 flex max-w-[100vw]">
          <div className="space-y-4 w-full">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex flex-1 w-full items-center gap-2 flex-wrap">
                <Input
                  placeholder="Buscar por nombre..."
                  className="w-full md:max-w-[600px]"
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                />

                <div className="flex items-center gap-2 w-full md:w-auto">
                  {searchTerm && (
                    <Button
                      variant="ghost"
                      onClick={handleClearFilters}
                      className="h-8 px-2 lg:px-3 text-xs md:text-sm"
                    >
                      Limpiar
                      <X className="ml-1 md:ml-2 h-3 w-3 md:h-4 md:w-4" />
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsSortDialogOpen(true)}
                    className="text-xs md:text-sm"
                  >
                    <List className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
                    Ordenar
                  </Button>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setIsActualizarPreciosOpen(true)}
                  className="bg-indigo-gradient"
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Actualizar Precios
                </Button>
                <Button
                  onClick={() => setIsDialogOpen(true)}
                  className="bg-indigo-gradient"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Proveedor
                </Button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {loading ? (
                // Aquí podrías agregar un skeleton loader
                <div>Cargando...</div>
              ) : (
                filteredProveedores.map((proveedor) => (
                  <Card key={proveedor.id} className="w-full">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <h2 className="text-2xl font-semibold text-indigo-gradient">
                          {proveedor.nombre}
                        </h2>
                        <Badge
                          variant="secondary"
                          className="bg-indigo-gradient text-white text-sm"
                        >
                          #{proveedor.id}
                        </Badge>
                      </div>
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center">
                          <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>Proveedor</span>
                        </div>
                        {proveedor.telefono && (
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span>{formatPhoneNumber(proveedor.telefono)}</span>
                          </div>
                        )}
                        {proveedor.email && (
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span>{proveedor.email}</span>
                          </div>
                        )}
                        <div className="flex items-center text-sm text-muted-foreground">
                          <span>
                            Creado el:{" "}
                            {new Date(proveedor.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full bg-indigo-gradient text-white hover:text-white"
                        onClick={() =>
                          router.push(`/admin/proveedores/${proveedor.id}`)
                        }
                      >
                        Ver detalles
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>

        <ProveedorDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onSubmit={handleCreateProveedor}
        />

        <ActualizarPreciosDialog
          open={isActualizarPreciosOpen}
          onOpenChange={setIsActualizarPreciosOpen}
          proveedores={proveedores}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}
