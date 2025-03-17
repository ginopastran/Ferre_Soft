"use client";

import { useState, useEffect } from "react";
import { AppSidebar } from "@/components/admin/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Plus, RefreshCw, Upload } from "lucide-react";

interface Certificate {
  id: number;
  name: string;
  content: string;
  description: string | null;
  type: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AfipConfigPage() {
  return (
    <SidebarProvider>
      <AppSidebar activeUrl="/admin/configuracion" />
      <SidebarInset>
        <AfipConfigContent />
      </SidebarInset>
    </SidebarProvider>
  );
}

function AfipConfigContent() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [newCertificate, setNewCertificate] = useState({
    name: "",
    content: "",
    description: "",
    type: "CERT",
  });
  const [openDialog, setOpenDialog] = useState(false);

  // Cargar certificados
  const fetchCertificates = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/configuracion/afip-certificados");
      if (!response.ok) throw new Error("Error al cargar certificados");
      const data = await response.json();
      setCertificates(data);
    } catch (error) {
      console.error("Error al cargar certificados:", error);
      toast.error("Error al cargar los certificados");
    } finally {
      setLoading(false);
    }
  };

  // Importar certificados desde archivos
  const importCertificates = async () => {
    setImporting(true);
    try {
      const response = await fetch(
        "/api/configuracion/afip-certificados?action=import",
        {
          method: "PATCH",
        }
      );
      if (!response.ok) throw new Error("Error al importar certificados");
      const data = await response.json();
      toast.success("Certificados importados correctamente");
      fetchCertificates();
    } catch (error) {
      console.error("Error al importar certificados:", error);
      toast.error("Error al importar los certificados");
    } finally {
      setImporting(false);
    }
  };

  // Crear nuevo certificado
  const createCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/configuracion/afip-certificados", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newCertificate),
      });
      if (!response.ok) throw new Error("Error al crear certificado");
      toast.success("Certificado creado correctamente");
      setOpenDialog(false);
      setNewCertificate({
        name: "",
        content: "",
        description: "",
        type: "CERT",
      });
      fetchCertificates();
    } catch (error) {
      console.error("Error al crear certificado:", error);
      toast.error("Error al crear el certificado");
    }
  };

  // Actualizar estado activo de un certificado
  const toggleCertificateStatus = async (id: number, isActive: boolean) => {
    try {
      const response = await fetch("/api/configuracion/afip-certificados", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, isActive: !isActive }),
      });
      if (!response.ok) throw new Error("Error al actualizar certificado");
      toast.success(
        `Certificado ${isActive ? "desactivado" : "activado"} correctamente`
      );
      fetchCertificates();
    } catch (error) {
      console.error("Error al actualizar certificado:", error);
      toast.error("Error al actualizar el certificado");
    }
  };

  // Cargar certificados al montar el componente
  useEffect(() => {
    fetchCertificates();
  }, []);

  return (
    <div className="space-y-6">
      <header className="flex h-12 md:h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-2 md:px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-1 md:mr-2 h-4" />
          <h1 className="text-lg font-medium">Configuración AFIP</h1>
        </div>
      </header>

      <div className="p-6">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Certificados AFIP</CardTitle>
            <CardDescription>
              Gestione los certificados utilizados para la conexión con AFIP
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between mb-4">
              <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex gap-2 items-center">
                    <Plus className="h-4 w-4" />
                    Agregar certificado
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Agregar certificado</DialogTitle>
                    <DialogDescription>
                      Ingrese los datos del nuevo certificado o clave privada.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={createCertificate}>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                          Nombre
                        </Label>
                        <Input
                          id="name"
                          value={newCertificate.name}
                          onChange={(e) =>
                            setNewCertificate({
                              ...newCertificate,
                              name: e.target.value,
                            })
                          }
                          className="col-span-3"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="type" className="text-right">
                          Tipo
                        </Label>
                        <select
                          id="type"
                          value={newCertificate.type}
                          onChange={(e) =>
                            setNewCertificate({
                              ...newCertificate,
                              type: e.target.value,
                            })
                          }
                          className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                          required
                        >
                          <option value="CERT">Certificado (CERT)</option>
                          <option value="KEY">Clave privada (KEY)</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="description" className="text-right">
                          Descripción
                        </Label>
                        <Input
                          id="description"
                          value={newCertificate.description}
                          onChange={(e) =>
                            setNewCertificate({
                              ...newCertificate,
                              description: e.target.value,
                            })
                          }
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-start gap-4">
                        <Label htmlFor="content" className="text-right pt-2">
                          Contenido
                        </Label>
                        <Textarea
                          id="content"
                          value={newCertificate.content}
                          onChange={(e) =>
                            setNewCertificate({
                              ...newCertificate,
                              content: e.target.value,
                            })
                          }
                          className="col-span-3 min-h-32"
                          required
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit">Guardar certificado</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

              <Button
                variant="secondary"
                className="flex gap-2 items-center"
                onClick={importCertificates}
                disabled={importing}
              >
                {importing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                Importar desde archivos
              </Button>
            </div>

            {loading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : certificates.length > 0 ? (
              <Table>
                <TableCaption>
                  Lista de certificados disponibles en el sistema
                </TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha de creación</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {certificates.map((cert) => (
                    <TableRow key={cert.id}>
                      <TableCell className="font-medium">{cert.name}</TableCell>
                      <TableCell>
                        {cert.type === "CERT" ? "Certificado" : "Clave privada"}
                      </TableCell>
                      <TableCell>{cert.description || "-"}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            cert.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {cert.isActive ? "Activo" : "Inactivo"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {new Date(cert.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            toggleCertificateStatus(cert.id, cert.isActive)
                          }
                        >
                          {cert.isActive ? "Desactivar" : "Activar"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center p-8 text-muted-foreground">
                No hay certificados registrados. Utilice el botón "Importar
                desde archivos" para cargar los certificados disponibles en el
                sistema.
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              className="flex gap-2 items-center"
              onClick={fetchCertificates}
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4" />
              Actualizar
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
