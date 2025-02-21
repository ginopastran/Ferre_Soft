"use client";

import { AppSidebar } from "@/components/admin/app-sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  ArrowLeft,
  CreditCard,
  Loader,
  Mail,
  MapPin,
  Phone,
  Pencil,
  Building2,
  DollarSign,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { formatDNI, formatPhoneNumber } from "@/lib/utils/format";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ProveedorDialog } from "../../productos/components/ProveedorDialog";
import { ActualizarPreciosDialog } from "../components/ActualizarPreciosDialog";
import { Proveedor } from "@prisma/client";

// interface Proveedor {
//   id: number;
//   nombre: string;
//   codigo?: string;
//   direccion?: string;
//   cuitDni?: string;
//   telefono?: string;
//   email?: string;
//   creadoEn: Date;
//   actualizadoEn: Date;
// }

export default function ProveedorPage() {
  const params = useParams();
  const router = useRouter();
  const [proveedor, setProveedor] = useState<Proveedor | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isActualizarPreciosOpen, setIsActualizarPreciosOpen] = useState(false);

  useEffect(() => {
    fetchProveedor();
  }, []);

  const fetchProveedor = async () => {
    try {
      const response = await fetch(`/api/proveedores/${params?.id}`);
      if (!response.ok) throw new Error("Proveedor no encontrado");
      const data = await response.json();
      setProveedor(data);
    } catch (error) {
      toast.error("Error al cargar el proveedor");
      router.push("/admin/proveedores");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProveedor = async (data: any) => {
    try {
      const response = await fetch(`/api/proveedores/${params?.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Error al actualizar el proveedor");
      await fetchProveedor();
    } catch (error) {
      throw error;
    }
  };

  return (
    <>
      <SidebarProvider>
        <AppSidebar activeUrl={`/admin/proveedores`} />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Button
                variant="outline"
                onClick={() => router.back()}
                className="flex items-center bg-indigo-gradient text-white hover:text-white"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver a proveedores
              </Button>
            </div>
          </header>
          <div className="h-full px-4 py-6 lg:px-8">
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <Loader className="h-10 w-10 animate-spin" />
              </div>
            ) : (
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div className="flex flex-col md:flex-row justify-between items-start">
                      <div className="flex items-center gap-4 flex-wrap">
                        <h2 className="text-3xl font-bold text-indigo-gradient">
                          {proveedor?.nombre}
                        </h2>
                        {proveedor?.codigo && (
                          <Badge
                            variant="secondary"
                            className="bg-indigo-gradient text-white text-sm"
                          >
                            {proveedor.codigo}
                          </Badge>
                        )}
                        <p className="text-sm text-muted-foreground">
                          Proveedor desde:{" "}
                          {proveedor?.creadoEn
                            ? new Date(proveedor.creadoEn).toLocaleDateString()
                            : ""}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setIsActualizarPreciosOpen(true)}
                          className="bg-indigo-gradient text-white hover:text-white"
                        >
                          <DollarSign className="h-4 w-4 mr-2" />
                          Actualizar Precios
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setIsDialogOpen(true)}
                          className="bg-indigo-gradient text-white hover:text-white"
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          Editar Proveedor
                        </Button>
                      </div>
                    </div>

                    <div className="flex w-full gap-8 md:gap-20 md:flex-row flex-col">
                      {proveedor?.direccion && (
                        <div className="flex items-center">
                          <MapPin className="h-8 w-8 mr-3 text-muted-foreground" />
                          <div className="flex flex-col gap-0">
                            <span className="block text-lg">
                              {proveedor.direccion}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              Dirección
                            </span>
                          </div>
                        </div>
                      )}

                      {proveedor?.cuitDni && (
                        <div className="flex items-center">
                          <CreditCard className="h-8 w-8 mr-3 text-muted-foreground" />
                          <div className="flex flex-col gap-0">
                            <span className="block text-lg">
                              {formatDNI(proveedor.cuitDni)}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              CUIT/DNI
                            </span>
                          </div>
                        </div>
                      )}

                      {proveedor?.telefono && (
                        <div className="flex items-center">
                          <Phone className="h-8 w-8 mr-3 text-muted-foreground" />
                          <div className="flex flex-col gap-0">
                            <span className="block text-lg">
                              {formatPhoneNumber(proveedor.telefono)}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              Teléfono
                            </span>
                          </div>
                        </div>
                      )}

                      {proveedor?.email && (
                        <div className="flex items-center">
                          <Mail className="h-8 w-8 mr-3 text-muted-foreground" />
                          <div className="flex flex-col gap-0">
                            <span className="block text-lg">
                              {proveedor.email}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              Email
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </SidebarInset>
      </SidebarProvider>
      <ProveedorDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={handleUpdateProveedor}
        initialData={proveedor}
        mode="edit"
      />
      <ActualizarPreciosDialog
        open={isActualizarPreciosOpen}
        onOpenChange={setIsActualizarPreciosOpen}
        proveedorId={proveedor?.id}
      />
    </>
  );
}
