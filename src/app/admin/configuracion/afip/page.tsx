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
import { Loader2, Plus, RefreshCw, Shield, Upload } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

interface Certificate {
  id: number;
  name: string;
  content: string;
  description: string | null;
  type: string;
  environment: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AfipConfigPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Verificar si el usuario es SUPERADMIN
  useEffect(() => {
    if (user && user.rol && user.rol.nombre !== "SUPERADMIN") {
      toast.error("No tienes permisos para acceder a esta página");
      router.push("/admin/reporte");
    }
  }, [user, router]);

  // Si no hay usuario o no es SUPERADMIN, no renderizar el contenido
  if (!user || (user.rol && user.rol.nombre !== "SUPERADMIN")) {
    return (
      <SidebarProvider>
        <AppSidebar activeUrl="/admin/configuracion" />
        <SidebarInset>
          <div className="flex flex-col items-center justify-center h-full">
            <Shield className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Acceso Restringido</h2>
            <p className="text-muted-foreground text-center max-w-md">
              Esta sección está reservada para super administradores. Si
              necesitas acceso, contacta al desarrollador del sistema.
            </p>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

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
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionResult, setConnectionResult] = useState<any>(null);
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);
  const [newCertificate, setNewCertificate] = useState<{
    name: string;
    content: string;
    description: string;
    type: string;
    environment: string | null;
  }>({
    name: "",
    content: "",
    description: "",
    type: "CERT",
    environment: null,
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
        environment: null,
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

  // Probar conexión con AFIP
  const testAfipConnection = async () => {
    setTestingConnection(true);
    setConnectionResult(null);

    try {
      const response = await fetch("/api/afip/test-connection");
      if (!response.ok) throw new Error("Error al probar conexión con AFIP");

      const data = await response.json();
      setConnectionResult(data);
      setShowConnectionDialog(true);

      // Verificar si la conexión fue exitosa
      const isSuccessful =
        data.steps &&
        data.steps[5] &&
        data.steps[5].status === "OK" &&
        data.steps[0] &&
        data.steps[0].status === "OK";

      if (isSuccessful) {
        toast.success("Conexión con AFIP establecida correctamente");
      } else {
        toast.error("No se pudo establecer conexión con AFIP");
      }
    } catch (error) {
      console.error("Error al probar conexión con AFIP:", error);
      toast.error("Error al probar conexión con AFIP");
    } finally {
      setTestingConnection(false);
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
              <div className="flex gap-2">
                <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex gap-2 items-center"
                    >
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
                            className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            required
                          >
                            <option value="">Seleccionar...</option>
                            <option value="CERT">Certificado (CERT)</option>
                            <option value="KEY">Clave Privada (KEY)</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="environment" className="text-right">
                            Entorno
                          </Label>
                          <select
                            id="environment"
                            value={newCertificate.environment || ""}
                            onChange={(e) =>
                              setNewCertificate({
                                ...newCertificate,
                                environment:
                                  e.target.value === "" ? null : e.target.value,
                              })
                            }
                            className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="">Sin especificar</option>
                            <option value="DEV">Desarrollo (DEV)</option>
                            <option value="PROD">Producción (PROD)</option>
                          </select>
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
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="description" className="text-right">
                            Descripción
                          </Label>
                          <Textarea
                            id="description"
                            value={newCertificate.description || ""}
                            onChange={(e) =>
                              setNewCertificate({
                                ...newCertificate,
                                description: e.target.value,
                              })
                            }
                            className="col-span-3"
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
                  variant="outline"
                  className="flex gap-2 items-center"
                  onClick={testAfipConnection}
                  disabled={testingConnection}
                >
                  {testingConnection ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  {testingConnection ? "Probando..." : "Probar conexión AFIP"}
                </Button>
              </div>

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
                    <TableHead className="w-[100px]">Tipo</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Entorno</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Fecha creación</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {certificates.map((cert) => (
                    <TableRow key={cert.id}>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            cert.type === "CERT"
                              ? "bg-green-100 text-green-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {cert.type}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">{cert.name}</TableCell>
                      <TableCell>
                        {cert.environment ? (
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              cert.environment === "PROD"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {cert.environment}
                          </span>
                        ) : (
                          <span className="text-gray-500 text-xs">
                            Sin especificar
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            cert.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {cert.isActive ? "Activo" : "Inactivo"}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {cert.description || "-"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(cert.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
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

            {/* Diálogo para mostrar resultados de la prueba de conexión */}
            <Dialog
              open={showConnectionDialog}
              onOpenChange={setShowConnectionDialog}
            >
              <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    Resultado de prueba de conexión AFIP
                  </DialogTitle>
                  <DialogDescription>
                    Información detallada sobre la conexión con AFIP
                  </DialogDescription>
                </DialogHeader>

                {connectionResult && (
                  <div className="mt-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium">Entorno</h3>
                        <p className="text-sm text-muted-foreground">
                          {connectionResult.environment}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium">Fecha de prueba</h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(
                            connectionResult.timestamp
                          ).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="border rounded-md p-4">
                      <h3 className="text-sm font-medium mb-2">
                        Configuración
                      </h3>
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <span className="text-sm text-muted-foreground">
                            CUIT AFIP:
                          </span>
                          <span className="text-sm font-mono">
                            {connectionResult.config.afipCuit}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <span className="text-sm text-muted-foreground">
                            Ruta del certificado:
                          </span>
                          <span className="text-sm font-mono">
                            {connectionResult.config.certPath}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <span className="text-sm text-muted-foreground">
                            Ruta de la clave:
                          </span>
                          <span className="text-sm font-mono">
                            {connectionResult.config.keyPath}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="border rounded-md p-4">
                      <h3 className="text-sm font-medium mb-2">
                        Pasos de verificación
                      </h3>
                      <div className="space-y-3">
                        {connectionResult.steps.map(
                          (step: any, index: number) => (
                            <div
                              key={index}
                              className="border-b pb-2 last:border-b-0 last:pb-0"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">
                                  {step.step}
                                </span>
                                <span
                                  className={`text-xs px-2 py-1 rounded-full ${
                                    step.status === "OK"
                                      ? "bg-green-100 text-green-800"
                                      : step.status === "ADVERTENCIA"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {step.status}
                                </span>
                              </div>
                              {step.error && (
                                <p className="text-xs text-red-500 mt-1">
                                  {step.error}
                                </p>
                              )}
                              {step.result && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {typeof step.result === "object"
                                    ? JSON.stringify(step.result, null, 2)
                                    : step.result.toString()}
                                </p>
                              )}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <DialogFooter>
                  <Button onClick={() => setShowConnectionDialog(false)}>
                    Cerrar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
