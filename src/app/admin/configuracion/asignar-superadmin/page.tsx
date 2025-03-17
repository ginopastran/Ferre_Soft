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
import { Loader2, Shield, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function AsignarSuperAdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error("Debes ingresar un email");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/admin/set-superadmin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error("Error al asignar rol SUPERADMIN");
      }

      const data = await response.json();
      toast.success(data.message);
      setEmail("");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al asignar el rol SUPERADMIN");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar activeUrl="/admin/configuracion" />
      <SidebarInset>
        <div className="space-y-6">
          <header className="flex h-12 md:h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-2 md:px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-1 md:mr-2 h-4" />
              <h1 className="text-lg font-medium">Asignar SUPERADMIN</h1>
            </div>
          </header>

          <div className="p-6">
            <Card className="mb-6 max-w-md mx-auto">
              <CardHeader>
                <CardTitle>Asignar rol SUPERADMIN</CardTitle>
                <CardDescription>
                  Asigna el rol de SUPERADMIN a un usuario por su email. Este
                  rol tendrá acceso a configuraciones avanzadas.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmit}>
                <CardContent>
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email del usuario</Label>
                      <div className="flex">
                        <Input
                          id="email"
                          placeholder="usuario@ejemplo.com"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="flex-1"
                          required
                        />
                      </div>
                    </div>
                    <div className="flex items-center p-3 border rounded-md bg-amber-50 border-amber-200">
                      <User className="h-5 w-5 text-amber-600 mr-2" />
                      <p className="text-sm text-amber-800">
                        Atención: El usuario con rol SUPERADMIN tendrá acceso a
                        configuraciones críticas del sistema.
                      </p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Asignando...
                      </>
                    ) : (
                      "Asignar SUPERADMIN"
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
