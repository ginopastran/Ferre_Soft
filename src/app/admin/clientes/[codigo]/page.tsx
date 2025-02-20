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
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { formatDNI, formatPhoneNumber } from "@/lib/utils/format";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ClientDialog, ClienteForm } from "../components/ClientDialog";

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
  telefono: string | null;
  email: string | null;
  creadoEn: Date;
}

export default function ClientePage() {
  const params = useParams();
  const router = useRouter();
  const [client, setClient] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchClient();
  }, []);

  const fetchClient = async () => {
    try {
      const response = await fetch(`/api/clientes/${params?.codigo}`);
      if (!response.ok) throw new Error("Cliente no encontrado");
      const data = await response.json();
      setClient(data);
    } catch (error) {
      toast.error("Error al cargar el cliente");
      router.push("/admin/clientes");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateClient = async (data: ClienteForm) => {
    try {
      const response = await fetch(`/api/clientes/${params?.codigo}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Error al actualizar el cliente");

      await fetchClient();
      toast.success("Cliente actualizado exitosamente");
    } catch (error) {
      toast.error("Error al actualizar el cliente");
      throw error;
    }
  };

  return (
    <>
      <SidebarProvider>
        <AppSidebar activeUrl={`/admin/clientes`} />
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
                Volver a clientes
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
                          {client?.nombre}
                        </h2>
                        <Badge
                          variant="secondary"
                          className="bg-indigo-gradient text-white text-sm"
                        >
                          {client?.codigo}
                        </Badge>
                        <p className="text-sm text-muted-foreground">
                          Cliente desde:{" "}
                          {client?.creadoEn
                            ? new Date(client.creadoEn).toLocaleDateString()
                            : ""}
                        </p>
                      </div>

                      <Button
                        variant="outline"
                        onClick={() => setIsDialogOpen(true)}
                        className="bg-indigo-gradient text-white hover:text-white"
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Editar Cliente
                      </Button>
                    </div>

                    <div className="flex w-full gap-8 md:gap-20 md:flex-row flex-col">
                      <div className="flex items-center">
                        <MapPin className="h-8 w-8 mr-3 text-muted-foreground" />
                        <div className="flex flex-col gap-0">
                          <span className="block text-lg">
                            {client?.direccion}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {client?.localidad}, {client?.provincia},{" "}
                            {client?.pais}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center">
                        <CreditCard className="h-8 w-8 mr-3 text-muted-foreground" />
                        <div className="flex flex-col gap-0">
                          <span className="block text-lg">
                            {formatDNI(client?.cuitDni || "")}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            CUIT/DNI
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center">
                        <Phone className="h-8 w-8 mr-3 text-muted-foreground" />
                        <div className="flex flex-col gap-0">
                          <span className="block text-lg">
                            {formatPhoneNumber(client?.telefono || "")}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            Teléfono
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center">
                        <Mail className="h-8 w-8 mr-3 text-muted-foreground" />
                        <div className="flex flex-col gap-0">
                          <span className="block text-lg">{client?.email}</span>
                          <span className="text-sm text-muted-foreground">
                            Email
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <div className="space-y-2">
                        <p className="text-base">
                          <span className="text-muted-foreground">
                            Situación IVA:
                          </span>{" "}
                          <span className="font-semibold">
                            {client?.situacionIVA}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </SidebarInset>
      </SidebarProvider>
      <ClientDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={handleUpdateClient}
        initialData={client}
        mode="edit"
      />
    </>
  );
}
