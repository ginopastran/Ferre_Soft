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
import {
  ArrowRight,
  CreditCard,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState, useEffect, Suspense } from "react";
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
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClientDialog } from "./components/ClientDialog";
import { formatDNI, formatPhoneNumber } from "@/lib/utils/format";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ClientsGridSkeleton } from "./components/ClientsGridSkeleton";

interface Sucursal {
  id: number;
  nombre: string;
  ubicacion: string;
}

type Client = {
  codigo: string;
  nombre: string;
  direccion: string;
  pais: string;
  provincia: string;
  localidad: string;
  situacionIVA: string;
  cuitDni: string;
  telefono?: string;
  email?: string;
};

const clients: Client[] = [
  {
    codigo: "C001",
    nombre: "Juan Pérez",
    direccion: "Av. Corrientes 1234, Buenos Aires",
    pais: "Argentina",
    provincia: "Buenos Aires",
    localidad: "Caseros",
    situacionIVA: "Responsable Inscripto",
    cuitDni: "20-12345678-9",
    telefono: "+54 11 1234-5678",
    email: "juan.perez@email.com",
  },
  {
    codigo: "C002",
    nombre: "María González",
    direccion: "Calle Florida 567, Córdoba",
    pais: "Argentina",
    provincia: "Córdoba",
    localidad: "Caseros",
    situacionIVA: "Responsable Inscripto",
    cuitDni: "27-98765432-1",
    telefono: "+54 351 876-5432",
    email: "maria.gonzalez@email.com",
  },
  // Puedes agregar más clientes aquí
];

function ClientesContent() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [nombre, setNombre] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [loading, setLoading] = useState(true);
  const [savedFields, setSavedFields] = useState<Record<string, boolean>>({});
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
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
    fetchSucursales();
    fetchClients();
  }, []);

  useEffect(() => {
    // Get search from URL when component mounts
    const searchFromUrl = searchParams?.get("search") || "";
    setSearchTerm(searchFromUrl);
  }, [searchParams]);

  // Update filtered clients when search term or clients change
  useEffect(() => {
    const results = clients.filter((client) =>
      Object.values(client).some((value) =>
        value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
    setFilteredClients(results);
  }, [searchTerm, clients]);

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

  const fetchClients = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/clientes");
      if (!response.ok) throw new Error("Error al cargar clientes");
      const data = await response.json();
      setClients(data);
    } catch (error) {
      toast.error("Error al cargar los clientes");
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

  const handleAddClient = () => {
    setIsDialogOpen(true);
  };

  const handleViewDetails = (codigo: string) => {
    router.push(`/admin/clientes/${codigo}`);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setUrlParam("search", value || null);
  };

  const handleCreateClient = async (clientData: Client) => {
    try {
      const response = await fetch("/api/clientes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(clientData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al crear el cliente");
      }

      await fetchClients(); // Recargar la lista
      toast.success("Cliente creado exitosamente");
      return Promise.resolve();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Error al crear el cliente");
      }
      return Promise.reject(error);
    }
  };

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h2 className="text-3xl font-bold tracking-tight text-cyan-gradient">
            Listado de Clientes
          </h2>
        </div>
      </header>
      <div className="h-full flex-1 flex-col space-y-2 p-8 flex max-w-[100vw]">
        <div className="flex gap-4 mb-6 items-center">
          <div className="relative flex-grow">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar clientes..."
              className="pl-8 w-full md:w-1/2 shadow-md"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
          <Button
            onClick={handleAddClient}
            className="bg-cyan-gradient shadow-md"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar Cliente
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {loading ? (
            <ClientsGridSkeleton />
          ) : (
            filteredClients.map((client) => (
              <Card key={client.codigo} className="w-full">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-2xl font-semibold text-cyan-gradient">
                      {client.nombre}
                    </h2>
                    <Badge
                      variant="secondary"
                      className="bg-cyan-gradient text-white text-sm"
                    >
                      {client.codigo}
                    </Badge>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{client.direccion}</span>
                    </div>
                    <div className="flex items-center">
                      <CreditCard className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{formatDNI(client.cuitDni)}</span>
                    </div>
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{formatPhoneNumber(client.telefono || "")}</span>
                    </div>
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{client.email}</span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full bg-cyan-gradient text-white hover:text-white"
                    onClick={() => handleViewDetails(client.codigo)}
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

      <ClientDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={handleCreateClient}
      />
    </>
  );
}

export default function ClientesPage() {
  return (
    <SidebarProvider>
      <AppSidebar activeUrl="/admin/clientes" />
      <SidebarInset>
        <Suspense fallback={<ClientsGridSkeleton />}>
          <ClientesContent />
        </Suspense>
      </SidebarInset>
    </SidebarProvider>
  );
}
