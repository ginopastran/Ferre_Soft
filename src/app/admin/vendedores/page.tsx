"use client";

import { AppSidebar } from "@/components/admin/app-sidebar";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { SellerTableSkeleton } from "@/components/admin/vendedores/SellerTableSkeleton";
import {
  Plus,
  DollarSign,
  CreditCard,
  Mail,
  Phone,
  Search,
  X,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";
import { VendedorDialog } from "./components/VendedorDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2 } from "lucide-react";
import { PagoVendedorDialog } from "./components/PagoVendedorDialog";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";

interface Vendedor {
  id: number;
  nombre: string;
  email: string;
  dni: string;
  telefono: string | null;
  comision: number;
  totalVentas: number;
  totalPagado: number;
  montoPendiente: number;
  sucursal: {
    id: number;
    nombre: string;
  } | null;
}

interface Sucursal {
  id: number;
  nombre: string;
}

function VendedoresContent() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [filteredVendedores, setFilteredVendedores] = useState<Vendedor[]>([]);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [searchTerm, setSearchTerm] = useState(
    searchParams?.get("search") || ""
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
    fetchVendedores();
    fetchSucursales();
  }, []);

  useEffect(() => {
    // Get search from URL when component mounts
    const searchFromUrl = searchParams?.get("search") || "";
    setSearchTerm(searchFromUrl);
  }, [searchParams]);

  // Update filtered vendedores when search term or vendedores change
  useEffect(() => {
    const results = vendedores.filter((vendedor) =>
      Object.values({
        nombre: vendedor.nombre,
        email: vendedor.email,
        dni: vendedor.dni,
        telefono: vendedor.telefono || "",
        sucursal: vendedor.sucursal?.nombre || "",
      }).some((value) =>
        value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
    setFilteredVendedores(results);
  }, [searchTerm, vendedores]);

  const fetchVendedores = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/usuarios?includeVentas=true");
      if (!response.ok) throw new Error("Error al cargar vendedores");
      const data = await response.json();
      setVendedores(data);
      setFilteredVendedores(data);
    } catch (error) {
      toast.error("Error al cargar los vendedores");
    } finally {
      setLoading(false);
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

  const handleSucursalChange = async (
    vendedorId: number,
    sucursalId: string
  ) => {
    try {
      const response = await fetch(`/api/usuarios/${vendedorId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sucursalId: parseInt(sucursalId) }),
      });

      if (!response.ok) throw new Error("Error al actualizar vendedor");

      const vendedorActualizado = await response.json();
      setVendedores(
        vendedores.map((v) => (v.id === vendedorId ? vendedorActualizado : v))
      );
      toast.success("Sucursal actualizada exitosamente");
    } catch (error) {
      toast.error("Error al actualizar la sucursal");
    }
  };

  const handleCreateVendedor = async (data: any) => {
    try {
      const response = await fetch("/api/usuarios", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al crear el vendedor");
      }

      await fetchVendedores();
      setIsDialogOpen(false);
      toast.success("Vendedor creado exitosamente");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Error al crear el vendedor");
      }
    }
  };

  const handleUpdateComision = async (vendedorId: number, comision: number) => {
    try {
      const response = await fetch(`/api/usuarios/${vendedorId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comision }),
      });

      if (!response.ok) throw new Error("Error al actualizar comisión");
      await fetchVendedores();
      toast.success("Comisión actualizada exitosamente");
    } catch (error) {
      toast.error("Error al actualizar la comisión");
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setUrlParam("search", value || null);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setUrlParam("search", null);
  };

  return (
    <>
      <header className="flex h-12 md:h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-2 md:px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-1 md:mr-2 h-4" />
          <h2 className="text-3xl font-bold tracking-tight text-indigo-gradient">
            Vendedores
          </h2>
        </div>
      </header>
      <div className="h-full flex-1 flex-col space-y-8 p-4 md:p-8 flex">
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex md:flex-row flex-col w-full md:w-1/2 items-start md:items-center gap-2">
              <div className="relative flex-grow w-full">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar por nombre, email, DNI, sucursal..."
                  className="pl-8 w-full"
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
              {searchTerm && (
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
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="bg-indigo-gradient"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Vendedor
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {loading ? (
            <>
              {[...Array(6)].map((_, index) => (
                <SellerTableSkeleton key={index} />
              ))}
            </>
          ) : filteredVendedores.length > 0 ? (
            filteredVendedores.map((vendedor) => (
              <Card key={vendedor.id} className="w-full">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-2xl font-semibold text-indigo-gradient">
                        {vendedor.nombre}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {vendedor.sucursal?.nombre || "Sin sucursal asignada"}
                      </p>
                    </div>
                    <Select
                      value={vendedor.sucursal?.id?.toString()}
                      onValueChange={(value) =>
                        handleSucursalChange(vendedor.id, value)
                      }
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Sucursal" />
                      </SelectTrigger>
                      <SelectContent>
                        {sucursales.map((sucursal) => (
                          <SelectItem
                            key={sucursal.id}
                            value={sucursal.id.toString()}
                          >
                            {sucursal.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center">
                      <CreditCard className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{vendedor.dni}</span>
                    </div>
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{vendedor.email}</span>
                    </div>
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{vendedor.telefono || "-"}</span>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-muted-foreground">
                          Comisión
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            className="w-20 p-1 border rounded"
                            value={vendedor.comision}
                            onChange={(e) =>
                              handleUpdateComision(
                                vendedor.id,
                                parseFloat(e.target.value)
                              )
                            }
                            step="0.01"
                            min="0"
                            max="100"
                          />
                          <span>%</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground">
                          Total Ventas
                        </label>
                        <p className="font-semibold">
                          {formatCurrency(vendedor.totalVentas)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <label className="text-sm text-muted-foreground">
                        A Pagar
                      </label>
                      <p className="font-semibold text-lg text-indigo-600">
                        {formatCurrency(vendedor.montoPendiente)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Total pagado: {formatCurrency(vendedor.totalPagado)}
                      </p>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <Button
                        onClick={() => {
                          router.push(`/admin/vendedores/${vendedor.id}`);
                        }}
                        className="bg-indigo-gradient"
                      >
                        <DollarSign className="h-4 w-4 mr-2" />
                        Ver Detalles
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center text-muted-foreground">
              No se encontraron vendedores
            </div>
          )}
        </div>
      </div>

      <VendedorDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={handleCreateVendedor}
        sucursales={sucursales}
      />
    </>
  );
}

export default function VendedoresPage() {
  return (
    <SidebarProvider>
      <AppSidebar activeUrl="/admin/vendedores" />
      <SidebarInset>
        <VendedoresContent />
      </SidebarInset>
    </SidebarProvider>
  );
}
