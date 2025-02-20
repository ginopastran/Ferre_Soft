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

interface Vendedor {
  id: number;
  nombre: string;
  email: string;
  dni: string;
  telefono: string | null;
  sucursal: {
    id: number;
    nombre: string;
  } | null;
}

interface Sucursal {
  id: number;
  nombre: string;
}

export default function VendedoresPage() {
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVendedores();
    fetchSucursales();
  }, []);

  const fetchVendedores = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/usuarios");
      if (!response.ok) throw new Error("Error al cargar vendedores");
      const data = await response.json();
      setVendedores(data);
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

  return (
    <SidebarProvider>
      <AppSidebar activeUrl="/admin/vendedores" />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <h2 className="text-3xl font-bold tracking-tight text-indigo-gradient">
              Vendedores
            </h2>
          </div>
        </header>
        <div className="h-full flex-1 flex-col space-y-8 p-8 flex max-w-[100vw]">
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>DNI</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Sucursal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <SellerTableSkeleton />
                ) : (
                  vendedores.map((vendedor) => (
                    <TableRow key={vendedor.id}>
                      <TableCell>{vendedor.nombre}</TableCell>
                      <TableCell>{vendedor.dni}</TableCell>
                      <TableCell>{vendedor.email}</TableCell>
                      <TableCell>{vendedor.telefono || "-"}</TableCell>
                      <TableCell>
                        <Select
                          value={vendedor.sucursal?.id.toString()}
                          onValueChange={(value) =>
                            handleSucursalChange(vendedor.id, value)
                          }
                        >
                          <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Seleccionar sucursal" />
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
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
