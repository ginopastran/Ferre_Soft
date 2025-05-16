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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Mail, Plus, Shield, Trash2, X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

interface EmailPermitido {
  id: number;
  email: string;
  activo: boolean;
  creadoPor: string;
  creadoEn: string;
}

export default function EmailsPermitidosPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [emails, setEmails] = useState<EmailPermitido[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  // Verificar si el usuario es SUPERADMIN
  useEffect(() => {
    if (user && user.rol && user.rol.nombre !== "SUPERADMIN") {
      toast.error("No tienes permisos para acceder a esta página");
      router.push("/admin/reporte");
    } else {
      fetchEmails();
    }
  }, [user, router]);

  const fetchEmails = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/emails-permitidos");
      if (!response.ok) {
        throw new Error("Error al cargar emails permitidos");
      }
      const data = await response.json();
      setEmails(data);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al cargar emails permitidos");
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newEmail.includes("@")) {
      toast.error("Ingresa un email válido");
      return;
    }

    setIsAdding(true);
    try {
      const response = await fetch("/api/emails-permitidos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: newEmail.trim() }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al añadir email");
      }

      await fetchEmails();
      toast.success("Email permitido añadido correctamente");
      setNewEmail("");
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Error al añadir email");
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggleStatus = async (id: number, activo: boolean) => {
    try {
      const response = await fetch(`/api/emails-permitidos/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ activo: !activo }),
      });

      if (!response.ok) {
        throw new Error("Error al actualizar estado");
      }

      setEmails(
        emails.map((email) =>
          email.id === id ? { ...email, activo: !activo } : email
        )
      );

      toast.success(
        `Email ${!activo ? "activado" : "desactivado"} correctamente`
      );
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al actualizar estado del email");
    }
  };

  const handleDeleteEmail = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar este email?")) {
      return;
    }

    try {
      const response = await fetch(`/api/emails-permitidos/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Error al eliminar email");
      }

      setEmails(emails.filter((email) => email.id !== id));
      toast.success("Email eliminado correctamente");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al eliminar email");
    }
  };

  // Si no hay usuario o no es SUPERADMIN, no renderizar el contenido
  if (!user || (user.rol && user.rol.nombre !== "SUPERADMIN")) {
    return (
      <SidebarProvider>
        <AppSidebar activeUrl="/admin/configuracion/emails-permitidos" />
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
      <AppSidebar activeUrl="/admin/configuracion/emails-permitidos" />
      <SidebarInset>
        <div className="space-y-6">
          <header className="flex h-12 md:h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-2 md:px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-1 md:mr-2 h-4" />
              <h1 className="text-lg font-medium">Emails Permitidos</h1>
            </div>
          </header>

          <div className="p-6">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Gestión de Emails Permitidos</CardTitle>
                <CardDescription>
                  Administra qué direcciones de email están autorizadas para
                  registrarse y acceder al sistema. Todos los demás emails serán
                  rechazados.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddEmail} className="flex space-x-2 mb-6">
                  <div className="flex-1">
                    <Label htmlFor="email" className="sr-only">
                      Email
                    </Label>
                    <Input
                      id="email"
                      placeholder="Ingresa un email..."
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      disabled={isAdding}
                      className="w-full"
                    />
                  </div>
                  <Button type="submit" disabled={isAdding}>
                    {isAdding ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" /> Añadir
                      </>
                    )}
                  </Button>
                </form>

                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                  </div>
                ) : (
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Email</TableHead>
                          <TableHead>Creado por</TableHead>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {emails.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={5}
                              className="text-center py-8 text-muted-foreground"
                            >
                              <Mail className="h-8 w-8 mx-auto mb-2 opacity-40" />
                              <p>No hay emails permitidos configurados</p>
                              <p className="text-sm">
                                Agrega emails para permitir el registro en el
                                sistema
                              </p>
                            </TableCell>
                          </TableRow>
                        ) : (
                          emails.map((email) => (
                            <TableRow key={email.id}>
                              <TableCell className="font-medium">
                                {email.email}
                              </TableCell>
                              <TableCell>{email.creadoPor}</TableCell>
                              <TableCell>
                                {new Date(email.creadoEn).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <Switch
                                    checked={email.activo}
                                    onCheckedChange={() =>
                                      handleToggleStatus(email.id, email.activo)
                                    }
                                  />
                                  <span
                                    className={
                                      email.activo
                                        ? "text-green-600 font-medium"
                                        : "text-red-600 font-medium"
                                    }
                                  >
                                    {email.activo ? "Activo" : "Inactivo"}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteEmail(email.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <p className="text-sm text-muted-foreground">
                  Nota: El email del SUPERADMIN siempre tendrá acceso,
                  independientemente de esta lista.
                </p>
              </CardFooter>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
