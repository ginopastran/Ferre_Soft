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
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EditableInput } from "@/components/admin/productos/EditableInput";
import { BranchTableSkeleton } from "@/components/admin/sucursales/BranchTableSkeleton";

interface Sucursal {
  id: number;
  nombre: string;
  ubicacion: string;
}

export default function SucursalesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [nombre, setNombre] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [loading, setLoading] = useState(true);
  const [savedFields, setSavedFields] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchSucursales();
  }, []);

  const fetchSucursales = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/sucursales");
      if (!response.ok) throw new Error("Error al cargar sucursales");
      const data = await response.json();
      setSucursales(data);
    } catch (error) {
      toast.error("Error al cargar las sucursales");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !ubicacion) {
      toast.error("Todos los campos son requeridos");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/sucursales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, ubicacion }),
      });

      if (!response.ok) throw new Error("Error al crear la sucursal");

      await fetchSucursales();
      setIsDialogOpen(false);
      setNombre("");
      setUbicacion("");
      toast.success("Sucursal creada exitosamente");
    } catch (error) {
      toast.error("Error al crear la sucursal");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = async (
    sucursalId: number,
    field: "nombre" | "ubicacion",
    value: string
  ) => {
    const updatedSucursales = sucursales.map((s) =>
      s.id === sucursalId ? { ...s, [field]: value } : s
    );
    setSucursales(updatedSucursales);
    setSavedFields({ ...savedFields, [`${sucursalId}-${field}`]: true });

    try {
      const sucursal = updatedSucursales.find((s) => s.id === sucursalId);
      if (!sucursal) return;

      const response = await fetch(`/api/sucursales/${sucursalId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: sucursal.nombre,
          ubicacion: sucursal.ubicacion,
        }),
      });

      if (!response.ok) throw new Error("Error al actualizar sucursal");

      setTimeout(() => {
        setSavedFields((prev) => ({
          ...prev,
          [`${sucursalId}-${field}`]: false,
        }));
      }, 2000);
    } catch (error) {
      toast.error("Error al actualizar la sucursal");
    }
  };

  return (
    <>
      <SidebarProvider>
        <AppSidebar activeUrl="/admin/sucursales" />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <h2 className="text-3xl font-bold tracking-tight text-indigo-gradient">
                Sucursales
              </h2>
            </div>
          </header>
          <div className="h-full flex-1 flex-col space-y-8 p-8 flex max-w-[100vw]">
            <div className="flex items-center justify-end">
              <Button
                onClick={() => setIsDialogOpen(true)}
                className="bg-indigo-gradient"
              >
                <Plus className="mr-2 h-4 w-4" />
                Nueva Sucursal
              </Button>
            </div>

            <Separator />

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="py-5 text-base">ID</TableHead>
                    <TableHead className="py-5 text-base">Nombre</TableHead>
                    <TableHead className="py-5 text-base">Ubicación</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <BranchTableSkeleton />
                  ) : (
                    sucursales.map((sucursal) => (
                      <TableRow key={sucursal.id}>
                        <TableCell>{sucursal.id}</TableCell>
                        <TableCell>
                          <EditableInput
                            value={sucursal.nombre}
                            onChange={(value) =>
                              handleInputChange(sucursal.id, "nombre", value)
                            }
                            isSaved={savedFields[`${sucursal.id}-nombre`]}
                          />
                        </TableCell>
                        <TableCell>
                          <EditableInput
                            value={sucursal.ubicacion}
                            onChange={(value) =>
                              handleInputChange(sucursal.id, "ubicacion", value)
                            }
                            isSaved={savedFields[`${sucursal.id}-ubicacion`]}
                          />
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[90vw] md:w-full rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-indigo-gradient font-bold text-2xl">
              Nueva Sucursal
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nombre</label>
              <Input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Nombre de la sucursal"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Ubicación</label>
              <Input
                value={ubicacion}
                onChange={(e) => setUbicacion(e.target.value)}
                placeholder="Dirección de la sucursal"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-indigo-gradient"
              disabled={loading}
            >
              {loading ? "Creando..." : "Crear Sucursal"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
