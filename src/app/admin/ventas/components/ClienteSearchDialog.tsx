import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

interface Cliente {
  id: number;
  codigo: string;
  nombre: string;
  situacionIVA: string;
}

interface ClienteSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClienteSelect: (cliente: Cliente) => void;
}

export function ClienteSearchDialog({
  open,
  onOpenChange,
  onClienteSelect,
}: ClienteSearchDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [filteredClientes, setFilteredClientes] = useState<Cliente[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const clientesPerPage = 10;

  useEffect(() => {
    if (open) {
      fetchClientes();
      setCurrentPage(1);
    }
  }, [open]);

  useEffect(() => {
    if (clientes.length > 0) {
      const filtered = clientes.filter(
        (cliente) =>
          cliente.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cliente.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredClientes(filtered);
      setCurrentPage(1);
    }
  }, [searchTerm, clientes]);

  const fetchClientes = async () => {
    setIsLoading(true);
    setError("");

    try {
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/clientes?nocache=${timestamp}`, {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      });

      if (!response.ok) {
        throw new Error(
          `Error al cargar clientes: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      setClientes(data);
      setFilteredClientes(data);
    } catch (error: any) {
      console.error("Error al cargar clientes:", error);
      setError(`Error: ${error.message || "Error desconocido"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClienteSelect = (cliente: Cliente) => {
    onClienteSelect(cliente);
    onOpenChange(false);
    setSearchTerm("");
  };

  const indexOfLastCliente = currentPage * clientesPerPage;
  const indexOfFirstCliente = indexOfLastCliente - clientesPerPage;
  const currentClientes = filteredClientes.slice(
    indexOfFirstCliente,
    indexOfLastCliente
  );

  const totalPages = Math.ceil(filteredClientes.length / clientesPerPage);

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handleReloadClientes = () => {
    fetchClientes();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] sm:max-h-[80vh] w-[95vw] sm:w-auto p-3 sm:p-6 flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl font-bold text-cyan-gradient text-center">
            Buscar Cliente
          </DialogTitle>
        </DialogHeader>

        <div className="relative mb-3">
          <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por código o nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
            autoFocus
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:justify-between gap-2 sm:items-center mb-3">
          <div className="flex justify-between sm:justify-end items-center w-full sm:w-auto gap-2">
            <div className="text-xs sm:text-sm">
              {filteredClientes.length > 0
                ? `${filteredClientes.length} clientes`
                : isLoading
                ? "Cargando..."
                : "No hay clientes"}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReloadClientes}
              disabled={isLoading}
              className="px-2 py-1 h-8 text-xs sm:text-sm"
            >
              Recargar
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 text-red-800 p-2 rounded text-sm mb-3">
            {error}
          </div>
        )}

        <div className="flex flex-col flex-grow min-h-0">
          <div className="overflow-y-auto overflow-x-auto flex-grow border rounded-md relative">
            <div className="min-w-[600px]">
              <table className="w-full">
                <thead className="sticky top-0 bg-background z-10 shadow-sm">
                  <tr className="border-b">
                    <th className="text-left py-2 px-1 sm:px-2 text-xs sm:text-sm w-[20%]">
                      Código
                    </th>
                    <th className="text-left py-2 px-1 sm:px-2 text-xs sm:text-sm w-[40%]">
                      Nombre
                    </th>
                    <th className="text-left py-2 px-1 sm:px-2 text-xs sm:text-sm w-[25%]">
                      Situación IVA
                    </th>
                    <th className="text-right py-2 px-1 sm:px-2 text-xs sm:text-sm w-[15%]">
                      Acción
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-sm">
                        Cargando clientes...
                      </td>
                    </tr>
                  ) : currentClientes.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="py-4 text-center text-muted-foreground text-sm"
                      >
                        No se encontraron clientes
                      </td>
                    </tr>
                  ) : (
                    currentClientes.map((cliente) => (
                      <tr
                        key={cliente.id}
                        className="border-b hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => handleClienteSelect(cliente)}
                      >
                        <td className="py-1 sm:py-2 px-1 sm:px-2 text-xs sm:text-sm">
                          {cliente.codigo}
                        </td>
                        <td className="py-1 sm:py-2 px-1 sm:px-2 text-xs sm:text-sm">
                          {cliente.nombre}
                        </td>
                        <td className="py-1 sm:py-2 px-1 sm:px-2 text-xs sm:text-sm">
                          {cliente.situacionIVA}
                        </td>
                        <td className="py-1 sm:py-2 px-1 sm:px-2 text-right hidden sm:table-cell">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleClienteSelect(cliente);
                            }}
                            className="bg-cyan-gradient text-white hover:text-white px-1 sm:px-3 py-0 h-7 text-xs sm:text-sm whitespace-nowrap"
                          >
                            Elegir
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="text-xs text-center text-muted-foreground py-1 sm:hidden">
            ← Desliza horizontalmente para ver más →
          </div>

          {filteredClientes.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-3 mt-0 gap-2">
              <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                Mostrando {indexOfFirstCliente + 1}-
                {Math.min(indexOfLastCliente, filteredClientes.length)} de{" "}
                {filteredClientes.length}
              </div>

              <div className="flex items-center justify-center sm:justify-end space-x-1 sm:space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  aria-label="Página anterior"
                  className="px-2 py-0 h-7"
                >
                  <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>

                <span className="text-xs sm:text-sm">
                  {currentPage} / {totalPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  aria-label="Página siguiente"
                  className="px-2 py-0 h-7"
                >
                  <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
